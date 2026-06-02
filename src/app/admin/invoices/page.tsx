"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchInvoices() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/qbo/invoices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInvoices(data.invoices || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, []);

  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.TotalAmt || 0), 0);
  const totalPaid = invoices
    .filter((i) => i.Balance === 0 || i.Balance === "0")
    .reduce((s, i) => s + parseFloat(i.TotalAmt || 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={fetchInvoices}
          className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
          {error.includes("not connected") && (
            <span> — <a href="/admin/settings" className="underline">Configure in Settings →</a></span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Invoiced", value: formatCurrency(totalInvoiced), color: "text-gray-900" },
          { label: "Total Paid", value: formatCurrency(totalPaid), color: "text-green-700" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding), color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-6 py-3">Invoice #</th>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Date</th>
              <th className="text-left px-6 py-3">Due</th>
              <th className="text-left px-6 py-3">Amount</th>
              <th className="text-left px-6 py-3">Balance</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((inv) => {
              const paid = parseFloat(inv.Balance || "0") === 0;
              return (
                <tr key={inv.Id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-600">{inv.DocNumber}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {inv.CustomerRef?.name || "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{inv.TxnDate}</td>
                  <td className="px-6 py-3 text-gray-600">{inv.DueDate}</td>
                  <td className="px-6 py-3 font-semibold">
                    {formatCurrency(parseFloat(inv.TotalAmt || "0"))}
                  </td>
                  <td className="px-6 py-3">
                    {formatCurrency(parseFloat(inv.Balance || "0"))}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        paid ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {paid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {inv.InvoiceLink && (
                      <a
                        href={inv.InvoiceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 border border-gray-200 rounded hover:bg-gray-100 inline-flex"
                        title="Open in QuickBooks"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices.length === 0 && !error && (
          <div className="py-12 text-center text-gray-400">No invoices found.</div>
        )}
      </div>
    </div>
  );
}
