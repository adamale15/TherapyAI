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

  test("session UI uses explicit coaching and sidebar labels", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("Live supervisor");
    expect(app).toContain("Client response");
    expect(app).toContain("What worked");
    expect(app).toContain("Next move");
    expect(app).toContain("Clinical watch");
    expect(app).toContain('label="Case"');
    expect(app).toContain('label="Session"');
    expect(app).toContain('label="Voice"');
    expect(app).not.toContain("<strong>Good move</strong>");
    expect(app).not.toContain("<strong>Try next</strong>");
    expect(app).not.toContain("<strong>Watch</strong>");
  });

  test("session starts empty and wires voice features", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("setMessages([])");
    expect(app).toMatch(/The\s+simulated client will respond after your first line\./);
    expect(app).toContain("elevenLabsService.streamAudio");
    expect(app).toContain("window.speechSynthesis.speak");
    expect(app).toContain("webkitSpeechRecognition");
    expect(app).toContain("toggleListening");
    expect(app).not.toContain('id: "opening"');
    expect(app).not.toContain("I do not really know what I am supposed to say.");
  });

  test("pre-session briefing gives case background and duration controls", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain('"briefing"');
    expect(app).toContain("Pre-session briefing");
    expect(app).toContain("Session length");
    expect(app).toContain("Training objective");
    expect(app).toContain("Presenting concerns");
    expect(app).toContain("Clinical notes");
    expect(app).toContain("Begin session");
    expect(app).toContain("sessionDurations");
    expect(app).toContain("setSessionDuration");
    expect(app).toContain("sessionDuration} minute rehearsal");
  });

  test("session shows a live countdown instead of only the configured length", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("formatTimeRemaining");
    expect(app).toContain("remainingSeconds");
    expect(app).toContain("sessionStartedAt");
    expect(app).toContain("window.setInterval");
    expect(app).toContain("Time left");
    expect(app).toContain("Time up");
    expect(app).toContain('label="Time left"');
  });

  test("product copy does not expose mockup placeholders", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).not.toContain("Landing page");
    expect(app).not.toContain("Student dashboard");
    expect(app).not.toContain("Practitioner dashboard");
    expect(app).not.toContain("Persona management");
    expect(app).not.toContain("Selected file");
    expect(app).not.toContain("Default set");
    expect(app).not.toContain("View demo case");
    expect(app).not.toContain("Cohort 04");
    expect(app).not.toContain("Rushed closing");
  });
});
