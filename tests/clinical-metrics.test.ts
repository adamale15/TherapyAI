import { describe, expect, test } from "vitest";
import {
  analyzeClinicalSession,
  evaluateCoachSuggestionMatch,
  getCoachSuggestionStarters,
  summarizeClinicalHistory,
  type ClinicalMessage,
  type CompletedClinicalSession,
} from "@/lib/clinical-metrics";

describe("clinical metrics", () => {
  test("scores real therapy training behaviors instead of generic categories", () => {
    const messages: ClinicalMessage[] = [
      {
        role: "trainee",
        text: "It sounds like the pressure is sitting in your body all day. What feels most urgent to talk about today?",
      },
      {
        role: "client",
        text: "Yeah, my chest gets tight before bed and then I start worrying about the exam.",
      },
      {
        role: "trainee",
        text: "That makes sense. Would it be okay if we slow down and map what happens right before the panic starts?",
      },
    ];

    const analysis = analyzeClinicalSession(messages);

    expect(analysis.metrics.map((metric) => metric.label)).toEqual([
      "Working alliance",
      "Empathic accuracy",
      "Question quality",
      "Reflection ratio",
      "Collaboration",
      "Risk screen",
    ]);
    expect(analysis.behaviorCounts.reflections).toBeGreaterThan(0);
    expect(analysis.behaviorCounts.openQuestions).toBeGreaterThan(0);
    expect(analysis.behaviorCounts.collaborationMoves).toBeGreaterThan(0);
    expect(analysis.suggestions[0].title).toContain("Good therapeutic stance");
  });

  test("flags stacked questions and premature advice with specific next moves", () => {
    const analysis = analyzeClinicalSession([
      {
        role: "trainee",
        text: "Why are you doing that? Did you try breathing? You should just talk to your boss.",
      },
      {
        role: "client",
        text: "I don't know, that feels like a lot.",
      },
    ]);

    expect(analysis.behaviorCounts.stackedQuestions).toBe(1);
    expect(analysis.behaviorCounts.adviceMoves).toBeGreaterThan(0);
    expect(analysis.suggestions[1].body).toContain("one question");
    expect(analysis.suggestions[2].body).toContain("advice");
  });

  test("treats quick reassurance as premature fixing", () => {
    const analysis = analyzeClinicalSession([
      {
        role: "client",
        text: "I feel like I am barely keeping up.",
      },
      {
        role: "trainee",
        text: "It will get better.",
      },
    ]);

    expect(analysis.behaviorCounts.adviceMoves).toBeGreaterThan(0);
    expect(analysis.suggestions[1].title).toBe("Ask permission first");
    expect(analysis.suggestions[2].title).toBe("Premature advice");
  });

  test("turns client risk language into a safety-screening recommendation", () => {
    const analysis = analyzeClinicalSession([
      { role: "trainee", text: "Tell me what has been hardest this week." },
      { role: "client", text: "I feel hopeless, like there is no point in waking up." },
      { role: "trainee", text: "That sounds exhausting." },
    ]);

    const risk = analysis.metrics.find((metric) => metric.key === "riskScreen");

    expect(risk?.display).toBe("Missed");
    expect(analysis.suggestions[1].title).toBe("Screen for safety");
  });

  test("detects when a trainee follows the active next-move suggestion", () => {
    const analysis = analyzeClinicalSession([
      { role: "client", text: "I feel hopeless, like there is no point in waking up." },
      { role: "trainee", text: "That sounds exhausting." },
    ]);

    const match = evaluateCoachSuggestionMatch(
      analysis.suggestions[1],
      "I want to check on safety directly. Are you having thoughts of hurting yourself?"
    );

    expect(match.matched).toBe(true);
    expect(match.label).toBe("Safety screen matched");
    expect(match.skill).toBe("riskScreen");
  });

  test("does not reward generic reassurance when the suggested move asks for permission", () => {
    const analysis = analyzeClinicalSession([
      { role: "client", text: "I feel like I am barely keeping up." },
      { role: "trainee", text: "It will get better." },
    ]);

    const match = evaluateCoachSuggestionMatch(
      analysis.suggestions[1],
      "It will get better, just try not to worry too much."
    );

    expect(match.matched).toBe(false);
    expect(match.skill).toBe("collaboration");
  });

  test("turns the active next move into concrete response starters", () => {
    const analysis = analyzeClinicalSession([]);
    const starters = getCoachSuggestionStarters(analysis.suggestions[1]);

    expect(starters).toHaveLength(3);
    expect(starters[0]).toContain("useful");
    expect(starters.join(" ")).toContain("start");
  });

  test("summarizes completed sessions for a dynamic dashboard", () => {
    const history: CompletedClinicalSession[] = [
      {
        personaName: "Sarah Chen",
        duration: 25,
        totalMessages: 6,
        createdAt: "2026-06-15T10:00:00.000Z",
        scores: { alliance: 4.2, empathicAccuracy: 3.8, questionQuality: 3.2 },
      },
      {
        personaName: "Marcus Williams",
        duration: 10,
        totalMessages: 4,
        createdAt: "2026-06-16T10:00:00.000Z",
        scores: { alliance: 3.2, empathicAccuracy: 2.9, questionQuality: 4.4 },
      },
    ];

    const summary = summarizeClinicalHistory(history);

    expect(summary.completedSessions).toBe(2);
    expect(summary.allianceMeanDisplay).toBe("3.7/5");
    expect(summary.practiceFocus).toBe("Empathic accuracy");
    expect(summary.latestRows[0][0]).toBe("Marcus Williams");
  });
});
