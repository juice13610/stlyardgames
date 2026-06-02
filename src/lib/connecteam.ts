// Connecteam API wrapper — all calls are server-side only.
// See CONNECTEAM_API_GUIDE.md for documented gotchas.

const BASE_URL = "https://api.connecteam.com";

function getHeaders() {
  const apiKey = process.env.CONNECTEAM_API_KEY;
  if (!apiKey) throw new Error("CONNECTEAM_API_KEY not configured");
  return {
    "X-API-KEY": apiKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function getSchedulerId() {
  const id = process.env.CONNECTEAM_SCHEDULER_ID;
  if (!id) throw new Error("CONNECTEAM_SCHEDULER_ID not configured");
  return id;
}

async function ct<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data.error ||
      data.message ||
      data.errorMessage ||
      (data.errors ? JSON.stringify(data.errors) : null) ||
      `Connecteam error (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export interface ConnecteamShiftInput {
  title: string;
  startTime: number; // Unix seconds
  endTime: number; // Unix seconds
  timezone?: string;
  jobId?: string;
  isPublished: boolean;
  isOpenShift?: boolean;
  openSpotsCount?: number;
  assignedUserIds?: string[];
  notes?: { type: "html"; html: string }[];
  locationData?: {
    isReferencedToJob: boolean;
    gps: { address: string };
  };
}

export interface ConnecteamShift extends ConnecteamShiftInput {
  shiftId: string;
  id: string;
}

// Create one or more draft shifts (isPublished: false)
export async function createShifts(
  shifts: ConnecteamShiftInput[],
  notifyUsers = false
): Promise<string[]> {
  const schedulerId = getSchedulerId();
  const data = await ct<any>(
    "POST",
    `/scheduler/v1/schedulers/${schedulerId}/shifts?notifyUsers=${notifyUsers}`,
    shifts
  );
  // Log full response for debugging
  console.log("Connecteam createShifts response:", JSON.stringify(data).slice(0, 500));
  // Response can be single or array
  if (data.data?.shift?.id) return [data.data.shift.id];
  if (data.data?.shift?.shiftId) return [data.data.shift.shiftId];
  if (data.data?.shifts) return data.data.shifts.map((s: any) => s.id || s.shiftId);
  if (Array.isArray(data.data)) return data.data.map((s: any) => s.id || s.shiftId);
  // If we got here but no error, try to extract any ID-like field
  const raw = JSON.stringify(data);
  console.error("Unexpected Connecteam create response:", raw);
  throw new Error(`Unexpected Connecteam response: ${raw.slice(0, 200)}`);
}

// Publish shift(s) and notify users
export async function publishShifts(shiftIds: string[]): Promise<void> {
  const schedulerId = getSchedulerId();
  const updates = shiftIds.map((shiftId) => ({ shiftId, isPublished: true }));
  await ct(
    "PUT",
    `/scheduler/v1/schedulers/${schedulerId}/shifts?notifyUsers=true`,
    updates
  );
}

// Partial update — omit fields you don't want to change
export async function updateShift(
  shiftId: string,
  updates: Partial<ConnecteamShiftInput>
): Promise<void> {
  const schedulerId = getSchedulerId();
  await ct(
    "PUT",
    `/scheduler/v1/schedulers/${schedulerId}/shifts?notifyUsers=false`,
    [{ shiftId, ...updates }]
  );
}

export async function deleteShift(shiftId: string): Promise<void> {
  const schedulerId = getSchedulerId();
  await ct("DELETE", `/scheduler/v1/schedulers/${schedulerId}/shifts/${shiftId}`);
}

export async function getShifts(
  startTime: number,
  endTime: number
): Promise<ConnecteamShift[]> {
  const schedulerId = getSchedulerId();
  const data = await ct<any>(
    "GET",
    `/scheduler/v1/schedulers/${schedulerId}/shifts?startTime=${startTime}&endTime=${endTime}&limit=200`
  );
  return data.data?.shifts || [];
}

export async function getUsers(): Promise<any[]> {
  const data = await ct<any>("GET", "/users/v1/users?limit=200&userStatus=active");
  return data.data?.users || [];
}

// Build the HTML note for a rental reservation
export function buildReservationNote(reservation: {
  customerName: string;
  phone: string;
  email: string;
  eventAddress: string;
  items: { displayName: string; quantity: number }[];
  deliveryType: string;
  deliveryFee: number;
  grandTotal: number;
  notes?: string;
}): string {
  const itemList = reservation.items
    .map((i) => `• ${i.quantity}× ${i.displayName}`)
    .join("<br/>");

  return `<div>
<strong>Customer:</strong> ${reservation.customerName}<br/>
<strong>Phone:</strong> ${reservation.phone}<br/>
<strong>Email:</strong> ${reservation.email}<br/>
<strong>Address:</strong> ${reservation.eventAddress}<br/>
<strong>Delivery:</strong> ${reservation.deliveryType === "delivery" ? `Delivery ($${reservation.deliveryFee} each way)` : "Customer Pickup / Drop-off"}<br/>
<strong>Items:</strong><br/>${itemList}<br/>
<strong>Total:</strong> $${reservation.grandTotal}<br/>
${reservation.notes ? `<strong>Notes:</strong> ${reservation.notes}` : ""}
</div>`;
}
