import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createInvoice, getInvoices, sendInvoice } from "@/lib/quickbooks";
import { sendInvoiceEmail } from "@/lib/email";
import { format, addDays } from "date-fns";

export async function GET() {
  try {
    const invoices = await getInvoices();
    return Response.json({ invoices });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { reservationId } = await req.json();
    if (!reservationId) return Response.json({ error: "reservationId required" }, { status: 400 });

    const resDoc = await adminDb.collection("reservations").doc(reservationId).get();
    if (!resDoc.exists) return Response.json({ error: "Reservation not found" }, { status: 404 });

    const reservation = { id: resDoc.id, ...resDoc.data() } as any;

    if (reservation.qboInvoiceId) {
      return Response.json({ error: "Invoice already exists" }, { status: 409 });
    }

    // Build line items from reservation
    const lines = (reservation.items || []).map((item: any) => ({
      displayName: item.displayName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      description: `${item.displayName} — 48-hr rental`,
    }));

    const dueDate = format(addDays(new Date(), 7), "yyyy-MM-dd");

    const invoice = await createInvoice({
      customerName: reservation.customerName,
      email: reservation.email,
      lines,
      deliveryTotal: reservation.deliveryTotal,
      discountTotal: reservation.discountTotal,
      dueDate,
      memo: `STL Yard Games rental — pickup ${format(reservation.pickupDate.toDate(), "MMM d")}`,
    });

    // Send invoice email from QBO
    await sendInvoice(invoice.Id, reservation.email || resData?.email);

    // Store invoice reference on reservation
    await adminDb.collection("reservations").doc(reservationId).update({
      qboInvoiceId: invoice.Id,
      qboInvoiceUrl: invoice.InvoiceLink || "",
      qboDocNumber: invoice.DocNumber,
      status: "invoiced",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Also send branded email
    try {
      const updated = { ...reservation, qboInvoiceId: invoice.Id, qboInvoiceUrl: invoice.InvoiceLink || "" };
      await sendInvoiceEmail(updated, invoice.InvoiceLink || "", invoice.DocNumber);
    } catch (emailErr) {
      console.error("Invoice email error (non-fatal):", emailErr);
    }

    return Response.json({
      invoiceId: invoice.Id,
      docNumber: invoice.DocNumber,
      url: invoice.InvoiceLink,
    });
  } catch (e: any) {
    console.error("Invoice creation error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
