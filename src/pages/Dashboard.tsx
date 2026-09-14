import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Filter,
  Radio,
  ServerCrash,
  Wrench,
  Zap,
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Alert, Vehicle, zerithApi } from "@/lib/api";

type DashboardFilter = "todos" | "alertas" | "performance" | "sensores" | "manutencao";
type DirectoryTab = "route" | "available";

const filters: Array<{ id: DashboardFilter; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "alertas", label: "Alertas IA" },
  { id: "performance", label: "Performance" },
  { id: "sensores", label: "Sensores" },
  { id: "manutencao", label: "Manutenção" },
];

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
    : "Aguardando leitura";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<DashboardFilter>("todos");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [directoryTab, setDirectoryTab] = useState<DirectoryTab>("route");

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: zerithApi.dashboard,
    refetchInterval: 15_000,
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: zerithApi.vehicles,
    refetchInterval: 15_000,
  });

  const vehicles = vehiclesQuery.data ?? [];
  const data = summaryQuery.data;

  const filteredVehicles = useMemo(() => {
    if (filter === "alertas" || filter === "manutencao") {
      return vehicles.filter((vehicle) => vehicle.status !== "normal");
    }
    if (filter === "performance") {
      return vehicles.filter((vehicle) => vehicle.status === "normal");
    }
    if (filter === "sensores") {
      return vehicles.filter((vehicle) => Boolean(vehicle.deviceId));
    }
    return vehicles;
  }, [filter, vehicles]);

  const selectedVehicle =
    filteredVehicles.length > 0
      ? filteredVehicles[selectedIndex % filteredVehicles.length]
      : vehicles[0];

  const selectedAlert = selectedVehicle
    ? data?.recentAlerts.find((alert) => alert.vehicleId === selectedVehicle.id)
    : undefined;

  const routeVehicles = vehicles.filter((vehicle) => vehicle.deviceStatus === "online");
  const availableVehicles = vehicles.filter((vehicle) => vehicle.deviceStatus !== "online");
  const directoryVehicles = directoryTab === "route" ? routeVehicles : availableVehicles;

  const moveSelection = (direction: number) => {
    if (filteredVehicles.length < 2) return;
    setSelectedIndex((current) => (current + direction + filteredVehicles.length) % filteredVehicles.length);
  };

  if (summaryQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="grid animate-pulse gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="space-y-5">
            <div className="h-40 rounded-[24px] bg-white" />
            <div className="h-[560px] rounded-[28px] bg-white" />
          </div>
          <div className="h-72 rounded-[24px] bg-white" />
        </div>
      </DashboardLayout>
    );
  }

  if (summaryQuery.error || !data) {
    return (
      <DashboardLayout>
        <div className="zerith-panel mx-auto mt-12 max-w-xl p-8">
          <ServerCrash className="mb-4 h-8 w-8 text-red-500" />
          <h2 className="text-xl font-semibold text-slate-900">API indisponível</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Inicie o backend com docker compose up --build e recarregue esta página.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-5">
          <section className="zerith-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="zerith-kicker">Saúde da frota leve</p>
                <p className="mt-1 text-xs text-slate-400">
                  {user?.company} · atualizado em {formatDate(data.lastUpdate)}
                </p>
              </div>
              <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Dados ao vivo
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HealthMetric
                label="Disponibilidade"
                value={data.telemetryCoveragePercent + "%"}
                tone="green"
                detail="telemetria nas últimas 24h"
              />
              <HealthMetric
                label="Alertas pendentes"
                value={data.activeAlerts}
                tone="amber"
                detail="necessitam atenção"
              />
              <HealthMetric
                label="Veículos críticos"
                value={data.criticalVehicles}
                tone="red"
                detail={"de " + data.totalVehicles + " monitorados"}
              />
            </div>
          </section>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hidden">
            <Filter className="mr-1 h-4 w-4 shrink-0 text-slate-400" />
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFilter(item.id);
                  setSelectedIndex(0);
                }}
                className={cn(
                  "h-10 shrink-0 rounded-full border px-5 text-xs font-medium transition-all",
                  filter === item.id
                    ? "border-[#202735] bg-[#202735] text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <section className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <div className="relative flex min-h-[310px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#ffffff_0%,#f0f2f5_68%,#eceff3_100%)] px-16 py-10">
              <StatusBadge alert={selectedAlert} vehicle={selectedVehicle} />

              <button
                type="button"
                onClick={() => moveSelection(-1)}
                disabled={filteredVehicles.length < 2}
                className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Veículo anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <VehicleIllustration critical={selectedVehicle?.status === "critico"} />

              <button
                type="button"
                onClick={() => moveSelection(1)}
                disabled={filteredVehicles.length < 2}
                className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Próximo veículo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="relative -mt-5 rounded-t-[32px] bg-white px-5 pb-6 pt-4 sm:px-8">
              <div className="mb-4 flex justify-center gap-1">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className={cn("h-1.5 rounded-full", dot === 0 ? "w-6 bg-[#202735]" : "w-2 bg-slate-300")}
                  />
                ))}
              </div>

              {selectedVehicle ? (
                <>
                  <div className="text-center">
                    <h1 className="text-2xl font-medium text-[#303846]">{selectedVehicle.modelo}</h1>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Placa: {selectedVehicle.placa} · Motorista: {selectedVehicle.motorista ?? "Não atribuído"}
                    </p>
                  </div>

                  <AlertPanel alert={selectedAlert} vehicle={selectedVehicle} />

                  <button
                    type="button"
                    onClick={() => navigate("/veiculo/" + selectedVehicle.id)}
                    className="mx-auto mt-5 flex h-12 w-full max-w-[320px] items-center justify-center gap-2 rounded-full bg-[#202735] text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#2c3545]"
                  >
                    <Activity className="h-4 w-4" />
                    Iniciar diagnóstico
                  </button>
                </>
              ) : (
                <div className="py-14 text-center">
                  <CarFront className="mx-auto h-9 w-9 text-slate-300" />
                  <h2 className="mt-3 text-base font-semibold text-slate-700">Nenhum veículo nesta categoria</h2>
                  <p className="mt-1 text-sm text-slate-500">Selecione outro filtro ou cadastre um veículo.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <QuickDirectory
          activeTab={directoryTab}
          onTabChange={setDirectoryTab}
          routeVehicles={routeVehicles}
          availableVehicles={availableVehicles}
          vehicles={directoryVehicles}
          onOpen={(vehicleId) => navigate("/veiculo/" + vehicleId)}
        />
      </div>
    </DashboardLayout>
  );
};

