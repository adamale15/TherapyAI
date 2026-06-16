import { describe, expect, it } from "vitest";
import { PersonaGenerator } from "@/lib/services/persona-generator";

describe("PersonaGenerator", () => {
  it("requires GEMINI_API_KEY instead of using a bundled fallback secret", () => {
    const original = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      expect(() => new PersonaGenerator()).toThrow(
        "GEMINI_API_KEY is required"
      );
    } finally {
      if (original === undefined) {
        delete process.env.GEMINI_API_KEY;
      } else {
        process.env.GEMINI_API_KEY = original;
      }
    }
  });
});
