import { afterEach, describe, expect, it, vi } from "vitest";
import { getSapStatus, readMaterialStock, resetSapVerificationForTests } from "./sap";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetSapVerificationForTests();
});

describe("SAP read-only adapter", () => {
  it("stays in demo mode when no authorized tenant is configured", async () => {
    const result = await readMaterialStock();
    expect(result).toMatchObject({ ok: false, httpStatus: 503, error: "SAP_NOT_CONFIGURED", readOnly: true });
    expect(getSapStatus()).toMatchObject({ mode: "demo", status: "demo", label: "Demo Mode" });
  });

  it("reports the real authorization or read failure without claiming verification", async () => {
    vi.stubEnv("SAP_BASE_URL", "https://sap.example");
    vi.stubEnv("SAP_TOKEN_URL", "https://sap.example/oauth/token");
    vi.stubEnv("SAP_CLIENT_ID", "client");
    vi.stubEnv("SAP_CLIENT_SECRET", "secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("denied", { status: 401 })));
    const result = await readMaterialStock();
    expect(result).toMatchObject({ ok: false, httpStatus: 502, error: "SAP_CONNECTION_FAILED", readOnly: true });
    expect(getSapStatus()).toMatchObject({ status: "not_verified", label: "SAP Connection Not Verified" });
  });

  it("marks the connection verified only after a real token and GET response succeed", async () => {
    vi.stubEnv("SAP_BASE_URL", "https://sap.example");
    vi.stubEnv("SAP_TOKEN_URL", "https://sap.example/oauth/token");
    vi.stubEnv("SAP_CLIENT_ID", "client");
    vi.stubEnv("SAP_CLIENT_SECRET", "secret");
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ d: { results: [] } }), { status: 200 }));
    vi.stubGlobal("fetch", request);
    const result = await readMaterialStock();
    expect(result).toMatchObject({ ok: true, httpStatus: 200, readOnly: true });
    expect(getSapStatus()).toMatchObject({ status: "connected_verified", label: "Connected — Verified", httpStatus: 200 });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][1]).toMatchObject({ headers: expect.objectContaining({ authorization: `Basic ${Buffer.from("client:secret").toString("base64")}` }) });
    expect(request.mock.calls[1][1]).toMatchObject({ method: "GET", headers: expect.objectContaining({ authorization: "Bearer token" }) });
  });
});
