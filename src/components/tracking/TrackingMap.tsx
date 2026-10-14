import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { type Map as MapLibreMap, type Marker, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { hasRouteSegment, routeBounds, routeEndpoints, routeFitBoundsOptions, routeGeoJson, type MapVehicle, type PositionPointResponse } from "@/lib/tracking";

interface TrackingMapProps {
  vehicles: MapVehicle[];
  selectedVehicle: MapVehicle | undefined;
  points: PositionPointResponse[];
  onSelectVehicle: (code: string) => void;
  onDiagnostics?: (diagnostics: MapDiagnostics) => void;
}

export interface MapDiagnostics {
  mapReady: boolean;
  styleLoaded: boolean;
  routeSourcePresent: boolean;
  routeLayerPresent: boolean;
  routeLayerVisibility: string;
  historyPointCount: number;
  renderedRouteFeatureCount: number;
  zoom: number;
}

const fallbackStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "zerith-background", type: "background", paint: { "background-color": "#e8eef5" } }],
};

const styleUrl = import.meta.env.VITE_MAP_STYLE_URL as string | undefined;

function statusColor(vehicle: MapVehicle) {
  if (vehicle.hasActiveAlert) return "#b91c1c";
  if (vehicle.connectionStatus !== "ONLINE" || vehicle.gpsStatus === "STALE") return "#b45309";
  return "#047857";
}

function markerElement(vehicle: MapVehicle) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-white px-2 text-xs font-bold text-white shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-900/20";
  element.style.backgroundColor = statusColor(vehicle);
  element.setAttribute("aria-label", `Selecionar ${vehicle.plate}`);
  element.textContent = vehicle.isDemonstration ? "D" : vehicle.hasActiveAlert ? "!" : "•";
  return element;
}

export function TrackingMap({ vehicles, selectedVehicle, points, onSelectVehicle, onDiagnostics }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const selectedCodeRef = useRef<string | undefined>();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl || fallbackStyle,
      center: [-46.6333, -23.5505],
      zoom: 4,
      attributionControl: styleUrl ? {} : false,
    });
    setMapReady(false);
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.on("load", () => {
      map.addSource("tracking-route", { type: "geojson", data: routeGeoJson([]) });
      map.addLayer({ id: "tracking-route", type: "line", source: "tracking-route", paint: { "line-color": "#1d4ed8", "line-width": 6, "line-opacity": 1 } });
      map.addSource("tracking-route-start", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "tracking-route-start", type: "circle", source: "tracking-route-start", paint: { "circle-radius": 7, "circle-color": "#047857", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
      map.addSource("tracking-route-end", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "tracking-route-end", type: "circle", source: "tracking-route-end", paint: { "circle-radius": 7, "circle-color": "#b91c1c", "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
      setMapReady(true);
    });
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = vehicles.filter((vehicle) => vehicle.hasCoordinates).map((vehicle) => {
      const element = markerElement(vehicle);
      element.addEventListener("click", () => onSelectVehicle(vehicle.code));
      const isSelected = vehicle.code === selectedVehicle?.code;
      return new maplibregl.Marker({ element, anchor: isSelected ? "bottom" : "center", offset: isSelected ? [0, -8] : [0, 0] })
        .setLngLat([vehicle.longitude!, vehicle.latitude!])
        .addTo(map);
    });
  }, [onSelectVehicle, selectedVehicle?.code, vehicles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedVehicle?.hasCoordinates || selectedCodeRef.current === selectedVehicle.code) return;
    selectedCodeRef.current = selectedVehicle.code;
    map.flyTo({ center: [selectedVehicle.longitude!, selectedVehicle.latitude!], zoom: Math.max(map.getZoom(), 12), essential: true });
  }, [selectedVehicle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource("tracking-route") as maplibregl.GeoJSONSource | undefined;
    const startSource = map.getSource("tracking-route-start") as maplibregl.GeoJSONSource | undefined;
    const endSource = map.getSource("tracking-route-end") as maplibregl.GeoJSONSource | undefined;
    if (!source || !startSource || !endSource) return;
    const { start, end } = routeEndpoints(points);
    const hasVisibleRoute = hasRouteSegment(points);
    source.setData(routeGeoJson(points));
    const pointFeature = (point: PositionPointResponse | undefined) => point ? [{
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Point" as const, coordinates: [point.longitude, point.latitude] },
    }] : [];
    startSource.setData({ type: "FeatureCollection", features: hasVisibleRoute ? pointFeature(start) : [] });
    endSource.setData({ type: "FeatureCollection", features: hasVisibleRoute ? pointFeature(end) : [] });

    const bounds = routeBounds(points);
    if (!bounds) return;
    const [[west, south], [east, north]] = bounds;
    if (west === east && south === north) {
      map.flyTo({ center: [west, south], zoom: 16, essential: true });
      return;
    }
    map.fitBounds(bounds, { ...routeFitBoundsOptions, duration: 0 });
    const animationFrame = requestAnimationFrame(() => {
      onDiagnostics?.({
        mapReady,
        styleLoaded: map.isStyleLoaded() === true,
        routeSourcePresent: Boolean(map.getSource("tracking-route")),
        routeLayerPresent: Boolean(map.getLayer("tracking-route")),
        routeLayerVisibility: String(map.getLayoutProperty("tracking-route", "visibility") ?? "visible"),
        historyPointCount: points.length,
        renderedRouteFeatureCount: map.queryRenderedFeatures({ layers: ["tracking-route"] }).length,
        zoom: Number(map.getZoom().toFixed(2)),
      });
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [mapReady, onDiagnostics, points]);

  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100" aria-label="Mapa de rastreamento">
      <div ref={containerRef} className="h-full w-full" />
      {!styleUrl && (
        <div className="absolute bottom-3 left-3 max-w-sm rounded-lg bg-slate-950/90 px-3 py-2 text-xs text-white">
          Base cartográfica não configurada. Defina <code>VITE_MAP_STYLE_URL</code> para um estilo comercial com atribuição.
        </div>
      )}
      {selectedVehicle?.isDemonstration && (
        <div className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
          Coordenadas demonstrativas
        </div>
      )}
      {hasRouteSegment(points) && (
        <div className="absolute right-3 top-3 flex gap-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-700" />Início</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-700" />Fim</span>
        </div>
      )}
    </div>
  );
}
