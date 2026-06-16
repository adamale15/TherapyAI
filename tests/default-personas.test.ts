import { describe, expect, it } from "vitest";
import { defaultPersonas } from "@/lib/personas/default-personas";

describe("defaultPersonas", () => {
  it("contains the three bundled training personas with stable ids", () => {
    expect(defaultPersonas.map((persona) => persona.id)).toEqual([
      "sarah",
      "marcus",
      "elena",
    ]);
  });
});
