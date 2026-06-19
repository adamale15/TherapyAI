import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Next build configuration", () => {
  test("keeps Vercel on the standard build directory and avoids OneDrive-local .next placeholders", () => {
    const config = read("next.config.ts");
    const gitignore = read(".gitignore");

    expect(config).toContain('distDir: process.env.VERCEL ? ".next" : ".next-local"');
    expect(gitignore).toContain(".next-local/");
  });
});
