"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot, query, orderBy, where, Timestamp } from "firebase/firestore";
import { formatCurrency } from "@/lib/pricing";
import { format } from "date-fns";
import Link from "next/link";
import { Loader2, TrendingUp, Clock, CheckCircle, DollarSign } from "lucide-react";
import { ReservationStatus } from "@/types";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  inquiry: "bg-blue-100 text-blue-800",
  pending_contract: "bg-yellow-100 text-yellow-800",
  contract_sent: "bg-orange-100 text-orange-800",
  contract_signed: "bg-purple-100 text-purple-800",
  invoiced: "bg-indigo-100 text-indigo-800",
  paid: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
  inquiry: "Inquiry",
  pending_contract: "Pending",
  contract_sent: "Contract Sent",
  contract_signed: "Signed",
  invoiced: "Invoiced",
  paid: "Paid",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const active = reservations.filter((r) => !["completed", "cancelled"].includes(r.status));
  const totalRevenue = reservations
    .filter((r) => r.status === "paid" || r.status === "completed")
    .reduce((s, r) => s + (r.grandTotal || 0), 0);
  const pendingRevenue = reservations
    .filter((r) => ["inquiry", "pending_contract", "contract_sent", "contract_signed", "invoiced"].includes(r.status))
    .reduce((s, r) => s + (r.grandTotal || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Active Reservations",
            value: active.length,
            icon: <Clock size={20} className="text-blue-600" />,
            bg: "bg-blue-50",
          },
          {
            label: "Total Reservations",
            value: reservations.length,
            icon: <TrendingUp size={20} className="text-purple-600" />,
            bg: "bg-purple-50",
          },
          {
            label: "Revenue Collected",
            value: formatCurrency(totalRevenue),
            icon: <DollarSign size={20} className="text-green-600" />,
            bg: "bg-green-50",
          },
          {
            label: "Pending Revenue",
            value: formatCurrency(pendingRevenue),
            icon: <CheckCircle size={20} className="text-orange-600" />,
            bg: "bg-orange-50",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-5 border border-white/50`}>
            <div className="flex items-center gap-2 mb-2">
              {stat.icon}
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent reservations */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Recent Reservations</h2>
          <Link href="/admin/reservations" className="text-sm text-green-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-6 py-3">Customer</th>
                <th className="text-left px-6 py-3">Items</th>
                <th className="text-left px-6 py-3">Pickup</th>
                <th className="text-left px-6 py-3">Total</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.slice(0, 20).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{r.customerName}</div>
                    <div className="text-gray-500 text-xs">{r.email}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {r.items?.map((i: any) => i.displayName).join(", ")}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {r.pickupDate?.toDate?.()
                      ? format(r.pickupDate.toDate(), "MM/dd/yy")
                      : "—"}
                  </td>
                  <td className="px-6 py-3 font-medium text-green-700">
                    {formatCurrency(r.grandTotal || 0)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[r.status as ReservationStatus] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[r.status as ReservationStatus] || r.status}
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
          {reservations.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">No reservations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
