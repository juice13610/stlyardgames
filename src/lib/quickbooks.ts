// QuickBooks Online API integration
// OAuth flow: qboAuthUrl → user authorizes → /api/qbo/callback exchanges code → stores tokens

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const QBO_SANDBOX_BASE = "https://sandbox-quickbooks.api.intuit.com/v3/company";
const QBO_PROD_BASE = "https://quickbooks.api.intuit.com/v3/company";
const QBO_AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QBO_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const REDIRECT_URI = "https://stlyardgames.com/api/qbo/callback";

function getClientId() {
  return process.env.QBO_CLIENT_ID || "";
}
function getClientSecret() {
  return process.env.QBO_CLIENT_SECRET || "";
}
function isSandbox() {
  return process.env.QBO_SANDBOX === "true";
}

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    state: "stlyg_qbo",
  });
  return `${QBO_AUTH_BASE}?${params}`;
}

export async function exchangeCodeForTokens(code: string, realmId: string) {
  const creds = Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64");
  const res = await fetch(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Token exchange failed");

  const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  await adminDb.collection("settings").doc("qbo").set({
    realmId,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    connected: true,
    sandbox: isSandbox(),
  });

  return { realmId, accessToken: data.access_token };
}

async function getAccessToken(): Promise<{ token: string; realmId: string }> {
  const snap = await adminDb.collection("settings").doc("qbo").get();
  if (!snap.exists) throw new Error("QuickBooks not connected. Go to Admin > Settings.");

  const data = snap.data()!;
  const now = Date.now();

  // Refresh if within 5 minutes of expiry
  if (data.expiresAt - 300000 < now) {
    const creds = Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64");
    const res = await fetch(QBO_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: data.refreshToken,
      }),
    });
    const refreshed = await res.json();
    if (!res.ok) throw new Error("QuickBooks token refresh failed. Reconnect in Settings.");

    const newExpiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
    await adminDb.collection("settings").doc("qbo").update({
      accessToken: refreshed.access_token,
      expiresAt: newExpiresAt,
    });
    return { token: refreshed.access_token, realmId: data.realmId };
  }

  return { token: data.accessToken, realmId: data.realmId };
}

function getBase(realmId: string) {
  return `${isSandbox() ? QBO_SANDBOX_BASE : QBO_PROD_BASE}/${realmId}`;
}

async function qbo<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { token, realmId } = await getAccessToken();
  const base = getBase(realmId);

  const separator = path.includes("?") ? "&" : "?";
  const res = await fetch(`${base}${path}${separator}minorversion=65`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("QBO API error:", JSON.stringify(data));
    const fault = data?.Fault?.Error?.[0];
    const msg = fault?.Message || fault?.Detail || "QuickBooks API error";
    const detail = fault?.Detail ? ` — ${fault.Detail}` : "";
    throw new Error(`${msg}${detail}`);
  }
  return data;
}

interface InvoiceLine {
  displayName: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

export async function createInvoice(params: {
  customerName: string;
  email: string;
  lines: InvoiceLine[];
  deliveryTotal?: number;
  discountTotal?: number;
  dueDate?: string;
  memo?: string;
}) {
  // Find or create customer and service item
  console.log("QBO: looking up customer:", params.customerName);
  const customer = await findOrCreateCustomer(params.customerName, params.email);
  console.log("QBO: customer id:", customer?.Id);

  console.log("QBO: looking up service item");
  const serviceItemId = await findOrCreateServiceItem();
  console.log("QBO: service item id:", serviceItemId);

  // Spread discount proportionally across line items rather than using QBO's
  // DiscountAmt field (requires Discounts feature enabled in QBO settings)
  const discountRatio =
    params.discountTotal && params.discountTotal > 0
      ? params.discountTotal / params.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
      : 0;

  const lineItems: any[] = params.lines.map((l, i) => {
    const baseAmount = Math.round(l.unitPrice * l.quantity * 100) / 100;
    const discountedAmount = discountRatio > 0
      ? Math.round(baseAmount * (1 - discountRatio) * 100) / 100
      : baseAmount;
    const effectiveUnitPrice = discountRatio > 0
      ? Math.round(l.unitPrice * (1 - discountRatio) * 100) / 100
      : l.unitPrice;
    return {
      Amount: discountedAmount,
      DetailType: "SalesItemLineDetail",
      Description: discountRatio > 0
        ? `${l.description || l.displayName} (multi-game discount applied)`
        : (l.description || l.displayName),
      SalesItemLineDetail: {
        ItemRef: { value: serviceItemId },
        Qty: l.quantity,
        UnitPrice: effectiveUnitPrice,
      },
    };
  });

  if (params.deliveryTotal && params.deliveryTotal > 0) {
    lineItems.push({
      LineNum: lineItems.length + 1,
      Amount: params.deliveryTotal,
      DetailType: "SalesItemLineDetail",
      Description: "Delivery",
      SalesItemLineDetail: {
        Qty: 1,
        UnitPrice: params.deliveryTotal,
        ItemRef: { value: serviceItemId },
      },
    });
  }

  const invoice: any = {
    CustomerRef: { value: customer.Id },
    Line: lineItems,
    BillEmail: { Address: params.email },
    EmailStatus: "NeedToSend",
  };

  // Log what we're sending for debugging
  console.log("QBO invoice payload:", JSON.stringify(invoice));

  // QBO POST /invoice returns { Invoice: {...}, time: "..." }
  const result = await qbo<any>("POST", "/invoice", invoice);
  console.log("QBO createInvoice raw result keys:", Object.keys(result || {}));
  return result.Invoice || result;
}

async function findOrCreateServiceItem(): Promise<string> {
  // Look for our dedicated rental item by name first
  const named = await qbo<any>(
    "GET",
    `/query?query=${encodeURIComponent("SELECT * FROM Item WHERE Name = 'Yard Game Rental' MAXRESULTS 1")}`
  );
  const namedItem = named?.QueryResponse?.Item?.[0];
  if (namedItem) return namedItem.Id;

  // Create it — look up the income account first
  const accounts = await qbo<any>(
    "GET",
    `/query?query=${encodeURIComponent("SELECT * FROM Account WHERE AccountType = 'Income' MAXRESULTS 1")}`
  );
  const incomeAccount = accounts?.QueryResponse?.Account?.[0];
  if (!incomeAccount) throw new Error("No income account found in QuickBooks.");

  const created = await qbo<any>("POST", "/item", {
    Name: "Yard Game Rental",
    Type: "Service",
    IncomeAccountRef: { value: incomeAccount.Id, name: incomeAccount.Name },
  });
  return created.Item?.Id || created.Id;
}

async function findOrCreateCustomer(name: string, email: string) {
  const searchResult = await qbo<any>(
    "GET",
    `/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${name.replace(/'/g, "\\'")}' MAXRESULTS 1`)}`
  );

  const existing = searchResult?.QueryResponse?.Customer?.[0];
  if (existing) return existing;

  const createResult = await qbo<any>("POST", "/customer", {
    DisplayName: name,
    PrimaryEmailAddr: { Address: email },
  });
  return createResult.Customer || createResult;
}

export async function getInvoices() {
  const result = await qbo<any>(
    "GET",
    "/query?query=SELECT * FROM Invoice ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS 100"
  );
  return result?.QueryResponse?.Invoice || [];
}

export async function sendInvoice(invoiceId: string, email?: string) {
  const path = email
    ? `/invoice/${invoiceId}/send?sendTo=${encodeURIComponent(email)}`
    : `/invoice/${invoiceId}/send`;
  return qbo("POST", path);
}
