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

  it("uses clinically realistic early-session pacing for bundled personas", () => {
    for (const persona of defaultPersonas) {
      expect(persona.systemPrompt).toContain("Realistic session pacing");
      expect(persona.systemPrompt).toContain("gradual");
      expect(persona.fewShotExamples?.[0]?.content).toBe("Hello, how are you feeling today?");
      expect(persona.fewShotExamples?.[1]?.content.length).toBeLessThan(280);
    }

    const marcus = defaultPersonas.find((persona) => persona.id === "marcus");
    const elena = defaultPersonas.find((persona) => persona.id === "elena");

    expect(marcus?.fewShotExamples?.[1]?.content).not.toMatch(/whatever|nothing matters|what's the point/i);
    expect(elena?.fewShotExamples?.[1]?.content).not.toMatch(/broken|everyone just lets you down/i);
  });
});