const HealthMetric = ({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string | number;
  tone: "green" | "amber" | "red";
  detail: string;
}) => {
  const tones = {
    green: "text-emerald-500",
    amber: "text-amber-500",
    red: "text-red-500",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-[#f7f8fa] px-4 py-4">
      <p className="text-xs text-slate-600">{label}</p>
      <p className={cn("mt-1 text-2xl font-light", tones[tone])}>{value}</p>
      <p className="mt-1 truncate text-[10px] text-slate-400">{detail}</p>
    </div>
  );
};

const StatusBadge = ({ alert, vehicle }: { alert?: Alert; vehicle?: Vehicle }) => {
  const needsAction = Boolean(alert) || vehicle?.status === "critico";

  return (
    <span
      className={cn(
        "absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] shadow-sm",
        needsAction
          ? "border-red-200 bg-red-50 text-red-500"
          : "border-emerald-200 bg-emerald-50 text-emerald-600"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", needsAction ? "bg-red-500" : "bg-emerald-500")} />
      {needsAction ? "Ação necessária" : "Operação normal"}
    </span>
  );
};

const AlertPanel = ({ alert, vehicle }: { alert?: Alert; vehicle: Vehicle }) => {
  if (!alert && vehicle.status === "normal") {
    return (
      <div className="mt-4 flex items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-emerald-700">Operação dentro dos parâmetros</p>
          <p className="mt-1 text-xs text-emerald-600/80">Nenhum alerta ativo foi identificado para este veículo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-start gap-4 rounded-2xl border border-red-100 bg-red-50/80 px-5 py-4">
      <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div>
        <p className="text-sm font-semibold text-red-600">
          {alert ? alert.component + " requer atenção" : "Veículo em estado crítico"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {alert?.description ?? "Consulte a telemetria e execute um diagnóstico detalhado."}
        </p>
      </div>
    </div>
  );
};

const QuickDirectory = ({
  activeTab,
  onTabChange,
  routeVehicles,
  availableVehicles,
  vehicles,
  onOpen,
}: {
  activeTab: DirectoryTab;
  onTabChange: (tab: DirectoryTab) => void;
  routeVehicles: Vehicle[];
  availableVehicles: Vehicle[];
  vehicles: Vehicle[];
  onOpen: (vehicleId: string) => void;
}) => (
  <aside className="min-w-0">
    <p className="zerith-kicker mb-4 px-1">Diretório rápido</p>

    <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onTabChange("route")}
        className={cn(
          "h-9 rounded-full text-[11px] font-semibold transition",
          activeTab === "route" ? "bg-white text-slate-900 shadow-md" : "text-slate-400"
        )}
      >
        Em rota ({routeVehicles.length})
      </button>
      <button
        type="button"
        onClick={() => onTabChange("available")}
        className={cn(
          "h-9 rounded-full text-[11px] font-semibold transition",
          activeTab === "available" ? "bg-white text-slate-900 shadow-md" : "text-slate-400"
        )}
      >
        Disponível ({availableVehicles.length})
      </button>
    </div>

    <div className="mt-4 space-y-3">
      {vehicles.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/60 px-5 py-8 text-center">
          <Radio className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-2 text-xs text-slate-500">Nenhum veículo neste status.</p>
        </div>
      ) : (
        vehicles.slice(0, 5).map((vehicle) => (
          <button
            key={vehicle.id}
            type="button"
            onClick={() => onOpen(vehicle.id)}
            className="group flex w-full items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white px-4 py-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
              {getInitials(vehicle.motorista ?? vehicle.modelo)}
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                  vehicle.deviceStatus === "online" ? "bg-emerald-500" : "bg-slate-300"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {vehicle.motorista ?? "Motorista não atribuído"}
              </p>
              <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-blue-500">
                {vehicle.deviceStatus === "online" ? "Telemetria online" : "Disponível para vínculo"}
              </p>
              <p className="mt-1 truncate text-[10px] text-slate-400">{vehicle.placa} · {vehicle.modelo}</p>
            </div>
            <div className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:text-slate-700">
              <CarFront className={cn("h-5 w-5", vehicle.status === "critico" && "text-red-500")} />
            </div>
          </button>
        ))
      )}
    </div>
  </aside>
);

const VehicleIllustration = ({ critical }: { critical: boolean }) => (
  <svg
    viewBox="0 0 620 250"
    className="w-full max-w-[600px]"
    role="img"
    aria-label="Ilustração lateral do veículo monitorado"
  >
    <defs>
      <linearGradient id="bodyPaint" x1="0" x2="1">
        <stop offset="0" stopColor="#f8fafc" />
        <stop offset="0.55" stopColor="#ffffff" />
        <stop offset="1" stopColor="#dbe3ec" />
      </linearGradient>
      <linearGradient id="windowPaint" x1="0" x2="1">
        <stop offset="0" stopColor="#1c2635" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
      <filter id="carShadow" x="-20%" y="-30%" width="140%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
        <feOffset dy="12" />
        <feColorMatrix values="0 0 0 0 0.1 0 0 0 0 0.15 0 0 0 0 0.22 0 0 0 .18 0" />
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    <ellipse cx="312" cy="205" rx="225" ry="19" fill="#cbd5e1" opacity=".28" />

    <g opacity=".16" transform="translate(-115 20) scale(.72)">
      <path d="M110 176 C145 132 210 116 292 115 L365 116 C420 119 462 136 504 166 L545 178 L530 202 L118 202 Z" fill="#94a3b8" />
    </g>
    <g opacity=".16" transform="translate(325 20) scale(.72)">
      <path d="M110 176 C145 132 210 116 292 115 L365 116 C420 119 462 136 504 166 L545 178 L530 202 L118 202 Z" fill="#94a3b8" />
    </g>

    <g filter="url(#carShadow)">
      <path
        d="M98 177 C125 153 164 144 208 139 L267 91 C282 79 303 73 331 73 H403 C431 74 452 88 473 114 L505 146 C526 149 545 155 558 169 L550 194 H505 C500 165 480 149 454 149 C425 149 405 166 400 194 H241 C236 165 215 149 188 149 C159 149 139 167 135 194 H91 L78 185 Z"
        fill="url(#bodyPaint)"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      <path d="M280 96 C291 87 306 84 329 84 H395 C415 85 431 96 450 119 L267 119 Z" fill="url(#windowPaint)" />
      <path d="M270 126 L457 126" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M360 88 L360 190" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M505 149 L546 164 L537 179 L505 176 Z" fill="#182130" />
      <path d="M86 174 L119 164 L128 176 L93 183 Z" fill="#ff5c62" opacity=".9" />
      <circle cx="188" cy="193" r="36" fill="#111827" />
      <circle cx="188" cy="193" r="23" fill="#374151" stroke="#facc15" strokeWidth="5" />
      <circle cx="188" cy="193" r="9" fill="#111827" />
      <circle cx="454" cy="193" r="36" fill="#111827" />
      <circle cx="454" cy="193" r="23" fill="#374151" stroke="#facc15" strokeWidth="5" />
      <circle cx="454" cy="193" r="9" fill="#111827" />
    </g>

    {critical && (
      <>
        <circle cx="188" cy="193" r="48" fill="none" stroke="#ff5c62" strokeWidth="2" strokeDasharray="7 7" />
        <path d="M188 141 L158 72" stroke="#ff5c62" strokeWidth="2" />
        <circle cx="158" cy="72" r="5" fill="#ff5c62" />
      </>
    )}
  </svg>
);

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default Dashboard;
