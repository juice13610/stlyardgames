"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AvailabilityResult {
  inventoryId: string;
  displayName: string;
  available: boolean;
  quantityAvailable: number;
}

export default function AvailabilityChecker({ defaultGameId }: { defaultGameId?: string }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const twoDaysLater = format(addDays(new Date(), 2), "yyyy-MM-dd");

  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState(twoDaysLater);
  const [returnTime, setReturnTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AvailabilityResult[] | null>(null);
  const [error, setError] = useState("");

  async function check() {
    if (!pickupDate || !returnDate) {
      setError("Please enter pickup and return dates.");
      return;
    }
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupDate, pickupTime, returnDate, returnTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check availability");
      setResults(data.results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const featured = defaultGameId
    ? results?.find((r) => r.inventoryId === defaultGameId)
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
          <input
            type="date"
            value={pickupDate}
            min={today}
            onChange={(e) => setPickupDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
          <input
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
          <input
            type="date"
            value={returnDate}
            min={pickupDate || today}
            onChange={(e) => setReturnDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
          <input
            type="time"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        onClick={check}
        disabled={loading}
        className="w-full sm:w-auto bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors flex items-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Check Availability
      </button>

      {results && (
        <div className="mt-6">
          {featured ? (
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                featured.available
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {featured.available ? (
                <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
              ) : (
                <XCircle size={24} className="text-red-500 flex-shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {featured.available ? "Available for your dates!" : "Not available for those dates"}
                </div>
                {featured.available ? (
                  <div className="text-sm">
                    {featured.quantityAvailable} unit{featured.quantityAvailable !== 1 ? "s" : ""} available
                  </div>
                ) : (
                  <div className="text-sm">Try a different date range or check other games.</div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">All Game Availability</h3>
              <div className="space-y-2">
                {results.map((r) => (
                  <div
                    key={r.inventoryId}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                      r.available
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <span className="font-medium text-gray-800">{r.displayName}</span>
                    {r.available ? (
                      <span className="flex items-center gap-1 text-green-700 font-semibold">
                        <CheckCircle size={14} /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-500">
                        <XCircle size={14} /> Unavailable
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
