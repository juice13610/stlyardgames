import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
import { sendContractEmail } from "@/lib/email";
import { publishShifts } from "@/lib/connecteam";

export async function POST(req: NextRequest) {
  try {
    const { reservationId, customNotes } = await req.json();
    if (!reservationId) return Response.json({ error: "reservationId required" }, { status: 400 });

    const resDoc = await adminDb.collection("reservations").doc(reservationId).get();
    if (!resDoc.exists) return Response.json({ error: "Reservation not found" }, { status: 404 });

    const reservation = { id: resDoc.id, ...resDoc.data() } as any;

    // Create contract
    const contractRef = await adminDb.collection("contracts").add({
      reservationId,
      customNotes: customNotes || "",
      signedAt: null,
      signerName: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update reservation
    await adminDb.collection("reservations").doc(reservationId).update({
      contractId: contractRef.id,
      status: "contract_sent",
      updatedAt: FieldValue.serverTimestamp(),
    });

    const contract = { id: contractRef.id, reservationId, customNotes: customNotes || "" };

    // Send contract email
    await sendContractEmail(reservation, contract as any);

    return Response.json({ contractId: contractRef.id }, { status: 201 });
  } catch (e: any) {
    console.error("Contract creation error:", e);
    return Response.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
