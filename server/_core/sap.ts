type SapVerification = {
  verifiedAt: string;
  httpStatus: number;
  resource: string;
};

let lastVerification: SapVerification | null = null;

const DEFAULT_STOCK_PATH = "/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod";
const REQUEST_TIMEOUT_MS = 8000;

function configuredValue(name: string) {
  const value = process.env[name]?.trim();
  return value && !value.startsWith("replace-me") && !value.includes("your-sap-tenant") ? value : undefined;
}

function safeUrl(raw: string | undefined, fallback: string) {
  const value = raw ?? fallback;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    return url;
  } catch {
    return undefined;
  }
}

function resourceUrl() {
  const base = safeUrl(configuredValue("SAP_BASE_URL"), "");
  if (!base) return undefined;
  const path = configuredValue("SAP_STOCK_PATH") ?? DEFAULT_STOCK_PATH;
  return new URL(path, base).toString();
}

export function getSapStatus() {
  const configured = Boolean(configuredValue("SAP_BASE_URL") && configuredValue("SAP_CLIENT_ID") && configuredValue("SAP_CLIENT_SECRET") && configuredValue("SAP_TOKEN_URL"));
  if (lastVerification) {
    return {
      mode: "connected_verified" as const,
      status: "connected_verified" as const,
      label: "Connected — Verified",
      readOnly: true,
      verifiedAt: lastVerification.verifiedAt,
      httpStatus: lastVerification.httpStatus,
      resource: lastVerification.resource,
      message: "A real authorized read-only SAP Material Stock request succeeded during this server session.",
    };
  }
  return {
    mode: configured ? "configured_pending_verification" as const : "demo" as const,
    status: configured ? "not_verified" as const : "demo" as const,
    label: configured ? "SAP Connection Not Verified" : "Demo Mode",
    readOnly: true,
    message: configured
      ? "Server-side SAP configuration is present, but no successful authorized read request has been verified in this session."
      : "No authorized SAP tenant is configured. LineRescue remains in synthetic demo mode.",
  };
}

async function getAccessToken() {
  const tokenUrl = safeUrl(configuredValue("SAP_TOKEN_URL"), "");
  const clientId = configuredValue("SAP_CLIENT_ID");
  const clientSecret = configuredValue("SAP_CLIENT_SECRET");
  if (!tokenUrl || !clientId || !clientSecret) throw new Error("SAP configuration is incomplete: tenant URL, token URL, client ID, and client secret are required server-side.");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`SAP authorization failed with HTTP ${response.status}. Check the communication arrangement and server-side credentials.`);
  const payload = await response.json() as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || payload.access_token.length === 0) throw new Error("SAP authorization response did not contain an access token.");
  return payload.access_token;
}

export async function readMaterialStock() {
  const resource = resourceUrl();
  if (!resource || !configuredValue("SAP_CLIENT_ID") || !configuredValue("SAP_CLIENT_SECRET") || !configuredValue("SAP_TOKEN_URL")) {
    return {
      ok: false,
      httpStatus: 503,
      error: "SAP_NOT_CONFIGURED",
      message: "Demo Mode — SAP connection not verified. Configure an authorized tenant, token URL, client credentials, and read-only communication arrangement on the server.",
      readOnly: true,
    };
  }

  try {
    const token = await getAccessToken();
    const response = await fetch(resource, {
      method: "GET",
      headers: { accept: "application/json", authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const raw = await response.text();
    let body: unknown = raw.slice(0, 12000);
    try { body = raw ? JSON.parse(raw) : null; } catch { /* preserve non-JSON response text */ }
    if (!response.ok) {
      return {
        ok: false,
        httpStatus: response.status,
        error: "SAP_READ_FAILED",
        message: `SAP Material Stock read failed with HTTP ${response.status}. Verify authorization, API version, and communication arrangement.`,
        response: body,
        readOnly: true,
        resource,
      };
    }
    const verifiedAt = new Date().toISOString();
    lastVerification = { verifiedAt, httpStatus: response.status, resource };
    return { ok: true, httpStatus: response.status, status: getSapStatus(), response: body, readOnly: true, resource };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The SAP request failed unexpectedly.";
    return {
      ok: false,
      httpStatus: 502,
      error: "SAP_CONNECTION_FAILED",
      message: message.startsWith("SAP ") ? message : "SAP read request failed due to a timeout or network error. Check the tenant URL and server connectivity.",
      readOnly: true,
      resource,
    };
  }
}

export const sapApiDocumentation = {
  service: "API_MATERIAL_STOCK",
  readOnly: true,
  resources: [
    "GET /sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MaterialStock",
    "GET /sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod",
  ],
};

export function resetSapVerificationForTests() {
  lastVerification = null;
}
