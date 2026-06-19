"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Mic, Send } from "lucide-react";
import { analyzeClinicalSession, type ClinicalMessage } from "@/lib/clinical-metrics";

type HeroMessage = ClinicalMessage & { id: string };

const HERO_PERSONA_NAME = "Sarah";

const SEED_CLIENT_LINE =
  "Um, hi. I've never done therapy before, so I'm not really sure what I'm supposed to say.";

const SUGGESTED_MOVES = [
  { label: "Reflect", text: "It sounds like that pressure barely lets up." },
  { label: "Explore", text: "What has been the hardest part lately?" },
  {
    label: "Open question",
    text: "Before we assess anything, I want to understand what this pressure feels like for you.",
  },
] as const;

const DEMO_TURN_LIMIT = 3;
const MAX_VISIBLE = DEMO_TURN_LIMIT * 2;

function pickDemoReply(options: string[], turnCount: number) {
  return options[(turnCount - 1) % options.length];
}

function buildDemoClientReply(text: string, turnCount: number) {
  const lower = text.toLowerCase();

  if (
    /\bit will get better\b|\byou'?ll be okay\b|\beverything will be okay\b|\bdon'?t worry\b|\byou got this\b|\bthings will improve\b|\byou'?ll be fine\b|\bit gets better\b/.test(
      lower
    )
  ) {
    return pickDemoReply(
      [
        "I want to believe that, but when people say it too quickly I feel like they do not really see how bad it feels right now.",
        "Maybe. I just cannot feel that from where I am sitting. It sounds nice, but also kind of far away.",
        "Part of me hopes you are right. Another part of me feels like I have been waiting for it to get better for months.",
      ],
      turnCount
    );
  }

  if (/\bshould\b|\bneed to\b|\bhave to\b|\btry to\b|\badvice\b/.test(lower)) {
    return pickDemoReply(
      [
        "I know people mean well when they say that, but then I feel like I am failing at something obvious.",
        "That makes me tense up a little. I already know the logical thing; I just cannot make myself do it.",
      ],
      turnCount
    );
  }

  if (/\bsounds like\b|\bseems like\b|\byou feel\b|\bpressure\b|\boverwhelming\b/.test(lower)) {
    return pickDemoReply(
      [
        "Yes, pressure is the word. I keep acting like I am fine because everyone expects me to handle it.",
        "Yeah. It is the pressure, and also this fear that if I slow down everything falls apart.",
        "That is close. I am not just stressed; I feel like I am constantly being measured.",
      ],
      turnCount
    );
  }

  if (/\bwhat\b|\bhow\b|\btell me\b|\bsay more\b|\bhardest\b/.test(lower)) {
    return pickDemoReply(
      [
        "The hardest part is waking up already tense, like I am behind before the day even starts.",
        "Probably nights. I replay everything I said that day and convince myself I messed it all up.",
      ],
      turnCount
    );
  }

  if (/\bsafe\b|\bhurt yourself\b|\bsuicide\b|\bkill yourself\b/.test(lower)) {
    return "I have not made a plan to hurt myself. I do get scared by how intense the thoughts feel sometimes.";
  }

  return pickDemoReply(
    [
      "I guess I am here because pretending I am okay has stopped working.",
      "I am trying to answer honestly. Part of me wants help, and part of me is embarrassed I need it.",
      "I do not know how to make this sound less dramatic. I am just tired of holding it together.",
    ],
    turnCount
  );
}

