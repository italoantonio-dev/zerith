import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, Clock3, MapPin, Radio, RefreshCw, Search, ShieldAlert } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { type MapDiagnostics, TrackingMap } from "@/components/tracking/TrackingMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zerithApi } from "@/lib/api";
import { formatTimestamp } from "@/lib/date-format";
import { autoSelectVehicleCode, collectTrackingPoints, defaultHistoryRange, hasRouteSegment, mapTrackingVehicle, selectTrackingVehicle } from "@/lib/tracking";

function asIso(value: string) {
  return new Date(value).toISOString();
}

function statusDescription(connection: string, gps: string) {
  const connectionText = connection === "ONLINE" ? "Online" : connection === "OFFLINE" ? "Offline" : "Sem comunicação";
  const gpsText = gps === "CURRENT" ? "GPS atual" : gps === "STALE" ? "GPS desatualizado" : gps === "ONLINE_WITHOUT_GPS" ? "Online sem GPS" : "Sem posição GPS";
  return `${connectionText} · ${gpsText}`;
}

export default function Tracking() {
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState(defaultHistoryRange);
  const [from, setFrom] = useState(historyRange.from);
  const [to, setTo] = useState(historyRange.to);
  const [mapDiagnostics, setMapDiagnostics] = useState<MapDiagnostics | null>(null);

  const fleetQuery = useQuery({
    queryKey: ["tracking", "vehicles"],
    queryFn: () => zerithApi.trackingVehicles(),
    refetchInterval: 15_000,
  });
  const vehicles = useMemo(() => (fleetQuery.data?.items ?? []).map(mapTrackingVehicle), [fleetQuery.data]);
  useEffect(() => {
    const nextSelectedCode = autoSelectVehicleCode(vehicles, selectedCode);
    if (nextSelectedCode !== selectedCode) setSelectedCode(nextSelectedCode);
  }, [selectedCode, vehicles]);
  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? vehicles.filter((vehicle) => `${vehicle.plate} ${vehicle.code} ${vehicle.model}`.toLowerCase().includes(normalized)) : vehicles;
  }, [query, vehicles]);
  const selectedVehicle = selectTrackingVehicle(vehicles, selectedCode);

  const historyQuery = useInfiniteQuery({
    queryKey: ["tracking", "history", selectedCode, historyRange],
    enabled: Boolean(selectedCode),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => zerithApi.vehiclePositions(selectedCode!, asIso(historyRange.from), asIso(historyRange.to), 500, pageParam ?? undefined),
    getNextPageParam: (page) => page.nextCursor,
  });
  const points = useMemo(
    () => collectTrackingPoints(historyQuery.data?.pages ?? []),
    [historyQuery.data],
  );
  const hasVisibleRoute = hasRouteSegment(points);

  const applyRange = () => setHistoryRange({ from, to });
  const hasCoordinates = vehicles.some((vehicle) => vehicle.hasCoordinates);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="zerith-kicker">Operação de frota</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Rastreamento</h1>
            <p className="mt-1 text-sm text-slate-500">Atualização automática a cada 15 segundos</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500" aria-live="polite">
            <RefreshCw className={fleetQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {fleetQuery.dataUpdatedAt ? `Atualizado ${formatTimestamp(new Date(fleetQuery.dataUpdatedAt).toISOString())}` : "Aguardando dados"}
          </div>
        </header>

        {fleetQuery.isLoading && <div className="zerith-panel p-8 text-center text-slate-500">Carregando frota rastreada...</div>}
        {fleetQuery.error && <div role="alert" className="zerith-panel border-red-200 p-6 text-red-700">Não foi possível carregar o rastreamento. {fleetQuery.error instanceof Error ? fleetQuery.error.message : "Tente novamente."}</div>}

        {!fleetQuery.isLoading && !fleetQuery.error && (
          <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="zerith-panel self-start overflow-hidden">
              <div className="border-b border-slate-100 p-4">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar placa ou veículo" aria-label="Buscar veículo" />
                </label>
              </div>
              <div className="max-h-[260px] overflow-y-auto p-2">
                {filteredVehicles.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-500">Nenhum veículo encontrado.</p>
                ) : filteredVehicles.map((vehicle) => (
                  <button key={vehicle.code} type="button" onClick={() => setSelectedCode(vehicle.code)}
                    className={`mb-1 w-full rounded-xl p-3 text-left transition-colors ${selectedCode === vehicle.code ? "bg-slate-900 text-white" : "hover:bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="font-semibold">{vehicle.plate}</p><p className={`text-xs ${selectedCode === vehicle.code ? "text-slate-300" : "text-slate-500"}`}>{vehicle.model}</p></div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <p className={`mt-2 text-xs ${selectedCode === vehicle.code ? "text-slate-300" : "text-slate-600"}`}>{statusDescription(vehicle.connectionStatus, vehicle.gpsStatus)}</p>
                    {vehicle.isDemonstration && <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Demonstrativo</span>}
                  </button>
                ))}
              </div>
            </aside>

            <section className="space-y-4 lg:col-start-2 lg:row-span-2">
              {!hasCoordinates && <div className="zerith-panel flex gap-3 p-5 text-sm text-slate-600"><MapPin className="h-5 w-5 shrink-0 text-slate-400" />Nenhum veículo da frota possui coordenadas GPS válidas neste momento.</div>}
              <TrackingMap vehicles={vehicles} selectedVehicle={selectedVehicle} points={points} onSelectVehicle={setSelectedCode} onDiagnostics={import.meta.env.DEV ? setMapDiagnostics : undefined} />
              {import.meta.env.DEV && mapDiagnostics && <output data-testid="tracking-map-diagnostics" className="block text-xs text-slate-500">Diagnóstico local: pontos={mapDiagnostics.historyPointCount}; source={String(mapDiagnostics.routeSourcePresent)}; layer={String(mapDiagnostics.routeLayerPresent)}; visibilidade={mapDiagnostics.routeLayerVisibility}; estilo={String(mapDiagnostics.styleLoaded)}; renderizados={mapDiagnostics.renderedRouteFeatureCount}; zoom={mapDiagnostics.zoom}</output>}
              <p className="text-xs text-slate-500">{import.meta.env.VITE_MAP_STYLE_URL ? "Atribuição cartográfica exibida no mapa pelo provedor configurado." : "Nenhum provedor externo de tiles foi configurado. MapTiler Cloud é a opção comercial recomendada; informe a URL de estilo via VITE_MAP_STYLE_URL."}</p>
            </section>

            {selectedVehicle && (
              <section className="space-y-5 lg:col-start-1 lg:row-start-2">
            <div className="zerith-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><p className="zerith-kicker">Veículo selecionado</p><h2 className="mt-1 break-words text-xl font-bold">{selectedVehicle.plate} · {selectedVehicle.model}</h2></div>
                {selectedVehicle.isDemonstration && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Coordenadas demonstrativas</span>}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
                <Detail icon={<Radio className="h-4 w-4" />} label="Conexão" value={selectedVehicle.connectionStatus} />
                <Detail icon={<MapPin className="h-4 w-4" />} label="GPS" value={selectedVehicle.positionLabel} />
                <Detail icon={<Clock3 className="h-4 w-4" />} label="Última posição" value={formatTimestamp(selectedVehicle.capturedAt)} />
                <Detail icon={<ShieldAlert className="h-4 w-4" />} label="Alerta ativo" value={selectedVehicle.hasActiveAlert ? "Sim" : "Não"} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <Detail icon={<Radio className="h-4 w-4" />} label="Velocidade" value={selectedVehicle.speedKmh === null ? "Sem leitura" : `${selectedVehicle.speedKmh} km/h`} />
                <Detail icon={<Clock3 className="h-4 w-4" />} label="Recebido" value={formatTimestamp(selectedVehicle.receivedAt)} />
              </div>
              {selectedVehicle.isStale && <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" /><span className="min-w-0 break-words">Esta coordenada ultrapassou o TTL de posição e não representa localização atual.</span></div>}
            </div>

            <div className="zerith-panel p-5">
              <p className="zerith-kicker">Histórico de posições</p>
              <div className="mt-3 grid gap-3">
                <label className="text-xs font-semibold text-slate-600">Início<input type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5" /></label>
                <label className="text-xs font-semibold text-slate-600">Fim<input type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5" /></label>
                <Button type="button" onClick={applyRange}>Consultar trajetória</Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">Horários exibidos no fuso do navegador: {timezone}.</p>
              {historyQuery.isLoading && <p className="mt-4 text-sm text-slate-500">Carregando pontos...</p>}
              {historyQuery.error && <p role="alert" className="mt-4 text-sm text-red-700">Falha ao consultar o histórico.</p>}
              {!historyQuery.isLoading && !historyQuery.error && points.length === 0 && <p className="mt-4 text-sm text-slate-500">Não há posições GPS no período selecionado. Ajuste o início ou fim e consulte novamente.</p>}
              {points.length > 0 && <div className="mt-4 text-sm text-slate-600"><p>Início: {formatTimestamp(points[0].capturedAt)}</p><p>Fim: {formatTimestamp(points.at(-1)?.capturedAt ?? null)}</p><p className="mt-1">{points.length} ponto(s) em ordem cronológica.</p></div>}
              {points.length > 0 && !hasVisibleRoute && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">As posições recebidas não apresentam deslocamento geográfico suficiente para desenhar uma trajetória.</p>}
              {selectedVehicle.isStale && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">O percurso é histórico. A posição atual deste veículo permanece identificada como GPS desatualizado.</p>}
              {historyQuery.hasNextPage && <Button type="button" variant="outline" className="mt-4 w-full" disabled={historyQuery.isFetchingNextPage} onClick={() => historyQuery.fetchNextPage()}>Carregar mais percurso</Button>}
            </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0"><div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">{icon}<span className="min-w-0 break-words">{label}</span></div><p className="mt-1 break-words font-semibold leading-snug text-slate-800">{value}</p></div>;
}
