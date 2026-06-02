"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot, query } from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

const STATUS_COLORS: Record<string, string> = {
  inquiry: "#3b82f6",
  pending_contract: "#eab308",
  contract_sent: "#f97316",
  contract_signed: "#a855f7",
  invoiced: "#6366f1",
  paid: "#22c55e",
  completed: "#6b7280",
  cancelled: "#ef4444",
};

export default function CalendarPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, "reservations"));
    return onSnapshot(q, (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const events = reservations
    .filter((r) => r.status !== "cancelled" && r.pickupDate)
    .map((r) => ({
      id: r.id,
      title: `${r.customerName} — ${r.items?.map((i: any) => i.displayName).join(", ")}`,
      start: r.pickupDate?.toDate?.()?.toISOString(),
      end: r.returnDate?.toDate?.()?.toISOString(),
      backgroundColor: STATUS_COLORS[r.status] || "#6b7280",
      borderColor: STATUS_COLORS[r.status] || "#6b7280",
      extendedProps: r,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }} />
            {s.replace("_", " ")}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={(info) => setSelected(info.event.extendedProps)}
          height="auto"
        />
      </div>

      {/* Event detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">{selected.customerName}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">Email:</span> {selected.email}</div>
              <div><span className="text-gray-500">Phone:</span> {selected.phone}</div>
              <div><span className="text-gray-500">Items:</span> {selected.items?.map((i: any) => i.displayName).join(", ")}</div>
              <div><span className="text-gray-500">Pickup:</span> {selected.pickupDate?.toDate ? format(selected.pickupDate.toDate(), "MMM d, yyyy") : "—"}</div>
              <div><span className="text-gray-500">Return:</span> {selected.returnDate?.toDate ? format(selected.returnDate.toDate(), "MMM d, yyyy") : "—"}</div>
              <div><span className="text-gray-500">Total:</span> <strong className="text-green-700">{formatCurrency(selected.grandTotal || 0)}</strong></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium">{selected.status}</span></div>
            </div>
            <div className="mt-4">
              <a
                href={`/admin/reservations/${selected.id}`}
                className="block text-center bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-800"
              >
                View Full Reservation →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
