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
    const msg = data?.Fault?.Error?.[0]?.Message || "QuickBooks API error";
    throw new Error(msg);
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
  // Find or create customer
  const customer = await findOrCreateCustomer(params.customerName, params.email);

  const lineItems: any[] = params.lines.map((l, i) => ({
    LineNum: i + 1,
    Amount: Math.round(l.unitPrice * l.quantity * 100) / 100,
    DetailType: "SalesItemLineDetail",
    Description: l.description || l.displayName,
    SalesItemLineDetail: {
      Qty: l.quantity,
      UnitPrice: l.unitPrice,
      ItemRef: { value: "1", name: "Services" }, // Default service item
    },
  }));

  if (params.deliveryTotal && params.deliveryTotal > 0) {
    lineItems.push({
      LineNum: lineItems.length + 1,
      Amount: params.deliveryTotal,
      DetailType: "SalesItemLineDetail",
      Description: "Delivery (round trip)",
      SalesItemLineDetail: {
        Qty: 1,
        UnitPrice: params.deliveryTotal,
        ItemRef: { value: "1", name: "Services" },
      },
    });
  }

  const invoice: any = {
    CustomerRef: { value: customer.Id },
    Line: lineItems,
    BillEmail: { Address: params.email },
    EmailStatus: "NeedToSend",
  };

  if (params.dueDate) invoice.DueDate = params.dueDate;
  if (params.memo) invoice.CustomerMemo = { value: params.memo };

  if (params.discountTotal && params.discountTotal > 0) {
    invoice.GlobalTaxCalculation = "NotApplicable";
    invoice.DiscountAmt = params.discountTotal;
  }

  const result = await qbo<any>("POST", "/invoice", { Invoice: invoice });
  return result.Invoice;
}

async function findOrCreateCustomer(name: string, email: string) {
  const searchResult = await qbo<any>(
    "GET",
    `/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${name.replace(/'/g, "\\'")}' MAXRESULTS 1`)}`
  );

  const existing = searchResult?.QueryResponse?.Customer?.[0];
  if (existing) return existing;

  const createResult = await qbo<any>("POST", "/customer", {
    Customer: {
      DisplayName: name,
      PrimaryEmailAddr: { Address: email },
    },
  });
  return createResult.Customer;
}

export async function getInvoices() {
  const result = await qbo<any>(
    "GET",
    "/query?query=SELECT * FROM Invoice ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS 100"
  );
  return result?.QueryResponse?.Invoice || [];
}

export async function sendInvoice(invoiceId: string) {
  return qbo("POST", `/invoice/${invoiceId}/send`);
}
