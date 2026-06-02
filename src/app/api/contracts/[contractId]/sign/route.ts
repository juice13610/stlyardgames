import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { publishShifts } from "@/lib/connecteam";

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

    // Publish Connecteam shifts
    try {
      const resDoc = await adminDb
        .collection("reservations")
        .doc(contract.reservationId)
        .get();
      const resData = resDoc.data();
      const shiftIds: string[] = resData?.connecteamShiftIds
        ? Object.values(resData.connecteamShiftIds as Record<string, string>)
        : [];
      if (shiftIds.length > 0) {
        await publishShifts(shiftIds);
      }
    } catch (shiftErr) {
      console.error("Failed to publish shifts on contract sign (non-fatal):", shiftErr);
    }

    return Response.json({ success: true });
  } catch (e: any) {
    console.error("Contract sign error:", e);
    return Response.json({ error: "Failed to sign contract" }, { status: 500 });
  }
}
