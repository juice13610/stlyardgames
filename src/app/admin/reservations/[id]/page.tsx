"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { formatCurrency } from "@/lib/pricing";
import { format } from "date-fns";
import { Loader2, Send, FileText, CheckCircle, Copy, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReservationStatus } from "@/types";
import { use } from "react";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  inquiry: "Inquiry",
  pending_contract: "Pending Contract",
  contract_sent: "Contract Sent",
  contract_signed: "Contract Signed",
  invoiced: "Invoiced",
  paid: "Paid",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

export default function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingContract, setSendingContract] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [contractNotes, setContractNotes] = useState("");
  const [message, setMessage] = useState("");
  const [createInvoiceLoading, setCreateInvoiceLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, "reservations", id), (snap) => {
      if (snap.exists()) setReservation({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [id]);

  async function sendContract() {
    setSendingContract(true);
    setMessage("");
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: id, customNotes: contractNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Contract sent successfully!");
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSendingContract(false);
    }
  }

  async function updateStatus(status: ReservationStatus) {
    setUpdatingStatus(true);
    try {
      await updateDoc(doc(db, "reservations", id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function deleteReservation() {
    if (!confirm(`Delete reservation for ${reservation.customerName}? This will also delete their Connecteam shift. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/admin/reservations");
    } catch (e: any) {
      setMessage(`Error deleting: ${e.message}`);
      setDeleting(false);
    }
  }

  async function createQboInvoice() {
    setCreateInvoiceLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/qbo/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Invoice created and emailed to customer!");
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setCreateInvoiceLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (!reservation) return <div className="p-8 text-gray-500">Reservation not found.</div>;

  const pickupDate = reservation.pickupDate?.toDate?.()
    ? format(reservation.pickupDate.toDate(), "MMMM d, yyyy")
    : "—";
  const returnDate = reservation.returnDate?.toDate?.()
    ? format(reservation.returnDate.toDate(), "MMMM d, yyyy")
    : "—";

  const contractUrl = reservation.contractId
    ? `${typeof window !== "undefined" ? window.location.origin : "https://stlyardgames.com"}/contract/${reservation.contractId}`
    : null;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{reservation.customerName}</h1>
          <p className="text-gray-500">{reservation.email} · {reservation.phone}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[reservation.status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {STATUS_LABELS[reservation.status as ReservationStatus] || reservation.status}
          </span>
          <button
            onClick={deleteReservation}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Rental details */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">Rental Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pickup</span>
              <span>{pickupDate} at {reservation.pickupTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Return</span>
              <span>{returnDate} at {reservation.returnTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery</span>
              <span className="text-right max-w-48">
                {reservation.deliveryType === "delivery"
                  ? reservation.eventAddress
                  : "Pickup in St. Peters"}
              </span>
            </div>
            {reservation.eventNotes && (
              <div className="pt-2 border-t">
                <span className="text-gray-500 block mb-1">Notes</span>
                <span className="text-gray-700">{reservation.eventNotes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">Pricing</h2>
          <div className="space-y-2 text-sm">
            {reservation.items?.map((item: any) => (
              <div key={item.inventoryId} className="flex justify-between">
                <span>{item.quantity}× {item.displayName}</span>
                <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
            {reservation.discountTotal > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Multi-game discount</span>
                <span>-{formatCurrency(reservation.discountTotal)}</span>
              </div>
            )}
            {reservation.deliveryTotal > 0 && (
              <div className="flex justify-between">
                <span>Delivery (round trip)</span>
                <span>{formatCurrency(reservation.deliveryTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span>
              <span className="text-green-700">{formatCurrency(reservation.grandTotal || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Contract */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-green-600" /> Contract
          </h2>
          {reservation.contractId ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {reservation.contractSignedAt ? (
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle size={14} /> Signed by {reservation.contractSignerName || "customer"}
                  </span>
                ) : (
                  <span className="text-orange-600">Sent — awaiting signature</span>
                )}
              </div>
              {contractUrl && (
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={contractUrl}
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(contractUrl)}
                    className="p-1.5 border border-gray-200 rounded hover:bg-gray-100"
                    title="Copy link"
                  >
                    <Copy size={14} />
                  </button>
                  <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 border border-gray-200 rounded hover:bg-gray-100">
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={contractNotes}
                onChange={(e) => setContractNotes(e.target.value)}
                rows={2}
                placeholder="Optional custom notes for the contract…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <button
                onClick={sendContract}
                disabled={sendingContract}
                className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-800 disabled:opacity-60"
              >
                {sendingContract ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Book It — Send Contract
              </button>
            </div>
          )}
        </div>

        {/* Invoice */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-green-600" /> Invoice
          </h2>
          {reservation.qboInvoiceId ? (
            <div className="space-y-2 text-sm">
              <div>Invoice #{reservation.qboDocNumber}</div>
              {reservation.qboInvoiceUrl && (
                <a
                  href={reservation.qboInvoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-700 hover:underline"
                >
                  View in QuickBooks <ExternalLink size={12} />
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {reservation.contractSignedAt
                  ? "Contract signed — ready to invoice."
                  : "Contract must be signed before invoicing."}
              </p>
              <button
                onClick={createQboInvoice}
                disabled={createInvoiceLoading || !reservation.contractSignedAt}
                className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-800 disabled:opacity-40"
              >
                {createInvoiceLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                Create &amp; Email Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status management */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="font-bold text-gray-900 mb-4">Update Status</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={reservation.status === s || updatingStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                reservation.status === s
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-gray-600 border-gray-300 hover:border-green-500"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}
    </div>
  );
}
