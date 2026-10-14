import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { getNavigationItemByPath } from "@/config/navigation";
import { DevelopmentModuleContent, ReportsCatalogContent } from "./DevelopmentModulePage";

describe("development module content", () => {
  it("renders an honest informative state without simulated operational controls", () => {
    const module = getNavigationItemByPath("/custos/lancamentos");
    if (!module) throw new Error("Módulo de custos ausente no manifesto");

    const html = renderToStaticMarkup(
      <StaticRouter location="/custos/lancamentos">
        <DevelopmentModuleContent module={module} />
      </StaticRouter>,
    );

    expect(html).toContain("Em desenvolvimento");
    expect(html).toContain(module.label);
    expect(html).toContain(module.objective);
    expect(html).toContain("Recursos previstos");
    expect(html).toContain("Voltar para Custos");
    expect(html).not.toContain("Salvar");
    expect(html).not.toContain("Exportar");
    expect(html).not.toContain("<form");
  });

  it("renders a reports catalog that links to every individual planned report", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/relatorios">
        <ReportsCatalogContent />
      </StaticRouter>,
    );

    expect(html).toContain("Catálogo de relatórios");
    expect(html).toContain("17 relatórios planejados");
    expect(html).toContain('href="/relatorios/viagens"');
    expect(html).toContain('href="/relatorios/execucoes-checklist"');
  });
});
