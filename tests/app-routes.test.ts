import { describe, expect, test } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathForView, viewForPathname } from "@/lib/app-routes";

const root = process.cwd();

describe("app route mapping", () => {
  test("maps each app screen to a stable URL path", () => {
    expect(pathForView("home")).toBe("/");
    expect(pathForView("student")).toBe("/journal");
    expect(pathForView("personas")).toBe("/personas");
    expect(pathForView("practitioner")).toBe("/programs");
    expect(pathForView("briefing")).toBe("/briefing");
    expect(pathForView("session")).toBe("/session");
    expect(pathForView("summary")).toBe("/report");
  });

  test("keeps selected case in the URL for case-specific screens", () => {
    expect(pathForView("briefing", { personaId: "sarah-chen" })).toBe(
      "/briefing?case=sarah-chen"
    );
    expect(pathForView("session", { personaId: "marcus-williams" })).toBe(
      "/session?case=marcus-williams"
    );
    expect(pathForView("summary", { personaId: "elena-rodriguez" })).toBe(
      "/report?case=elena-rodriguez"
    );
  });

  test("derives the app screen from refreshable route paths", () => {
    expect(viewForPathname("/")).toBe("home");
    expect(viewForPathname("/journal")).toBe("student");
    expect(viewForPathname("/journal/")).toBe("student");
    expect(viewForPathname("/personas")).toBe("personas");
    expect(viewForPathname("/programs")).toBe("practitioner");
    expect(viewForPathname("/briefing")).toBe("briefing");
    expect(viewForPathname("/session")).toBe("session");
    expect(viewForPathname("/report")).toBe("summary");
    expect(viewForPathname("/something-else")).toBe("home");
  });

  test("has a Next route page for every authenticated app screen", () => {
    for (const route of ["journal", "personas", "programs", "briefing", "session", "report"]) {
      expect(existsSync(join(root, "app", route, "page.tsx"))).toBe(true);
    }
  });
});
