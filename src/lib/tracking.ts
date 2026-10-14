export type ConnectionStatus = "ONLINE" | "OFFLINE" | "NO_COMMUNICATION";
export type GpsStatus = "CURRENT" | "STALE" | "ONLINE_WITHOUT_GPS" | "NO_POSITION";
export type DataOrigin = "REAL" | "DEMONSTRATION" | "UNKNOWN_LEGACY";

export interface TrackingVehicleResponse {
  code: string;
  plate: string;
  model: string;
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  capturedAt: string | null;
  receivedAt: string | null;
  ageSeconds: number | null;
  connectionStatus: ConnectionStatus;
  gpsStatus: GpsStatus;
  hasActiveAlert: boolean;
  dataOrigin: DataOrigin;
}

export interface TrackingPageResponse {
  items: TrackingVehicleResponse[];
  nextCursor: string | null;
}

export interface PositionPointResponse {
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  capturedAt: string;
  receivedAt: string;
  source: string;
}

export interface PositionPageResponse {
  items: PositionPointResponse[];
  nextCursor: string | null;
}

export interface MapVehicle extends TrackingVehicleResponse {
  hasCoordinates: boolean;
  isStale: boolean;
  isDemonstration: boolean;
  positionLabel: string;
}

const positionLabels: Record<GpsStatus, string> = {
  CURRENT: "Posição atual",
  STALE: "Posição desatualizada",
  ONLINE_WITHOUT_GPS: "Online sem GPS",
  NO_POSITION: "Sem posição GPS",
};

export function mapTrackingVehicle(vehicle: TrackingVehicleResponse): MapVehicle {
  return {
    ...vehicle,
    hasCoordinates: vehicle.latitude !== null && vehicle.longitude !== null,
    isStale: vehicle.gpsStatus === "STALE",
    isDemonstration: vehicle.dataOrigin === "DEMONSTRATION",
    positionLabel: positionLabels[vehicle.gpsStatus],
  };
}

export function sortTrackingPoints(points: PositionPointResponse[]): PositionPointResponse[] {
  return [...points].sort((left, right) =>
    new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime(),
  );
}

export function collectTrackingPoints(pages: PositionPageResponse[]): PositionPointResponse[] {
  return sortTrackingPoints(pages.flatMap((page) => page.items));
}

export function routeBounds(points: PositionPointResponse[]): [[number, number], [number, number]] | undefined {
  if (points.length === 0) return undefined;

  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}

export const routeFitBoundsOptions = {
  padding: { top: 72, right: 72, bottom: 72, left: 72 },
  maxZoom: 19,
} as const;

export function routeGeoJson(points: PositionPointResponse[]) {
  if (!hasRouteSegment(points)) return { type: "FeatureCollection" as const, features: [] };

  return {
    type: "FeatureCollection" as const,
    features: [{
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: points.map((point) => [point.longitude, point.latitude]),
      },
    }],
  };
}

export function routeEndpoints(points: PositionPointResponse[]): { start: PositionPointResponse | undefined; end: PositionPointResponse | undefined } {
  return { start: points[0], end: points.at(-1) };
}

export function hasRouteSegment(points: PositionPointResponse[]): boolean {
  const first = points[0];
  return first !== undefined && points.some((point) => point.latitude !== first.latitude || point.longitude !== first.longitude);
}

export function autoSelectVehicleCode(vehicles: MapVehicle[], selectedCode: string | null): string | null {
  if (selectedCode !== null) return selectedCode;
  return vehicles.length === 1 ? vehicles[0].code : null;
}

function toDateTimeLocal(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function defaultHistoryRange(now = new Date()): { from: string; to: string } {
  return {
    from: toDateTimeLocal(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    to: toDateTimeLocal(now),
  };
}

export function selectTrackingVehicle(vehicles: MapVehicle[], code: string | null): MapVehicle | undefined {
  return code === null ? undefined : vehicles.find((vehicle) => vehicle.code === code);
}
