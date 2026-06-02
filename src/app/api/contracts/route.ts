import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendContractEmail } from "@/lib/email";
import { createShifts, buildReservationNote } from "@/lib/connecteam";

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

    // Create unpublished Connecteam shift
    try {
      const pickupTs = reservation.pickupDate?.toDate ? reservation.pickupDate.toDate() : new Date(reservation.pickupDate);
      const returnTs = reservation.returnDate?.toDate ? reservation.returnDate.toDate() : new Date(reservation.returnDate);
      const startTime = Math.floor(pickupTs.getTime() / 1000);
      const endTime = Math.floor(returnTs.getTime() / 1000);

      const note = buildReservationNote({
        customerName: reservation.customerName,
        phone: reservation.phone,
        email: reservation.email,
        eventAddress: reservation.eventAddress || "Customer Pickup",
        items: reservation.items || [],
        deliveryType: reservation.deliveryType,
        deliveryFee: reservation.deliveryTotal || 0,
        grandTotal: reservation.grandTotal || 0,
        notes: reservation.eventNotes,
      });

      const shiftIds = await createShifts([{
        title: `${reservation.customerName} — Rental`,
        startTime,
        endTime,
        isPublished: false,
        isOpenShift: true,
        openSpotsCount: 1,
        notes: [{ type: "html", html: note }],
      }]);

      await adminDb.collection("reservations").doc(reservationId).update({
        connecteamShiftIds: shiftIds.reduce((acc, id, i) => ({ ...acc, [`shift_${i}`]: id }), {}),
      });
    } catch (shiftErr) {
      console.error("Connecteam shift creation failed (non-fatal):", shiftErr);
    }

    // Send contract email
    await sendContractEmail(reservation, contract as any);

    return Response.json({ contractId: contractRef.id }, { status: 201 });
  } catch (e: any) {
    console.error("Contract creation error:", e);
    return Response.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
