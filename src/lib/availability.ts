import { adminDb } from "@/lib/firebase/admin";
import { GAMES } from "@/data/games";
import { AvailabilityResult } from "@/types";
import { Timestamp } from "firebase-admin/firestore";

// Checks availability for all (or specific) items during the requested rental window.
// An item is UNAVAILABLE only when ALL physical units are reserved.
export async function checkAvailability(
  pickupDate: Date,
  returnDate: Date,
  itemIds?: string[] // if omitted, checks all active items
): Promise<AvailabilityResult[]> {
  const games = GAMES.filter(
    (g) => g.active && (!itemIds || itemIds.includes(g.id))
  );

  // Load all reservations that overlap with the requested window
  // A reservation overlaps if: reservation.pickupDate < returnDate AND reservation.returnDate > pickupDate
  const snapshot = await adminDb
    .collection("reservations")
    .where("pickupDate", "<", Timestamp.fromDate(returnDate))
    .get();

  const overlapping = snapshot.docs
    .map((d: any) => ({ id: d.id, ...d.data() }))
    .filter((r: any) => r.status !== "cancelled" && r.returnDate.toDate() > pickupDate);

  return games.map((game) => {
    // Count how many units of this game are booked during the window
    let bookedCount = 0;
    for (const res of overlapping as any[]) {
      for (const item of res.items || []) {
        if (item.inventoryId === game.id) {
          bookedCount += item.quantity;
        }
      }
    }
    const quantityAvailable = game.quantity - bookedCount;
    return {
      inventoryId: game.id,
      displayName: game.displayName,
      available: quantityAvailable > 0,
      quantityAvailable: Math.max(0, quantityAvailable),
    };
  });
}
