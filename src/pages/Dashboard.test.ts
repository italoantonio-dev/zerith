import { describe, expect, it } from "vitest";

import { dashboardDataOriginNotice, dashboardFilters } from "./dashboard-presentation";

describe("dashboard presentation", () => {
  it("does not present deterministic telemetry alerts as AI", () => {
    const alertFilter = dashboardFilters.find((filter) => filter.id === "alertas");

    expect(alertFilter?.label).toBe("Alertas");
    expect(dashboardFilters.map((filter) => filter.label)).not.toContain("Alertas IA");
  });

  it("discloses that the summary does not identify telemetry origin", () => {
    expect(dashboardDataOriginNotice).toBe("A origem da telemetria — real ou demonstrativa — não é discriminada neste resumo.");
  });
});
