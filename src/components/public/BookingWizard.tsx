"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format, addDays, differenceInHours, parseISO } from "date-fns";
import { CheckCircle, Loader2, Plus, Minus, MapPin, AlertCircle } from "lucide-react";
import { GAMES } from "@/data/games";
import { calculatePricing, formatCurrency, DEFAULT_PRICING } from "@/lib/pricing";

type Step = "dates" | "games" | "details" | "review" | "submitted";

export default function BookingWizard() {
  const searchParams = useSearchParams();
  const preselectedGame = searchParams.get("game");

  const today = format(new Date(), "yyyy-MM-dd");
  const twoDaysLater = format(addDays(new Date(), 2), "yyyy-MM-dd");

  const [step, setStep] = useState<Step>("dates");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Dates & delivery
  const [pickupDate, setPickupDate] = useState(today);
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState(twoDaysLater);
  const [returnTime, setReturnTime] = useState("10:00");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "one_way" | "round_trip">("pickup");
  const [eventAddress, setEventAddress] = useState("");
  const [deliveryMiles, setDeliveryMiles] = useState(0);
  const [calculatingMiles, setCalculatingMiles] = useState(false);

  // Step 2: Games
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (preselectedGame) init[preselectedGame] = 1;
    return init;
  });
  const [availability, setAvailability] = useState<Record<string, number>>({});

  // Step 3: Contact
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [gameRequest, setGameRequest] = useState("");

  const selectedItems = GAMES.filter((g) => g.active && (quantities[g.id] || 0) > 0).map(
    (g) => ({
      inventoryId: g.id,
      displayName: g.displayName,
      price: g.price,
      quantity: quantities[g.id],
    })
  );

  const rentalHours = (() => {
    try {
      const start = parseISO(`${pickupDate}T${pickupTime}`);
      const end = parseISO(`${returnDate}T${returnTime}`);
      return Math.max(48, differenceInHours(end, start));
    } catch {
      return 48;
    }
  })();

  const pricing = calculatePricing(
    selectedItems,
    deliveryType,
    deliveryMiles,
    rentalHours,
    DEFAULT_PRICING
  );

  // Calculate delivery miles via Google Maps when address changes
  async function calculateDelivery(address: string) {
    if (!address || deliveryType === "pickup") return;
    setCalculatingMiles(true);
    try {
      const res = await fetch("/api/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (res.ok && data.miles) setDeliveryMiles(data.miles);
    } catch {
      // silently fail — user still gets to submit
    } finally {
      setCalculatingMiles(false);
    }
  }

  // Check availability when moving from dates to games
  async function checkAndAdvance() {
    setError("");
    if (!pickupDate || !returnDate) {
      setError("Please enter pickup and return dates.");
      return;
    }
    if (deliveryType !== "pickup" && !eventAddress.trim()) {
      setError("Please enter your event address for delivery.");
      return;
    }
    if (deliveryType !== "pickup" && deliveryMiles === 0) {
      await calculateDelivery(eventAddress);
    }

    // Check availability
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupDate, pickupTime, returnDate, returnTime }),
      });
      const data = await res.json();
      if (res.ok) {
        const avMap: Record<string, number> = {};
        for (const r of data.results) {
          avMap[r.inventoryId] = r.quantityAvailable;
        }
        setAvailability(avMap);
      }
    } catch {
      // Don't block — show all games, server will validate on submit
    }
    setStep("games");
  }

  function setQty(id: string, delta: number) {
    setQuantities((prev) => {
      const max = availability[id] ?? 99;
      const next = Math.max(0, Math.min(max, (prev[id] || 0) + delta));
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }

  async function submit() {
    setError("");
    if (selectedItems.length === 0) {
      setError("Please select at least one game.");
      return;
    }
    if (!customerName.trim() || !email.trim() || !phone.trim()) {
      setError("Name, email, and phone are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          email,
          phone,
          eventAddress,
          deliveryType,
          deliveryMiles,
          pickupDate,
          pickupTime,
          returnDate,
          returnTime,
          items: pricing.items,
          subtotal: pricing.subtotal,
          discountTotal: pricing.discountTotal,
          deliveryFee: pricing.deliveryFee,
          deliveryTotal: pricing.deliveryTotal,
          grandTotal: pricing.grandTotal,
          rentalHours,
          eventNotes,
          gameRequest: gameRequest || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reservation failed");
      setStep("submitted");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "submitted") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
        <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Reservation Request Received!</h2>
        <p className="text-gray-600 mb-2">
          Thanks, <strong>{customerName}</strong>! We'll review your request and reach out within 24 hours.
        </p>
        <p className="text-gray-500 text-sm">
          Check your email at <strong>{email}</strong> for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Progress bar */}
      <div className="bg-green-50 border-b border-green-100 px-6 py-4">
        <div className="flex items-center gap-2">
          {(["dates", "games", "details", "review"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step === s
                    ? "bg-green-700 text-white"
                    : ["dates", "games", "details", "review"].indexOf(step) > i
                    ? "bg-green-200 text-green-800"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs font-medium text-gray-500 capitalize hidden sm:block">
                {s === "dates" ? "Dates & Delivery" : s === "games" ? "Pick Games" : s === "details" ? "Your Info" : "Review"}
              </span>
              {i < 3 && <div className="flex-1 h-0.5 bg-gray-200 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* STEP 1: Dates & Delivery */}
        {step === "dates" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">When is your event?</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                <input
                  type="date"
                  value={pickupDate}
                  min={today}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time *</label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
                <input
                  type="date"
                  value={returnDate}
                  min={pickupDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Time *</label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Option *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setDeliveryType("pickup"); setDeliveryMiles(0); }}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    deliveryType === "pickup"
                      ? "border-green-700 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">🏠 Free Pickup</div>
                  <div className="text-sm text-gray-600 mt-1">You pick up &amp; return in St. Peters, MO</div>
                  <div className="text-sm font-bold text-green-700 mt-1">Free</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("one_way")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    deliveryType === "one_way"
                      ? "border-green-700 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">🚚 One-Way Delivery</div>
                  <div className="text-sm text-gray-600 mt-1">We deliver to you; you return to St. Peters — or vice versa</div>
                  <div className="text-sm font-bold text-green-700 mt-1">From $15 (one direction)</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("round_trip")}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    deliveryType === "round_trip"
                      ? "border-green-700 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">🔄 Round Trip Delivery</div>
                  <div className="text-sm text-gray-600 mt-1">We deliver &amp; pick up — you never leave your event</div>
                  <div className="text-sm font-bold text-green-700 mt-1">From $30 (both directions)</div>
                </button>
              </div>
            </div>

            {deliveryType !== "pickup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin size={14} className="inline mr-1" />
                  Event Address *
                </label>
                <input
                  type="text"
                  value={eventAddress}
                  onChange={(e) => setEventAddress(e.target.value)}
                  onBlur={() => calculateDelivery(eventAddress)}
                  placeholder="123 Main St, St. Louis, MO 63101"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {calculatingMiles && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Calculating delivery distance…
                  </p>
                )}
                {deliveryMiles > 0 && !calculatingMiles && (
                  <div className="mt-2 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-gray-900">
                    <strong>{deliveryMiles.toFixed(1)} miles</strong> from St. Peters ·{" "}
                    <strong>{formatCurrency(pricing.deliveryFee)}</strong> per direction ·{" "}
                    Your total delivery: <strong>{formatCurrency(pricing.deliveryTotal)}</strong>
                  </div>
                )}
                {deliveryMiles > 60 && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={14} /> This address is outside our 60-mile service area. Contact us to discuss.
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={checkAndAdvance}
              className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-colors"
            >
              Check Availability →
            </button>
          </div>
        )}

        {/* STEP 2: Pick Games */}
        {step === "games" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pick Your Games</h2>
              {selectedItems.length >= 2 && (
                <span className="text-sm bg-green-100 text-green-800 rounded-full px-3 py-1 font-medium">
                  Multi-game discount applied!
                </span>
              )}
            </div>

            <div className="space-y-3">
              {GAMES.filter((g) => g.active).map((game) => {
                const qty = quantities[game.id] || 0;
                const avail = availability[game.id] ?? game.quantity;
                const unavailable = avail === 0;

                return (
                  <div
                    key={game.id}
                    className={`border rounded-xl p-4 flex items-center justify-between gap-4 ${
                      qty > 0
                        ? "border-green-500 bg-green-50"
                        : unavailable
                        ? "border-gray-200 bg-gray-50 opacity-60"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{game.displayName}</span>
                        {unavailable ? (
                          <span className="text-xs bg-red-100 text-red-700 rounded px-2 py-0.5 font-medium">
                            Unavailable
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-0.5 font-medium">
                            Available
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{game.tagline}</div>
                      <div className="text-sm font-bold text-green-700 mt-0.5">
                        {formatCurrency(game.price)}/48hrs
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setQty(game.id, -1)}
                        disabled={qty === 0}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:bg-gray-100"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-bold text-gray-900">{qty}</span>
                      <button
                        onClick={() => setQty(game.id, 1)}
                        disabled={unavailable || qty >= avail}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-30 hover:bg-gray-100"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Don't see what you're looking for?
              </label>
              <input
                type="text"
                value={gameRequest}
                onChange={(e) => setGameRequest(e.target.value)}
                placeholder="Request a game (e.g. Giant Chess, Spikeball, Bocce Ball…)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">We'll do our best to accommodate — we'll reach out if we can make it happen.</p>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("dates")}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (selectedItems.length === 0) {
                    setError("Please select at least one game.");
                    return;
                  }
                  setError("");
                  setStep("details");
                }}
                className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Contact Info */}
        {step === "details" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Your Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Questions <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  rows={3}
                  placeholder="Event details, special instructions, anything we should know..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("games")}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!customerName.trim() || !email.trim() || !phone.trim()) {
                    setError("Name, email, and phone are required.");
                    return;
                  }
                  setError("");
                  setStep("review");
                }}
                className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800"
              >
                Review Order →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === "review" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Review Your Order</h2>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup</span>
                <span className="text-gray-900">{pickupDate} at {pickupTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Return</span>
                <span className="text-gray-900">{returnDate} at {returnTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span className="text-gray-900">
                  {deliveryType === "pickup"
                    ? "Free Pickup in St. Peters"
                    : deliveryType === "one_way"
                    ? `One-Way — ${eventAddress}`
                    : `Round Trip — ${eventAddress}`}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {pricing.items.map((item) => (
                <div key={item.inventoryId} className="flex justify-between text-sm">
                  <span className="text-gray-900">
                    {item.quantity}× {item.displayName}
                  </span>
                  <span className="text-gray-900">{formatCurrency(item.quantity * item.unitPrice)}</span>
                </div>
              ))}
              {pricing.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Multi-game discount ({pricing.discountPct}%)</span>
                  <span>-{formatCurrency(pricing.discountTotal)}</span>
                </div>
              )}
              {pricing.deliveryTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">
                    Delivery ({formatCurrency(pricing.deliveryFee)}/direction ×{" "}
                    {deliveryType === "round_trip" ? "2" : "1"})
                  </span>
                  <span className="text-gray-900">{formatCurrency(pricing.deliveryTotal)}</span>
                </div>
              )}
              {pricing.additionalHoursCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">Extended rental charge</span>
                  <span className="text-gray-900">{formatCurrency(pricing.additionalHoursCharge)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span className="text-gray-900">Estimated Total</span>
                <span className="text-green-700">{formatCurrency(pricing.grandTotal)}</span>
              </div>
              <p className="text-xs text-gray-500">Final pricing confirmed when we send your agreement.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              <strong>What happens next:</strong> We'll review your request and send a confirmation email within 24 hours, along with your rental agreement to sign.
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("details")}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {submitting ? "Submitting…" : "Submit Reservation Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
