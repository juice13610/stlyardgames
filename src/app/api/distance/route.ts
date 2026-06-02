import { NextRequest } from "next/server";

// Origin: STL Yard Games base in St. Peters, MO
const ORIGIN = "St. Peters, MO 63376";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) return Response.json({ error: "address required" }, { status: 400 });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Google Maps not configured" }, { status: 500 });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", ORIGIN);
    url.searchParams.set("destinations", address);
    url.searchParams.set("units", "imperial");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      return Response.json({ error: "Could not calculate distance" }, { status: 422 });
    }

    // distance.text is like "12.3 mi", distance.value is meters
    const meters = element.distance.value;
    const miles = meters / 1609.344;

    return Response.json({ miles: Math.round(miles * 10) / 10, text: element.distance.text });
  } catch (e: any) {
    console.error("Distance calculation error:", e);
    return Response.json({ error: "Distance calculation failed" }, { status: 500 });
  }
}
