"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ContractSigningForm({
  contractId,
  customerName,
}: {
  contractId: string;
  customerName: string;
}) {
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function sign() {
    setError("");
    if (!agreed) {
      setError("Please confirm you have read and agree to the terms.");
      return;
    }
    if (!signature.trim()) {
      setError("Please type your full name as your signature.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: signature.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign");
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle size={48} className="text-green-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-green-800 mb-2">Agreement Signed!</h2>
        <p className="text-green-700">
          Thank you, <strong>{signature}</strong>! Your reservation is confirmed. You'll receive an invoice shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="font-bold text-gray-900 mb-4">Sign the Agreement</h2>

      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-green-700 flex-shrink-0"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the rental terms and conditions above. I understand my responsibilities for the equipment during the rental period.
          </span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type your full name as your digital signature
          </label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder={`e.g. ${customerName}`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-cursive italic focus:outline-none focus:ring-2 focus:ring-green-500"
            style={{ fontFamily: "'Georgia', serif" }}
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          onClick={sign}
          disabled={submitting}
          className="w-full bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? "Signing…" : "Sign & Confirm Rental"}
        </button>
      </div>
    </div>
  );
}
