import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Register from "./Register";

describe("Register", () => {
  it("does not present a simulated self-registration flow or collect passwords", () => {
    const html = renderToStaticMarkup(<Register />);

    expect(html).toContain("Acesso por convite");
    expect(html).toContain("Solicite um convite");
    expect(html).not.toContain("Conta criada com sucesso");
    expect(html).not.toContain('type="password"');
    expect(html).not.toContain("Criar Conta");
  });
});
