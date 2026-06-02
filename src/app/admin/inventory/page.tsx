"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot, query } from "firebase/firestore";
import { GAMES } from "@/data/games";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/pricing";
import { Package } from "lucide-react";

export default function InventoryPage() {
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, "reservations")), (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const now = new Date();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {GAMES.filter((g) => g.active).map((game) => {
          const gameReservations = reservations.filter(
            (r) =>
              r.status !== "cancelled" &&
              r.items?.some((i: any) => i.inventoryId === game.id)
          );
          const upcoming = gameReservations
            .filter((r) => r.pickupDate?.toDate?.() > now)
            .sort((a, b) => a.pickupDate.toDate() - b.pickupDate.toDate());
          const past = gameReservations
            .filter((r) => r.returnDate?.toDate?.() <= now)
            .length;
          const totalRevenue = gameReservations
            .filter((r) => r.status === "paid" || r.status === "completed")
            .reduce((s, r) => {
              const item = r.items?.find((i: any) => i.inventoryId === game.id);
              return s + (item?.lineTotal || 0);
            }, 0);

          // Is any unit booked right now?
          const bookedNow = gameReservations.filter((r) => {
            const pickup = r.pickupDate?.toDate?.();
            const ret = r.returnDate?.toDate?.();
            return pickup && ret && pickup <= now && ret >= now;
          }).length;
          const availableNow = game.quantity - bookedNow;

          return (
            <div key={game.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-green-600" />
                  <div>
                    <h2 className="font-bold text-gray-900">{game.displayName}</h2>
                    <p className="text-xs text-gray-400">
                      {game.internalIds.join(", ")} · Qty: {game.quantity}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    availableNow > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                  }`}
                >
                  {availableNow > 0 ? `${availableNow} Available` : "All Booked"}
                </span>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-blue-700">{upcoming.length}</div>
                    <div className="text-xs text-blue-500">Upcoming</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xl font-bold text-gray-700">{past}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-green-700">{formatCurrency(totalRevenue)}</div>
                    <div className="text-xs text-green-500">Revenue</div>
                  </div>
                </div>

                {upcoming.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Upcoming Bookings</h3>
                    <div className="space-y-1.5">
                      {upcoming.slice(0, 3).map((r) => (
                        <a
                          key={r.id}
                          href={`/admin/reservations/${r.id}`}
                          className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-800">{r.customerName}</span>
                          <span className="text-gray-500 text-xs">
                            {r.pickupDate?.toDate ? format(r.pickupDate.toDate(), "MMM d") : "—"}
                          </span>
                        </a>
                      ))}
                      {upcoming.length > 3 && (
                        <p className="text-xs text-gray-400 pl-2">+{upcoming.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
