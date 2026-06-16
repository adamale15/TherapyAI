import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("bold notebook UI system", () => {
  test("defines the bold notebook design tokens and reusable classes", () => {
    const css = read("app/globals.css");

    expect(css).toContain("--vesh-coral: #ff4b35");
    expect(css).toContain("--vesh-paper: #fbf1dc");
    expect(css).toContain(".vesh-shell");
    expect(css).toContain(".vesh-card");
    expect(css).toContain(".vesh-note");
    expect(css).toContain(".vesh-button");
  });

  test("auth pages use the bold notebook Clerk theme instead of the old purple glass theme", () => {
    const signIn = read("app/sign-in/[[...sign-in]]/page.tsx");
    const signUp = read("app/sign-up/[[...sign-up]]/page.tsx");
    const combined = `${signIn}\n${signUp}`;

    expect(combined).toContain("#ff4b35");
    expect(combined).toContain("#fbf1dc");
    expect(combined).not.toContain("purple");
    expect(combined).not.toContain("from-[#6366f1]");
  });
});
