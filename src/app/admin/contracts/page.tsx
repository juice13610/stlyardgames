"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { CheckCircle, Clock, Copy, ExternalLink, Loader2 } from "lucide-react";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [reservations, setReservations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "signed" | "unsigned">("all");

  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, "contracts"), orderBy("createdAt", "desc")),
      (snap) => {
        setContracts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    const unsub2 = onSnapshot(collection(db, "reservations"), (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }));
      setReservations(map);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const filtered = contracts.filter((c) => {
    if (filter === "signed") return !!c.signedAt;
    if (filter === "unsigned") return !c.signedAt;
    return true;
  });

  const signed = contracts.filter((c) => c.signedAt).length;
  const unsigned = contracts.filter((c) => !c.signedAt).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contracts</h1>

      <div className="flex gap-3 mb-6">
        {([["all", contracts.length], ["signed", signed], ["unsigned", unsigned]] as const).map(
          ([f, count]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                filter === f
                  ? "bg-green-700 text-white border-green-700"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
            </button>
          )
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-6 py-3">Customer</th>
              <th className="text-left px-6 py-3">Sent</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Signed By</th>
              <th className="text-left px-6 py-3">Signed Date</th>
              <th className="text-left px-6 py-3">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => {
              const res = reservations[c.reservationId];
              const contractUrl = `${typeof window !== "undefined" ? window.location.origin : "https://stlyardgames.com"}/contract/${c.id}`;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{res?.customerName || "—"}</div>
                    <div className="text-xs text-gray-400">{res?.email}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {c.createdAt?.toDate ? format(c.createdAt.toDate(), "MM/dd/yy") : "—"}
                  </td>
                  <td className="px-6 py-3">
                    {c.signedAt ? (
                      <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                        <CheckCircle size={12} /> Signed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-600 text-xs font-medium">
                        <Clock size={12} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{c.signerName || "—"}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {c.signedAt?.toDate ? format(c.signedAt.toDate(), "MM/dd/yy") : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(contractUrl)}
                        className="p-1.5 border border-gray-200 rounded hover:bg-gray-100"
                        title="Copy link"
                      >
                        <Copy size={12} />
                      </button>
                      <a
                        href={contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 border border-gray-200 rounded hover:bg-gray-100"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">No contracts found.</div>
        )}
      </div>
    </div>
  );
}
