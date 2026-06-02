"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot } from "firebase/firestore";
import { formatCurrency } from "@/lib/pricing";
import { format } from "date-fns";
import { Search } from "lucide-react";

interface Customer {
  name: string;
  email: string;
  phone: string;
  reservationCount: number;
  totalSpent: number;
  lastPickup: Date | null;
  reservationIds: string[];
}

export default function CustomersPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    return onSnapshot(collection(db, "reservations"), (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Aggregate reservations by email into customer records
  const customerMap = new Map<string, Customer>();
  for (const r of reservations) {
    if (!r.email) continue;
    const existing = customerMap.get(r.email) || {
      name: r.customerName,
      email: r.email,
      phone: r.phone,
      reservationCount: 0,
      totalSpent: 0,
      lastPickup: null,
      reservationIds: [] as string[],
    };
    existing.reservationCount++;
    if (r.status === "paid" || r.status === "completed") {
      existing.totalSpent += r.grandTotal || 0;
    }
    const pickup = r.pickupDate?.toDate?.();
    if (pickup && (!existing.lastPickup || pickup > existing.lastPickup)) {
      existing.lastPickup = pickup;
    }
    existing.reservationIds.push(r.id);
    customerMap.set(r.email, existing);
  }

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => (b.lastPickup?.getTime() || 0) - (a.lastPickup?.getTime() || 0)
  );

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-72"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Phone</th>
              <th className="text-left px-6 py-3">Reservations</th>
              <th className="text-left px-6 py-3">Total Spent</th>
              <th className="text-left px-6 py-3">Last Pickup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.email} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.email}</div>
                </td>
                <td className="px-6 py-3 text-gray-600">{c.phone}</td>
                <td className="px-6 py-3 text-gray-600">{c.reservationCount}</td>
                <td className="px-6 py-3 font-semibold text-green-700">
                  {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : "—"}
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {c.lastPickup ? format(c.lastPickup, "MMM d, yyyy") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">No customers found.</div>
        )}
      </div>
    </div>
  );
}
