"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Send } from "lucide-react";
import { analyzeClinicalSession, type ClinicalMessage } from "@/lib/clinical-metrics";

type HeroMessage = ClinicalMessage & { id: string };

const HERO_PERSONA_ID = "sarah";
const HERO_PERSONA_NAME = "Sarah";

const SEED_CLIENT_LINE =
  "Um, hi. I've never done therapy before, so I'm not really sure what I'm supposed to say.";

const SUGGESTED_MOVES = [
  { label: "Reflect the pressure", text: "It sounds like that pressure barely lets up." },
  { label: "Ask what's hardest", text: "What has been the hardest part lately?" },
  { label: "Offer advice", text: "Have you tried making a study schedule?" },
] as const;

const MAX_VISIBLE = 6;

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

  const sessionId = useRef(`hero-${Date.now()}`);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const traineeTurns = messages.filter((message) => message.role === "trainee").length;

  // Prime the hero session with the default client persona once.
  useEffect(() => {
    fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId.current,
      },
      body: JSON.stringify({ type: "set_persona", persona: HERO_PERSONA_ID }),
    }).catch(() => undefined);
  }, []);

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
    if (traineeTurns === 0) return null;
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

  const allianceDisplay = traineeTurns === 0 ? "—" : analysis.scores.alliance.toFixed(1);
  const alliancePct = traineeTurns === 0 ? 8 : Math.max(8, (analysis.scores.alliance / 5) * 100);

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;

    setInput("");
    setMessages((prev) =>
      [...prev, { id: `u-${Date.now()}`, role: "trainee", text } as HeroMessage].slice(-MAX_VISIBLE)
    );
    setBusy(true);

    let replyText: string;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionId.current,
        },
        body: JSON.stringify({ type: "text_input", text }),
      });
      const data = await response.json();
      replyText =
        data?.reply?.text || "I guess... I'm not sure how to put it into words yet.";
    } catch {
      replyText = "Sorry, I... lost my train of thought for a second.";
    }

    const replyId = `a-${Date.now()}`;
    setMessages((prev) =>
      [...prev, { id: replyId, role: "client", text: replyText } as HeroMessage].slice(-MAX_VISIBLE)
    );
    setReveal(0);
    setTypingId(replyId);
    setBusy(false);
    if (traineeTurns + 1 >= 2) setShowCta(true);
  };

  return (
    <div className="vesh-card w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-hot)] px-4 py-3">
        <span className="vesh-kicker flex items-center gap-2 text-[var(--vesh-black)]">
          <span className="inline-block h-2 w-2 animate-pulse-slow rounded-full bg-[var(--vesh-coral)]" />
          Live rehearsal · try it
        </span>
        <div className="flex items-center gap-2">
          <span className="vesh-kicker text-[var(--vesh-muted)]">Alliance</span>
          <span className="h-2.5 w-20 overflow-hidden rounded-full border-[1.5px] border-[var(--vesh-black)] bg-[#f0e3c4]">
            <span
              className="block h-full bg-[var(--vesh-green-bright)] transition-[width] duration-700"
              style={{ width: `${alliancePct}%` }}
            />
          </span>
          <span className="w-8 text-right text-sm font-black tabular-nums">{allianceDisplay}</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="vesh-paper max-h-[320px] min-h-[260px] overflow-y-auto px-5 py-4"
      >
        <div className="mb-2 inline-flex border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-yellow)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.04em]">
          Sarah Chen · anxiety intake
        </div>

        {messages.map((message) => {
          const isYou = message.role === "trainee";
          const shown = message.id === typingId ? message.text.slice(0, reveal) : message.text;
          return (
            <p key={message.id} className="animate-slide-up py-0.5 font-mono text-[14px] leading-7">
              <span
                className={`font-black ${isYou ? "text-[var(--vesh-green)]" : "text-[var(--vesh-coral-dark)]"}`}
              >
                {isYou ? "You:" : `${HERO_PERSONA_NAME}:`}
              </span>{" "}
              <span className={isYou ? "text-[var(--vesh-green)]" : "text-[var(--vesh-ink)]"}>
                {shown}
              </span>
              {message.id === typingId && (
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-[var(--vesh-ink)] align-[-2px]" />
              )}
            </p>
          );
        })}

        {busy && !typingId && (
          <p className="py-0.5 font-mono text-[14px] leading-7 text-[var(--vesh-muted)]">
            <span className="font-black text-[var(--vesh-coral-dark)]">{HERO_PERSONA_NAME}:</span>{" "}
            typing…
          </p>
        )}

        {coachNote && (
          <div
            className={`vesh-note animate-slide-up ml-auto mt-2 max-w-[82%] ${
              coachNote.tone === "good"
                ? "vesh-note-green"
                : coachNote.tone === "watch"
                  ? "vesh-note-red"
                  : ""
            }`}
          >
            <div className="vesh-kicker text-[var(--vesh-muted)]">Coach margin</div>
            <strong className="mt-1 block text-sm leading-tight">{coachNote.suggestion.title}</strong>
            <p className="mt-1 text-xs leading-snug text-[var(--vesh-ink)]">
              {coachNote.suggestion.body}
            </p>
          </div>
        )}
      </div>

      <div className="border-t-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-soft)] p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTED_MOVES.map((move) => (
            <button
              key={move.label}
              type="button"
              disabled={busy}
              onClick={() => void submit(move.text)}
              className="vesh-chip"
            >
              {move.label}
            </button>
          ))}
          {showCta && (
            <button
              type="button"
              onClick={onStartRehearsal}
              className="vesh-chip bg-[var(--vesh-coral)] text-[var(--vesh-paper-soft)]"
            >
              Start full rehearsal
              <ArrowRight className="ml-1 h-3 w-3" />
            </button>
          )}
        </div>
        <div className="vesh-card flex items-center gap-2 p-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit(input);
            }}
            maxLength={140}
            aria-label="Your response to the client"
            placeholder="Write your response to the client…"
            className="vesh-session-input min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--vesh-muted)]"
          />
          <button
            onClick={() => void submit(input)}
            disabled={busy}
            className="vesh-button"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
