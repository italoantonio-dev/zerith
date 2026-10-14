import { describe, expect, it } from "vitest";

import {
  developmentModules,
  getNavigationItemByPath,
  navigationGroups,
  reportModules,
  webFunctionTraceability,
} from "./navigation";

describe("navigation manifest", () => {
  it("maps each of the 49 benchmark functions exactly once", () => {
    expect(webFunctionTraceability).toHaveLength(49);
    expect(new Set(webFunctionTraceability.map((item) => item.webFunctionId)).size).toBe(49);
    expect(webFunctionTraceability.map((item) => item.webFunctionId)).toContain("WEB-FUNC-001");
    expect(webFunctionTraceability.map((item) => item.webFunctionId)).toContain("WEB-FUNC-049");
  });

  it("keeps every planned module on a unique protected path", () => {
    const paths = developmentModules.map((item) => item.path);

    expect(paths).toHaveLength(new Set(paths).size);
    expect(paths.every((path) => path.startsWith("/"))).toBe(true);
    expect(getNavigationItemByPath("/relatorios/viagens")?.webFunctionIds).toEqual(["WEB-FUNC-002"]);
  });

  it("keeps reports collapsed into a catalog while preserving all individual report routes", () => {
    const reportsGroup = navigationGroups.find((group) => group.id === "reports");

    expect(reportsGroup?.items).toHaveLength(1);
    expect(reportsGroup?.items[0]).toMatchObject({ path: "/relatorios", label: "Relatórios" });
    expect(reportModules).toHaveLength(17);
    expect(reportModules.every((item) => item.path.startsWith("/relatorios/"))).toBe(true);
  });

  it("does not advertise unfinished or simulated modules as operational", () => {
    expect(getNavigationItemByPath("/historico")?.status).toBe("EM_DESENVOLVIMENTO");
    expect(getNavigationItemByPath("/configuracoes")?.status).toBe("EM_DESENVOLVIMENTO");
    expect(getNavigationItemByPath("/rastreamento")?.status).toBe("BETA");
  });
});
