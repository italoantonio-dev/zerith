const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8081/api/v1").replace(/\/$/, "");

const TOKEN_KEY = "zerith.accessToken";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401) clearAccessToken();
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    throw new Error(problem?.detail ?? "Falha na API (" + response.status + ")");
  }
  return response.json() as Promise<T>;
}

export interface ZerithUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  company: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  user: ZerithUser;
}

export interface DashboardSummary {
  totalVehicles: number;
  activeAlerts: number;
  criticalVehicles: number;
  lastUpdate: string | null;
  telemetryCoveragePercent: number;
  temperatureData: Array<{ date: string; value: number }>;
  alertsByRisk: Array<{ riskLevel: "baixo" | "medio" | "alto"; value: number }>;
  recentAlerts: Alert[];
}

export interface Vehicle {
  id: string;
  placa: string;
  modelo: string;
  status: "normal" | "alerta" | "critico";
  ultimaAnalise: string | null;
  tipo: string;
  ano: number | null;
  km: number;
  motorista: string | null;
  ultimaManutencao: string | null;
  deviceId: string | null;
  deviceStatus: "online" | "offline" | null;
  deviceLastSeenAt: string | null;
}

export interface Alert {
  id?: string;
  vehicleId: string;
  component: string;
  riskLevel: "baixo" | "medio" | "alto";
  status: "pendente" | "agendado" | "resolvido";
  date: string;
  description?: string;
  recommendation?: string;
}

export const zerithApi = {
  async login(email: string, password: string) {
    const response = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(response.accessToken);
    return response;
  },
  dashboard: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  vehicles: () => apiFetch<Vehicle[]>("/vehicles"),
  vehicle: (vehicleId: string) => apiFetch<Vehicle>("/vehicles/" + encodeURIComponent(vehicleId)),
  alerts: () => apiFetch<Alert[]>("/alerts"),
  telemetry: (vehicleId: string, limit = 14) =>
    apiFetch<Array<{
      date: string;
      temperature: number | null;
      vibration: number | null;
      voltage: number | null;
      rpm: number | null;
      speedKmh: number | null;
      odometerKm: number | null;
    }>>("/vehicles/" + encodeURIComponent(vehicleId) + "/telemetry?limit=" + limit),
};
