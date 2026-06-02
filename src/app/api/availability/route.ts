import { NextRequest } from "next/server";
import { checkAvailability } from "@/lib/availability";

export async function POST(req: NextRequest) {
  try {
    const { pickupDate, pickupTime, returnDate, returnTime } = await req.json();

    if (!pickupDate || !returnDate) {
      return Response.json({ error: "pickupDate and returnDate are required" }, { status: 400 });
    }

    const pickup = new Date(`${pickupDate}T${pickupTime || "00:00"}`);
    const returnDt = new Date(`${returnDate}T${returnTime || "00:00"}`);

    if (isNaN(pickup.getTime()) || isNaN(returnDt.getTime())) {
      return Response.json({ error: "Invalid date format" }, { status: 400 });
    }

    const results = await checkAvailability(pickup, returnDt);
    return Response.json({ results });
  } catch (e: any) {
    console.error("Availability check error:", e);
    return Response.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