export default function NotebookHero({
  onStartRehearsal,
}: {
  onStartRehearsal: () => void;
}) {
  const [messages, setMessages] = useState<HeroMessage[]>([
    { id: "seed", role: "client", text: SEED_CLIENT_LINE },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(0);
  const [showCta, setShowCta] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const traineeTurns = messages.filter((message) => message.role === "trainee").length;

  // Reveal the latest client reply one chunk at a time for a live feel.
  useEffect(() => {
    if (!typingId) return;
    const target = messages.find((message) => message.id === typingId);
    if (!target || reveal >= target.text.length) {
      setTypingId(null);
      return;
    }
    const timer = window.setTimeout(() => setReveal((value) => value + 2), 18);
    return () => window.clearTimeout(timer);
  }, [typingId, reveal, messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, reveal]);

  const analysis = useMemo(() => analyzeClinicalSession(messages), [messages]);

  const coachNote = useMemo(() => {
    if (traineeTurns === 0) {
      return { tone: "next" as const, suggestion: analysis.suggestions[1] };
    }
    const counts = analysis.behaviorCounts;
    if (counts.riskCues > 0 && counts.riskScreens === 0) {
      return { tone: "watch" as const, suggestion: analysis.suggestions[2] };
    }
    if (counts.adviceMoves > 0) {
      return { tone: "watch" as const, suggestion: analysis.suggestions[2] };
    }
    if (counts.reflections > 0 || counts.validations > 0) {
      return { tone: "good" as const, suggestion: analysis.suggestions[0] };
    }
    return { tone: "next" as const, suggestion: analysis.suggestions[1] };
  }, [analysis, traineeTurns]);

  const allianceDisplay = traineeTurns === 0 ? "-" : analysis.scores.alliance.toFixed(1);
  const alliancePct = traineeTurns === 0 ? 8 : Math.max(8, (analysis.scores.alliance / 5) * 100);
  const demoComplete = traineeTurns >= DEMO_TURN_LIMIT;
  const timeLeftLabel = demoComplete
    ? "00:00"
    : `${Math.max(9, 12 - traineeTurns)}:${String(Math.max(0, 46 - traineeTurns * 14)).padStart(2, "0")}`;
  const reflectionMetric = analysis.metrics.find((metric) => metric.key === "reflectionRatio");
  const riskMetric = analysis.metrics.find((metric) => metric.key === "riskScreen");
  const questionDisplay =
    traineeTurns === 0
      ? "Ready"
      : analysis.scores.questionQuality >= 3.4
        ? "Good"
        : "Practice";
  const riskDisplay = riskMetric?.display ?? "Not cued";

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || busy || demoComplete) return;
    const nextTurn = traineeTurns + 1;

    setInput("");
    setMessages((prev) =>
      [...prev, { id: `u-${Date.now()}`, role: "trainee", text } as HeroMessage].slice(-MAX_VISIBLE)
    );
    setBusy(true);

    const replyText = buildDemoClientReply(text, nextTurn);
    const replyId = `a-${Date.now()}`;

    window.setTimeout(() => {
      setMessages((prev) =>
        [...prev, { id: replyId, role: "client", text: replyText } as HeroMessage].slice(-MAX_VISIBLE)
      );
      setReveal(0);
      setTypingId(replyId);
      setBusy(false);
      if (nextTurn >= DEMO_TURN_LIMIT) setShowCta(true);
    }, 260);
  };

  return (
    <div className="vesh-card w-full overflow-hidden">
      <div className="grid gap-2 border-b-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-soft)] px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <span className="vesh-kicker flex items-center gap-2 text-[var(--vesh-black)]">
            <span className="inline-block h-2.5 w-2.5 animate-pulse-slow rounded-full bg-[var(--vesh-coral)]" />
            Live rehearsal
          </span>
          <span
            className="truncate text-xs font-black uppercase tracking-[0.02em] text-[var(--vesh-black)] sm:text-sm"
            title="Sarah Chen anxiety intake"
          >
            Anxiety Intake - Sarah Chen
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="vesh-kicker text-[var(--vesh-muted)]">
            Try a 3-turn rehearsal
          </span>
          <span className="vesh-kicker tabular-nums text-[var(--vesh-black)]">
            Time left <span className="text-[var(--vesh-coral)]">{timeLeftLabel}</span>
          </span>
        </div>
      </div>

      <div className="grid min-h-[520px] bg-[var(--vesh-paper-soft)] lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-h-0 grid-rows-[minmax(280px,1fr)_auto]">
          <div
            ref={scrollRef}
            className="vesh-paper max-h-[420px] min-h-[320px] overflow-y-auto px-4 py-4 sm:max-h-[470px] sm:min-h-[380px] sm:px-5 sm:py-5 lg:max-h-none"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b-[1.5px] border-[var(--vesh-black)] pb-3">
              <div>
                <div className="vesh-kicker text-[var(--vesh-muted)]">
                  Transcript
                </div>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.02em]">
                  Sarah Chen anxiety intake
                </div>
              </div>
              <span className="vesh-chip min-h-8 px-2 text-[10px]">
                {Math.min(traineeTurns, DEMO_TURN_LIMIT)}/{DEMO_TURN_LIMIT}
              </span>
            </div>

            <div className="grid gap-2">
              {messages.map((message) => {
                const isYou = message.role === "trainee";
                const shown = message.id === typingId ? message.text.slice(0, reveal) : message.text;
                return (
                  <div
                    key={message.id}
                    className="grid animate-slide-up grid-cols-[52px_minmax(0,1fr)] gap-3 py-1 font-mono text-[13px] leading-6 sm:text-[14px] sm:leading-7"
                  >
                    <span
                      className={`pt-1 text-[10px] font-black uppercase ${
                        isYou ? "text-[var(--vesh-green)]" : "text-[var(--vesh-coral-dark)]"
                      }`}
                    >
                      {isYou ? "You" : HERO_PERSONA_NAME}
                    </span>
                    <span
                      className={`max-w-full rounded-sm border-[1.5px] border-[rgba(17,17,15,0.12)] px-3 py-2 ${
                        isYou
                          ? "bg-[#dff0dc] text-[var(--vesh-green)]"
                          : "bg-[#ffe2d5] text-[var(--vesh-ink)]"
                      }`}
                    >
                      {shown}
                      {message.id === typingId && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[var(--vesh-ink)] align-[-2px]" />
                      )}
                    </span>
                  </div>
                );
              })}

              {busy && !typingId && (
                <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 py-1 font-mono text-[13px] leading-6 text-[var(--vesh-muted)] sm:text-[14px] sm:leading-7">
                  <span className="pt-1 text-[10px] font-black uppercase text-[var(--vesh-coral-dark)]">
                    {HERO_PERSONA_NAME}
                  </span>
                  <span className="max-w-full rounded-sm border-[1.5px] border-[rgba(17,17,15,0.12)] bg-[#ffe2d5] px-3 py-2">
                    typing...
                  </span>
                </div>
              )}

              {showCta && (
                <div
                  aria-live="polite"
                  className="vesh-note vesh-note-green animate-slide-up mt-4 max-w-full p-4 sm:max-w-[88%]"
                >
                  <div className="vesh-kicker text-[var(--vesh-muted)]">
                    Mini report unlocked
                  </div>
                  <strong className="mt-1.5 block text-xl leading-none">
                    Create account for full session
                  </strong>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-ink)]">
                    Full sessions use AI voice clients, longer transcripts, and a
                    complete rubric after the rehearsal.
                  </p>
                  <button
                    type="button"
                    onClick={onStartRehearsal}
                    className="vesh-button mt-4 w-full sm:w-auto"
                  >
                    Create account for full session
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-soft)] p-3 sm:p-4">
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              {SUGGESTED_MOVES.map((move) => (
                <button
                  key={move.label}
                  type="button"
                  disabled={busy || demoComplete}
                  onClick={() => submit(move.text)}
                  className="vesh-chip min-h-10 justify-center px-3"
                >
                  {move.label}
                </button>
              ))}
            </div>
            <div className="vesh-card flex flex-wrap items-center gap-2 p-2 sm:flex-nowrap sm:p-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit(input);
                }}
                disabled={demoComplete}
                maxLength={140}
                aria-label="Your response to the client"
                placeholder={demoComplete ? "Mini report unlocked" : "Type your next response..."}
                className="vesh-session-input min-w-[180px] flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-[var(--vesh-muted)] sm:text-base"
              />
              <button
                type="button"
                disabled
                title="Voice input is available in full sessions"
                className="vesh-chip min-h-10 px-3"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button onClick={() => submit(input)} disabled={busy || demoComplete} className="vesh-button flex-1 sm:flex-none">
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--vesh-muted)]">
              Reflection before assessment. Use the prompts above to practice the next move.
            </p>
          </div>
        </div>

        <aside className="grid content-start border-t-[1.5px] border-[var(--vesh-black)] bg-[rgba(255,232,189,0.42)] lg:border-l-[1.5px] lg:border-t-0">
          <div className="border-b-[1.5px] border-[var(--vesh-black)] p-4">
            <div
              data-legacy-label="Coach margin"
              className={`vesh-note max-w-full p-4 ${
                coachNote.tone === "good"
                  ? "vesh-note-green"
                  : coachNote.tone === "watch"
                    ? "vesh-note-red"
                    : ""
              }`}
            >
              <div className="vesh-kicker text-[var(--vesh-muted)]">
                Coaching margin
              </div>
              <strong className="mt-1.5 block text-base leading-tight">
                {coachNote.suggestion.title}
              </strong>
              <p className="mt-2 text-sm leading-snug text-[var(--vesh-ink)]">
                {coachNote.suggestion.body}
              </p>
            </div>
          </div>

          <div className="border-b-[1.5px] border-[var(--vesh-black)] p-4">
            <div className="vesh-kicker text-[var(--vesh-muted)]">
              Alliance score
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black leading-none tabular-nums">
                {allianceDisplay}
              </span>
              <span className="pb-1 text-sm font-black">/5</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-sm border-[1.5px] border-[var(--vesh-black)] bg-[#f0e3c4]">
              <span
                className="block h-full bg-[var(--vesh-green-bright)] transition-[width] duration-700"
                style={{ width: `${alliancePct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-bold text-[var(--vesh-muted)]">
              <span>1</span>
              <span>3</span>
              <span>5</span>
            </div>
          </div>

          <div className="grid gap-0">
            <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-[var(--vesh-black)] px-4 py-3">
              <span className="vesh-kicker text-[var(--vesh-muted)]">
                Reflection ratio
              </span>
              <strong className="text-sm tabular-nums">
                {reflectionMetric?.display ?? "0:0"}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-[var(--vesh-black)] px-4 py-3">
              <span className="vesh-kicker text-[var(--vesh-muted)]">
                Question quality
              </span>
              <strong className="text-sm text-[var(--vesh-green)]">
                {questionDisplay}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-[var(--vesh-black)] px-4 py-3">
              <span className="vesh-kicker text-[var(--vesh-muted)]">
                Risk screen
              </span>
              <strong className="text-sm text-[var(--vesh-green)]">
                {riskDisplay}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartRehearsal}
            className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-black uppercase"
          >
            <span>View full rubric</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
