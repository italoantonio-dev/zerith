import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  zerithApi,
} from "./api";

const accessTokenKey = "zerith.accessToken";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("zerithApi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  it("persists, reads and clears the access token", () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken("access-token");
    expect(getAccessToken()).toBe("access-token");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("sends login as JSON and persists the access token returned by the API", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      accessToken: "new-token",
      tokenType: "Bearer",
      user: { id: "user-1", tenantId: "tenant-1" },
    }));

    await expect(zerithApi.login("user@zerith.test", "password")).resolves.toMatchObject({ accessToken: "new-token" });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "user@zerith.test", password: "password" }), headers: { "Content-Type": "application/json" } }),
    );
    expect(getAccessToken()).toBe("new-token");
  });

  it("adds the bearer token to authenticated requests", async () => {
    setAccessToken("stored-token");
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await zerithApi.vehicles();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/vehicles$/),
      expect.objectContaining({ headers: { "Content-Type": "application/json", Authorization: "Bearer stored-token" } }),
    );
  });

  it("encodes vehicle identifiers in endpoint paths", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "V 01/2" }));
    await zerithApi.vehicle("V 01/2");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/vehicles\/V%2001%2F2$/), expect.any(Object));
  });

  it("clears the access token and exposes API problem details on 401", async () => {
    setAccessToken("expired-token");
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Sessão expirada" }, 401));
    await expect(zerithApi.dashboard()).rejects.toThrow("Sessão expirada");
    expect(getAccessToken()).toBeNull();
  });

  it("keeps the access token for non-401 HTTP errors", async () => {
    setAccessToken("valid-token");
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Acesso negado" }, 403));
    await expect(zerithApi.alerts()).rejects.toThrow("Acesso negado");
    expect(getAccessToken()).toBe("valid-token");
  });

  it("uses the status fallback when an HTTP error is not a JSON problem response", async () => {
    setAccessToken("valid-token");
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502, json: vi.fn().mockRejectedValue(new Error("invalid JSON")) } as unknown as Response);
    await expect(zerithApi.dashboard()).rejects.toThrow("Falha na API (502)");
    expect(getAccessToken()).toBe("valid-token");
  });

  it("propagates malformed JSON from successful responses", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockRejectedValue(new Error("invalid JSON")) } as unknown as Response);
    await expect(zerithApi.vehicles()).rejects.toThrow("invalid JSON");
  });

  it("uses the default and supplied telemetry limits", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([])).mockResolvedValueOnce(jsonResponse([]));
    await zerithApi.telemetry("V001");
    await zerithApi.telemetry("V001", 30);
    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/vehicles\/V001\/telemetry\?limit=14$/), expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/vehicles\/V001\/telemetry\?limit=30$/), expect.any(Object));
  });

  it("requests tenant-scoped tracking and paginated position history with the bearer token", async () => {
    setAccessToken("tracking-token");
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [], nextCursor: "next-page" }))
      .mockResolvedValueOnce(jsonResponse({ items: [], nextCursor: null }));

    await zerithApi.trackingVehicles(50, "page cursor");
    await zerithApi.vehiclePositions("V 01/2", "2026-10-01T00:00:00Z", "2026-10-02T00:00:00Z", 100);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/tracking\/vehicles\?limit=50&cursor=page%20cursor$/),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tracking-token" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/vehicles\/V%2001%2F2\/positions\?from=2026-10-01T00%3A00%3A00Z&to=2026-10-02T00%3A00%3A00Z&limit=100$/),
      expect.any(Object),
    );
  });

  it("propagates a position-history HTTP failure without removing a valid session", async () => {
    setAccessToken("valid-token");
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Histórico indisponível" }, 503));

    await expect(zerithApi.vehiclePositions("V001", "2026-10-09T00:00:00Z", "2026-10-10T00:00:00Z")).rejects.toThrow("Histórico indisponível");
    expect(getAccessToken()).toBe("valid-token");
  });

  it("does not add an authorization header when there is no token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await zerithApi.alerts();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(localStorage.getItem(accessTokenKey)).toBeNull();
  });
});
