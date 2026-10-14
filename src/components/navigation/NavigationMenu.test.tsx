import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { MobileNavigation, NavigationMenu } from "./NavigationMenu";

describe("navigation menu", () => {
  it("marks the active route and keeps report entries behind the catalog route", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/rastreamento">
        <NavigationMenu collapsed={false} />
      </StaticRouter>,
    );

    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Mapa e trajetória");
    expect(html).toContain("BETA");
    expect(html).toContain("Relatórios");
    expect(html).not.toContain("Excesso de velocidade");
  });

  it("exposes collapsible groups and a labelled mobile navigation surface", () => {
    const menuHtml = renderToStaticMarkup(
      <StaticRouter location="/dashboard">
        <NavigationMenu collapsed={false} />
      </StaticRouter>,
    );
    const mobileHtml = renderToStaticMarkup(
      <StaticRouter location="/dashboard">
        <MobileNavigation open onClose={() => undefined} />
      </StaticRouter>,
    );

    expect(menuHtml).toContain('aria-expanded="true"');
    expect(menuHtml).toContain("Visão geral");
    expect(mobileHtml).toContain('aria-label="Navegação principal"');
    expect(mobileHtml).toContain("Fechar navegação");
    expect(mobileHtml).toContain("md:hidden");
  });

  it("keeps long module labels readable without allowing their status badges to shrink", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/operacao/checklists">
        <NavigationMenu collapsed={false} />
      </StaticRouter>,
    );

    expect(html).toContain("Formulários de checklist");
    expect(html).toContain("break-words");
    expect(html).toContain("whitespace-nowrap");
  });
});
