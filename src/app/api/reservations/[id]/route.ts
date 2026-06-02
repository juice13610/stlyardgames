import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { deleteShift } from "@/lib/connecteam";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = adminDb.collection("reservations").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return Response.json({ error: "Reservation not found" }, { status: 404 });
    }

    const data = snap.data() as any;

    // Delete Connecteam shifts (best-effort)
    if (data.connecteamShiftIds) {
      const shiftIds = Object.values(data.connecteamShiftIds) as string[];
      await Promise.allSettled(shiftIds.map((sid) => deleteShift(sid)));
    }

    // Void QBO invoice if present (best-effort)
    // QBO doesn't allow deletion — we void it instead via the QBO API
    // For now we just log the invoice ID so it can be manually voided
    if (data.qboInvoiceId) {
      console.log(`QBO invoice ${data.qboInvoiceId} (${data.qboDocNumber}) should be voided manually.`);
    }

    // Delete the reservation document
    await docRef.delete();

    return Response.json({ success: true });
  } catch (e: any) {
    console.error("Delete reservation error:", e);
    return Response.json({ error: e?.message || "Failed to delete reservation" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await adminDb.collection("reservations").doc(id).update({
      ...body,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ success: true });
  } catch (e: any) {
    console.error("Update reservation error:", e);
    return Response.json({ error: e?.message || "Failed to update reservation" }, { status: 500 });
  }
}
