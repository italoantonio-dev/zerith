export type DashboardFilter = "todos" | "alertas" | "performance" | "sensores" | "manutencao";

export const dashboardFilters: Array<{ id: DashboardFilter; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "alertas", label: "Alertas" },
  { id: "performance", label: "Performance" },
  { id: "sensores", label: "Sensores" },
  { id: "manutencao", label: "Manutenção" },
];

export const dashboardDataOriginNotice = "A origem da telemetria — real ou demonstrativa — não é discriminada neste resumo.";
