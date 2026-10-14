import { describe, expect, it } from "vitest";
import { formatTimestamp } from "./date-format";

describe("formatTimestamp", () => {
  it("formats a valid timestamp with date, time, and timezone without throwing", () => {
    expect(() => formatTimestamp("2026-10-09T16:18:00Z")).not.toThrow();

    const formatted = formatTimestamp("2026-10-09T16:18:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/\d{2}:\d{2}/);
    expect(formatted).toMatch(/(?:GMT|UTC|BRT)/);
  });

  it("keeps missing timestamps explicit", () => {
    expect(formatTimestamp(null)).toBe("Sem registro");
  });

  it("handles invalid timestamps without throwing", () => {
    expect(formatTimestamp("not-a-timestamp")).toBe("Data inválida");
  });
});
