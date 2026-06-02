import { getAuthUrl } from "@/lib/quickbooks";
import { redirect } from "next/navigation";

export async function GET() {
  const url = getAuthUrl();
  redirect(url);
}
