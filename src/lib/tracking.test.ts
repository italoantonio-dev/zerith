import { describe, expect, it } from "vitest";
import {
  autoSelectVehicleCode,
  collectTrackingPoints,
  defaultHistoryRange,
  mapTrackingVehicle,
  hasRouteSegment,
  routeBounds,
  routeFitBoundsOptions,
  routeGeoJson,
  routeEndpoints,
  selectTrackingVehicle,
  sortTrackingPoints,
  type TrackingVehicleResponse,
} from "./tracking";

const baseVehicle: TrackingVehicleResponse = {
  code: "V001",
  plate: "ZER-2026",
  model: "Fiat Strada",
  latitude: -23.55052,
  longitude: -46.633308,
  speedKmh: 42.5,
  capturedAt: "2026-10-09T10:00:00Z",
  receivedAt: "2026-10-09T10:00:05Z",
  ageSeconds: 5,
  connectionStatus: "ONLINE",
  gpsStatus: "CURRENT",
  hasActiveAlert: false,
  dataOrigin: "REAL",
};

describe("tracking contract adapters", () => {
  it("maps an API vehicle with a current real position", () => {
    expect(mapTrackingVehicle(baseVehicle)).toMatchObject({
      code: "V001",
      hasCoordinates: true,
      isDemonstration: false,
      isStale: false,
      positionLabel: "Posição atual",
    });
  });

  it("keeps vehicles without coordinates out of marker rendering", () => {
    const vehicle = mapTrackingVehicle({
      ...baseVehicle,
      latitude: null,
      longitude: null,
      capturedAt: null,
      receivedAt: null,
      ageSeconds: null,
      gpsStatus: "ONLINE_WITHOUT_GPS",
    });

    expect(vehicle.hasCoordinates).toBe(false);
    expect(vehicle.positionLabel).toBe("Online sem GPS");
  });

  it("marks stale demonstration coordinates explicitly", () => {
    const vehicle = mapTrackingVehicle({
      ...baseVehicle,
      gpsStatus: "STALE",
      dataOrigin: "DEMONSTRATION",
    });

    expect(vehicle.isStale).toBe(true);
    expect(vehicle.isDemonstration).toBe(true);
    expect(vehicle.positionLabel).toBe("Posição desatualizada");
  });

  it("orders historical points chronologically without mutating the API payload", () => {
    const unordered = [
      { latitude: -23.5, longitude: -46.6, speedKmh: 20, capturedAt: "2026-10-09T10:02:00Z", receivedAt: "2026-10-09T10:02:01Z", source: "device_telemetry" },
      { latitude: -23.4, longitude: -46.5, speedKmh: 10, capturedAt: "2026-10-09T10:01:00Z", receivedAt: "2026-10-09T10:01:01Z", source: "device_telemetry" },
    ];

    const ordered = sortTrackingPoints(unordered);

    expect(ordered.map((point) => point.capturedAt)).toEqual(["2026-10-09T10:01:00Z", "2026-10-09T10:02:00Z"]);
    expect(unordered[0].capturedAt).toBe("2026-10-09T10:02:00Z");
  });

  it("selects the requested vehicle and preserves tenant-scoped API results", () => {
    const selected = selectTrackingVehicle(
      [mapTrackingVehicle(baseVehicle), mapTrackingVehicle({ ...baseVehicle, code: "V002" })],
      "V002",
    );

    expect(selected?.code).toBe("V002");
    expect(selectTrackingVehicle([], "V002")).toBeUndefined();
  });

  it("auto-selects the only tracked vehicle without replacing a manual selection", () => {
    const vehicles = [mapTrackingVehicle(baseVehicle)];

    expect(autoSelectVehicleCode(vehicles, null)).toBe("V001");
    expect(autoSelectVehicleCode(vehicles, "V999")).toBe("V999");
    expect(autoSelectVehicleCode([vehicles[0], { ...vehicles[0], code: "V002" }], null)).toBeNull();
  });

  it("uses a local 24-hour default interval that contains a recent demonstration route", () => {
    const now = new Date("2026-10-09T16:20:00Z");
    const range = defaultHistoryRange(now);
    const demonstrationPoint = new Date("2026-10-09T16:18:00Z");

    expect(new Date(range.from).getTime()).toBeLessThanOrEqual(demonstrationPoint.getTime());
    expect(new Date(range.to).getTime()).toBeGreaterThanOrEqual(demonstrationPoint.getTime());
  });

  it("merges paginated position responses and preserves chronological route order", () => {
    const points = collectTrackingPoints([
      { items: [{ latitude: -23.5, longitude: -46.6, speedKmh: 20, capturedAt: "2026-10-09T10:02:00Z", receivedAt: "2026-10-09T10:02:01Z", source: "device_telemetry" }], nextCursor: "next" },
      { items: [{ latitude: -23.4, longitude: -46.5, speedKmh: 10, capturedAt: "2026-10-09T10:01:00Z", receivedAt: "2026-10-09T10:01:01Z", source: "device_telemetry" }], nextCursor: null },
    ]);

    expect(points.map((point) => point.capturedAt)).toEqual(["2026-10-09T10:01:00Z", "2026-10-09T10:02:00Z"]);
  });

  it("keeps the route empty when the selected interval has no positions", () => {
    expect(collectTrackingPoints([{ items: [], nextCursor: null }])).toEqual([]);
  });

  it("derives the geographic extent from API route points without adding coordinates", () => {
    const points = [
      { latitude: -23.55052, longitude: -46.633308, speedKmh: 10, capturedAt: "2026-10-09T10:01:00Z", receivedAt: "2026-10-09T10:01:01Z", source: "device_telemetry" },
      { latitude: -23.55041, longitude: -46.633198, speedKmh: 20, capturedAt: "2026-10-09T10:02:00Z", receivedAt: "2026-10-09T10:02:01Z", source: "device_telemetry" },
    ];

    expect(routeBounds(points)).toEqual([[-46.633308, -23.55052], [-46.633198, -23.55041]]);
  });

  it("allows compact real routes to be framed above the selected marker footprint", () => {
    expect(routeFitBoundsOptions).toEqual({
      padding: { top: 72, right: 72, bottom: 72, left: 72 },
      maxZoom: 19,
    });
  });

  it("builds a valid GeoJSON feature collection with chronological longitude-latitude coordinates", () => {
    const points = [
      { latitude: -23.55052, longitude: -46.633308, speedKmh: 10, capturedAt: "2026-10-09T10:01:00Z", receivedAt: "2026-10-09T10:01:01Z", source: "device_telemetry" },
      { latitude: -23.55041, longitude: -46.633198, speedKmh: 20, capturedAt: "2026-10-09T10:02:00Z", receivedAt: "2026-10-09T10:02:01Z", source: "device_telemetry" },
    ];

    expect(routeGeoJson([])).toEqual({ type: "FeatureCollection", features: [] });
    expect(routeGeoJson(points)).toEqual({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [[-46.633308, -23.55052], [-46.633198, -23.55041]] },
      }],
    });
  });

  it("keeps start and end indicators tied to the chronological route endpoints", () => {
    const points = sortTrackingPoints([
      { latitude: -23.55041, longitude: -46.633198, speedKmh: 20, capturedAt: "2026-10-09T10:02:00Z", receivedAt: "2026-10-09T10:02:01Z", source: "device_telemetry" },
      { latitude: -23.55052, longitude: -46.633308, speedKmh: 10, capturedAt: "2026-10-09T10:01:00Z", receivedAt: "2026-10-09T10:01:01Z", source: "device_telemetry" },
    ]);

    expect(routeEndpoints(points)).toEqual({ start: points[0], end: points[1] });
    expect(routeEndpoints([])).toEqual({ start: undefined, end: undefined });
  });

  it("only treats geographically distinct API positions as a visible trajectory", () => {
    const start = { latitude: -23.55052, longitude: -46.633308, speedKmh: 10, capturedAt: "2026-10-09T10:01:00Z", receivedAt: "2026-10-09T10:01:01Z", source: "device_telemetry" };
    const moved = { ...start, latitude: -23.55041, longitude: -46.633198, capturedAt: "2026-10-09T10:02:00Z" };

    expect(hasRouteSegment([start, moved])).toBe(true);
    expect(hasRouteSegment([start, { ...start, capturedAt: "2026-10-09T10:02:00Z" }])).toBe(false);
  });

  it("keeps the selected vehicle after a responsive layout change", () => {
    const vehicles = [mapTrackingVehicle(baseVehicle)];

    expect(selectTrackingVehicle(vehicles, "V001")?.code).toBe("V001");
  });
});
