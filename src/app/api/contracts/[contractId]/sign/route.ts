import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { publishShifts } from "@/lib/connecteam";
import { createInvoice, sendInvoice } from "@/lib/quickbooks";
import { sendInvoiceEmail } from "@/lib/email";
import { format, addDays } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;
    const { signerName } = await req.json();

    if (!signerName?.trim()) {
      return Response.json({ error: "Signature is required" }, { status: 400 });
    }

    const contractDoc = await adminDb.collection("contracts").doc(contractId).get();
    if (!contractDoc.exists) {
      return Response.json({ error: "Contract not found" }, { status: 404 });
    }

    const contract = contractDoc.data()!;
    if (contract.signedAt) {
      return Response.json({ error: "Contract already signed" }, { status: 409 });
    }

    const now = Timestamp.now();

    // Mark contract signed
    await adminDb.collection("contracts").doc(contractId).update({
      signedAt: now,
      signerName: signerName.trim(),
    });

    // Update reservation status
    await adminDb.collection("reservations").doc(contract.reservationId).update({
      contractSignedAt: now,
      status: "contract_signed",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Fetch reservation for downstream actions
    const resDoc = await adminDb.collection("reservations").doc(contract.reservationId).get();
    const resData = resDoc.data() as any;

    // Publish Connecteam shifts
    try {
      const shiftIds: string[] = resData?.connecteamShiftIds
        ? Object.values(resData.connecteamShiftIds as Record<string, string>)
        : [];
      if (shiftIds.length > 0) {
        await publishShifts(shiftIds);
      }
    } catch (shiftErr) {
      console.error("Failed to publish shifts on contract sign (non-fatal):", shiftErr);
    }

    // Auto-create QBO invoice
    if (!resData?.qboInvoiceId) {
      try {
        const lines = (resData.items || []).map((item: any) => ({
          displayName: item.displayName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          description: `${item.displayName} — 48-hr rental`,
        }));

        const dueDate = format(addDays(new Date(), 7), "yyyy-MM-dd");
        const pickupDate = resData.pickupDate?.toDate ? resData.pickupDate.toDate() : new Date(resData.pickupDate);

        const invoice = await createInvoice({
          customerName: resData.customerName,
          email: resData.email,
          lines,
          deliveryTotal: resData.deliveryTotal,
          discountTotal: resData.discountTotal,
          dueDate,
          memo: `STL Yard Games rental — pickup ${format(pickupDate, "MMM d")}`,
        });

        try {
          await sendInvoice(invoice.Id, resData?.email);
        } catch (sendErr) {
          console.error("QBO sendInvoice failed (non-fatal):", sendErr);
        }

        await adminDb.collection("reservations").doc(contract.reservationId).update({
          qboInvoiceId: invoice.Id,
          qboInvoiceUrl: invoice.InvoiceLink || "",
          qboDocNumber: invoice.DocNumber,
          status: "invoiced",
          updatedAt: FieldValue.serverTimestamp(),
        });

        try {
          await sendInvoiceEmail(
            { ...resData, qboInvoiceId: invoice.Id, qboInvoiceUrl: invoice.InvoiceLink || "" },
            invoice.InvoiceLink || "",
            invoice.DocNumber
          );
        } catch (emailErr) {
          console.error("Invoice email error (non-fatal):", emailErr);
        }
      } catch (invoiceErr) {
        console.error("Auto-invoice creation failed (non-fatal):", invoiceErr);
      }
    }

    return Response.json({ success: true });
  } catch (e: any) {
    console.error("Contract sign error:", e);
    return Response.json({ error: "Failed to sign contract" }, { status: 500 });
  }
}
