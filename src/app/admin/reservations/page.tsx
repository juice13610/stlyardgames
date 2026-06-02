"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { formatCurrency } from "@/lib/pricing";
import { format } from "date-fns";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { ReservationStatus } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-blue-100 text-blue-800",
  pending_contract: "bg-yellow-100 text-yellow-800",
  contract_sent: "bg-orange-100 text-orange-800",
  contract_signed: "bg-purple-100 text-purple-800",
  invoiced: "bg-indigo-100 text-indigo-800",
  paid: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const ALL_STATUSES: ReservationStatus[] = [
  "inquiry", "pending_contract", "contract_sent", "contract_signed",
  "invoiced", "paid", "completed", "cancelled",
];

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");

  useEffect(() => {
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const filtered = reservations.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.customerName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.includes(q);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reservations</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              statusFilter === "all" ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            All ({reservations.length})
          </button>
          {ALL_STATUSES.map((s) => {
            const count = reservations.filter((r) => r.status === s).length;
            if (count === 0 && statusFilter !== s) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  statusFilter === s
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                {s.replace("_", " ")} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Items</th>
              <th className="text-left px-6 py-3">Pickup</th>
              <th className="text-left px-6 py-3">Return</th>
              <th className="text-left px-6 py-3">Total</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="font-medium text-gray-900">{r.customerName}</div>
                  <div className="text-gray-500 text-xs">{r.phone}</div>
                </td>
                <td className="px-6 py-3 text-gray-600 max-w-48 truncate">
                  {r.items?.map((i: any) => i.displayName).join(", ")}
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {r.pickupDate?.toDate ? format(r.pickupDate.toDate(), "MM/dd/yy") : "—"}
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {r.returnDate?.toDate ? format(r.returnDate.toDate(), "MM/dd/yy") : "—"}
                </td>
                <td className="px-6 py-3 font-semibold text-green-700">
                  {formatCurrency(r.grandTotal || 0)}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.status?.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <Link
                    href={`/admin/reservations/${r.id}`}
                    className="text-green-700 hover:underline text-xs font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">No reservations found.</div>
        )}
      </div>
    </div>
  );
}
