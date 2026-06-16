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

  test("session auto-finishes at time limit and exports the summary as a PDF", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain('type SessionEndReason = "manual" | "time"');
    expect(app).toContain("sessionEndReason");
    expect(app).toContain('finishSession("time")');
    expect(app).toContain("Time limit reached");
    expect(app).toContain("downloadReportPdf");
    expect(app).toContain('import("jspdf")');
    expect(app).toContain("doc.save");
    expect(app).toContain("Download PDF");
  });

  test("dashboard and summary use dynamic clinical metrics", () => {
    const app = read("components/BoldVeshApp.tsx");
    const convexRefs = read("lib/convex/functions.ts");
    const metrics = read("lib/clinical-metrics.ts");

    expect(app).toContain("analyzeClinicalSession");
    expect(app).toContain("summarizeClinicalHistory");
    expect(app).toContain("completedSessions");
    expect(app).toContain("sessionAnalysis.metrics");
    expect(app).toContain("clinicalDashboard.latestRows");
    expect(metrics).toContain("Working alliance");
    expect(metrics).toContain("Question quality");
    expect(metrics).toContain("Reflection ratio");
    expect(metrics).toContain("Risk screen");
    expect(convexRefs).toContain("listCompletedForUser");
    expect(convexRefs).toContain("saveCompleted");
    expect(app).not.toContain('<Metric label="Sessions" value="12"');
    expect(app).not.toContain('<Metric label="Empathy" value="4.6"');
    expect(app).not.toContain("scoreRows.flatMap");
  });

  test("journal has no mystery sidebar and session composer has no red focus outline", () => {
    const app = read("components/BoldVeshApp.tsx");
    const css = read("app/globals.css");

    expect(app).not.toContain('["Log", "Cases", "Reports"]');
    expect(app).not.toContain('md:grid-cols-[78px_1fr_300px]');
    expect(app).toContain("vesh-session-input");
    expect(css).toContain(".vesh-session-input:focus-visible");
    expect(css).toContain("outline: none");
  });

  test("programs page removes the text sidebar and uses a full width matrix", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).not.toContain("Training cohort / supervision queue");
    expect(app).not.toContain('["Review queue", "Rubrics", "Personas", "Exports"]');
    expect(app).not.toContain("Supervisor workspace");
    expect(app).not.toContain("md:grid-cols-[220px_1fr]");
    expect(app).toContain("vesh-program-shell");
    expect(app).toContain("vesh-program-table");
    expect(app).toContain("Program outcomes");
    expect(app).toContain("Cohort performance");
  });

  test("landing preview removes mockup labels and keeps the demo card aligned", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).not.toContain("Clinical training lab");
    expect(app).not.toContain("min-h-[470px]");
    expect(app).toContain("vesh-demo-card");
    expect(app).toContain("vesh-demo-metrics");
    expect(app).toContain("grid-cols-[64px_1fr]");
    expect(app).toContain("sm:grid-cols-3");
    expect(app).toContain("function DemoStat");
    expect(app).toContain("vesh-demo-stat");
    expect(app).toContain("gap-5 p-6");
    expect(app).toContain("text-[clamp(1.15rem,2.4vw,1.7rem)]");
    expect(app).not.toContain('<Metric label="Safety" value="Ready" detail="if cued" compact />');
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
