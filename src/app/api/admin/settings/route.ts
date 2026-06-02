import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// Writes API keys to a local .env.local file.
// In production, use Firebase Secret Manager or environment variables set by your CI/CD.
// This route should be protected in production — it only runs server-side.

const ENV_FILE = path.join(process.cwd(), ".env.local");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Read existing env file
    let existing: Record<string, string> = {};
    if (fs.existsSync(ENV_FILE)) {
      const content = fs.readFileSync(ENV_FILE, "utf-8");
      for (const line of content.split("\n")) {
        const [key, ...vals] = line.split("=");
        if (key && vals.length) existing[key.trim()] = vals.join("=").trim();
      }
    }

    // Map incoming fields to env var names
    const mapping: Record<string, string> = {
      connecteamApiKey: "CONNECTEAM_API_KEY",
      qboClientId: "QBO_CLIENT_ID",
      qboClientSecret: "QBO_CLIENT_SECRET",
      resendApiKey: "RESEND_API_KEY",
      googleMapsApiKey: "GOOGLE_MAPS_API_KEY",
    };

    for (const [field, envKey] of Object.entries(mapping)) {
      if (body[field]) existing[envKey] = body[field];
    }

    // Write back
    const content = Object.entries(existing)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    fs.writeFileSync(ENV_FILE, content + "\n");

    return Response.json({ success: true });
  } catch (e: any) {
    console.error("Settings save error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
