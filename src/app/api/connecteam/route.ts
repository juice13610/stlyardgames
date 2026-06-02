import { NextRequest } from "next/server";
import {
  createShifts,
  publishShifts,
  updateShift,
  deleteShift,
  getShifts,
  getUsers,
} from "@/lib/connecteam";

// Server-side proxy — API key never reaches the browser.
// All actions route through here.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case "getShifts": {
        const shifts = await getShifts(params.startTime, params.endTime);
        return Response.json({ data: { shifts } });
      }
      case "getUsers": {
        const users = await getUsers();
        return Response.json({ data: { users } });
      }
      case "createShifts": {
        const ids = await createShifts(params.shifts, params.notifyUsers ?? false);
        return Response.json({ data: { shiftIds: ids } });
      }
      case "publishShifts": {
        await publishShifts(params.shiftIds);
        return Response.json({ success: true });
      }
      case "updateShift": {
        await updateShift(params.shiftId, params.updates);
        return Response.json({ success: true });
      }
      case "deleteShift": {
        await deleteShift(params.shiftId);
        return Response.json({ success: true });
      }
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    console.error("Connecteam proxy error:", e);
    return Response.json({ error: e.message || "Connecteam error" }, { status: 500 });
  }
}
