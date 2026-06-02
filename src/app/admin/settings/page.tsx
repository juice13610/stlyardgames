"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";

interface ApiKeys {
  connecteamApiKey: string;
  connecteamSchedulerId: string;
  qboClientId: string;
  qboClientSecret: string;
  qboSandbox: boolean;
  resendApiKey: string;
  googleMapsApiKey: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeys>({
    connecteamApiKey: "",
    connecteamSchedulerId: "",
    qboClientId: "",
    qboClientSecret: "",
    qboSandbox: true,
    resendApiKey: "",
    googleMapsApiKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getDoc(doc(db, "settings", "integrations")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setKeys((prev) => ({
          ...prev,
          connecteamSchedulerId: data.connecteamSchedulerId || "",
          qboSandbox: data.qboSandbox ?? true,
          // Sensitive keys are redacted on read — shown as placeholder
        }));
      }
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      // Save non-sensitive settings to Firestore
      await setDoc(
        doc(db, "settings", "integrations"),
        {
          connecteamSchedulerId: keys.connecteamSchedulerId,
          qboSandbox: keys.qboSandbox,
        },
        { merge: true }
      );

      // Save API keys via server-side route (stored as env vars / Secret Manager)
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connecteamApiKey: keys.connecteamApiKey || undefined,
          qboClientId: keys.qboClientId || undefined,
          qboClientSecret: keys.qboClientSecret || undefined,
          resendApiKey: keys.resendApiKey || undefined,
          googleMapsApiKey: keys.googleMapsApiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage("Settings saved. Restart the server for API key changes to take effect.");
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  function toggleShow(field: string) {
    setShowSecrets((p) => ({ ...p, [field]: !p[field] }));
  }

  const SecretInput = ({
    field,
    label,
    placeholder,
  }: {
    field: keyof ApiKeys;
    label: string;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showSecrets[field] ? "text" : "password"}
          value={keys[field] as string}
          onChange={(e) => setKeys((p) => ({ ...p, [field]: e.target.value }))}
          placeholder={placeholder || "Enter to update…"}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="button"
          onClick={() => toggleShow(field)}
          className="absolute right-2 top-2 text-gray-400"
        >
          {showSecrets[field] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 text-sm mb-8">
        API keys are stored server-side and never exposed to the browser. Leave a field blank to keep the existing value.
      </p>

      <div className="space-y-8">
        {/* Connecteam */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Connecteam</h2>
          <div className="space-y-4">
            <SecretInput field="connecteamApiKey" label="API Key" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduler ID</label>
              <input
                type="text"
                value={keys.connecteamSchedulerId}
                onChange={(e) => setKeys((p) => ({ ...p, connecteamSchedulerId: e.target.value }))}
                placeholder="e.g. 5118591"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* QuickBooks */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">QuickBooks Online</h2>
          <div className="space-y-4">
            <SecretInput field="qboClientId" label="Client ID" />
            <SecretInput field="qboClientSecret" label="Client Secret" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keys.qboSandbox}
                onChange={(e) => setKeys((p) => ({ ...p, qboSandbox: e.target.checked }))}
                className="accent-green-700"
              />
              <span className="text-sm text-gray-700">Use Sandbox (test mode)</span>
            </label>
            {keys.connecteamSchedulerId && (
              <a
                href="/api/qbo/auth"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700"
              >
                Connect QuickBooks →
              </a>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Email (Resend)</h2>
          <SecretInput field="resendApiKey" label="Resend API Key" />
          <p className="text-xs text-gray-400 mt-2">
            Get your API key at <span className="font-mono">resend.com</span>. Emails send from noreply@stlyardgames.com.
          </p>
        </div>

        {/* Google Maps */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-bold text-gray-900 mb-4">Google Maps</h2>
          <SecretInput field="googleMapsApiKey" label="Maps API Key" placeholder="For delivery distance calculation" />
          <p className="text-xs text-gray-400 mt-2">
            Requires Distance Matrix API enabled in Google Cloud Console.
          </p>
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-800 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
