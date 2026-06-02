import { NextRequest } from "next/server";
import { exchangeCodeForTokens } from "@/lib/quickbooks";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");

  if (!code || !realmId) {
    return Response.json({ error: "Missing code or realmId" }, { status: 400 });
  }

  try {
    await exchangeCodeForTokens(code, realmId);
    redirect("/admin/settings?qbo=connected");
  } catch (e: any) {
    redirect(`/admin/settings?qbo=error&msg=${encodeURIComponent(e.message)}`);
  }
}
