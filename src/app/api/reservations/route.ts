import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
import {
  sendReservationConfirmation,
  sendOwnerNotification,
} from "@/lib/email";
import {
  createShifts,
  buildReservationNote,
} from "@/lib/connecteam";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Reservation } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerName,
      email,
      phone,
      eventAddress,
      deliveryType,
      deliveryMiles,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      items,
      subtotal,
      discountTotal,
      deliveryFee,
      deliveryTotal,
      grandTotal,
      rentalHours,
      eventNotes,
    } = body;

    // Basic validation
    if (!customerName || !email || !phone || !items?.length) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pickup = new Date(`${pickupDate}T${pickupTime || "00:00"}`);
    const returnDt = new Date(`${returnDate}T${returnTime || "00:00"}`);

    // Build reservation document
    const reservationData: Record<string, any> = {
      customerName,
      email,
      phone,
      eventAddress: eventAddress || "St. Peters, MO (pickup)",
      eventNotes: eventNotes || "",
      pickupDate: Timestamp.fromDate(pickup),
      pickupTime: pickupTime || "00:00",
      returnDate: Timestamp.fromDate(returnDt),
      returnTime: returnTime || "00:00",
      rentalHours,
      deliveryType,
      deliveryMiles: deliveryMiles || 0,
      deliveryFee: deliveryFee || 0,
      items,
      subtotal,
      discountTotal,
      deliveryTotal,
      grandTotal,
      status: "inquiry",
      createdAt: FieldValue.serverTimestamp() as any,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    const docRef = await adminDb.collection("reservations").add(reservationData);
    const reservationId = docRef.id;

    const reservation = { id: reservationId, ...reservationData } as any;

    // Create a draft Connecteam shift (best-effort — don't fail the reservation if this errors)
    try {
      const startUnix = Math.floor(pickup.getTime() / 1000);
      const endUnix = Math.floor(returnDt.getTime() / 1000);
      const noteHtml = buildReservationNote({
        customerName,
        phone,
        email,
        eventAddress: eventAddress || "St. Peters (pickup)",
        items,
        deliveryType,
        deliveryFee,
        grandTotal,
        notes: eventNotes,
      });

      const shiftIds = await createShifts([
        {
          title: `Rental — ${customerName}`,
          startTime: startUnix,
          endTime: endUnix,
          timezone: "America/Chicago",
          isPublished: false,
          notes: [{ type: "html", html: noteHtml }],
          locationData: eventAddress
            ? {
                isReferencedToJob: false,
                gps: { address: eventAddress },
              }
            : undefined,
        },
      ]);

      if (shiftIds.length > 0) {
        await adminDb.collection("reservations").doc(reservationId).update({
          connecteamShiftIds: { main: shiftIds[0] },
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } catch (shiftErr) {
      console.error("Connecteam shift creation failed (non-fatal):", shiftErr);
    }

    // Send emails (non-blocking — log errors but don't fail the API)
    Promise.allSettled([
      sendReservationConfirmation(reservation),
      sendOwnerNotification(reservation),
    ]).then((results) => {
      results.forEach((r) => {
        if (r.status === "rejected") console.error("Email send error:", r.reason);
      });
    });

    return Response.json({ id: reservationId, status: "inquiry" }, { status: 201 });
  } catch (e: any) {
    console.error("Reservation creation error:", e);
    return Response.json({ error: e?.message || "Failed to create reservation" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Admin only — protected by middleware
  try {
    const snapshot = await adminDb
      .collection("reservations")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const reservations = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return Response.json({ reservations });
  } catch (e: any) {
    console.error("Reservations fetch error:", e);
    return Response.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}
