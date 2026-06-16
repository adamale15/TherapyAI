"use client";

import React, { useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  LogOut,
  MessageSquare,
  Mic,
  Send,
  Target,
  Upload,
} from "lucide-react";
import { PersonaUploadModal } from "./PersonaUploadModal";
import { convexFunctions } from "@/lib/convex/functions";
import { defaultPersonas, type PersonaData } from "@/lib/personas/default-personas";
import { elevenLabsService } from "@/lib/services/elevenlabs-service";

type View =
  | "home"
  | "student"
  | "practitioner"
  | "personas"
  | "session"
  | "summary";

type Message = {
  id: string;
  role: "client" | "trainee";
  text: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

const personaVoiceIds: Record<string, string> = {
  "Sarah Chen": "EXAVITQu4vr4xnSDxMaL",
  "Marcus Williams": "ErXwobaYiN019PkySvjV",
  "Elena Rodriguez": "21m00Tcm4TlvDq8ikWAM",
};

const scoreRows = [
  ["A. Damale", "4.8", "3.9", "Sarah B", "Review crisis branch"],
  ["M. Patel", "4.5", "4.0", "Marcus A", "Rushed closing"],
  ["S. Nguyen", "4.1", "4.4", "Elena A", "Strong grounding"],
  ["J. Rivera", "3.4", "4.7", "Custom", "Safety plan good"],
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function difficultyClass(difficulty: PersonaData["difficulty"]) {
  if (difficulty === "Beginner") return "bg-[var(--vesh-green)]";
  if (difficulty === "Intermediate") return "bg-[var(--vesh-blue)]";
  return "bg-[var(--vesh-coral)]";
}

function Brand() {
  return (
    <span className="vesh-brand">
      <span className="vesh-mark">V</span>
      Vesh
    </span>
  );
}

function Topbar({
  view,
  onNavigate,
  onSignOut,
  signedIn,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
  signedIn: boolean;
}) {
  return (
    <header className="vesh-topbar sticky top-0 z-30">
      <button onClick={() => onNavigate("home")} className="text-left">
        <Brand />
      </button>
      <nav className="hidden items-center justify-center gap-2 md:flex">
        <button
          onClick={() => onNavigate("student")}
          className={`vesh-chip ${view === "student" ? "vesh-chip-active" : ""}`}
        >
          Journal
        </button>
        <button
          onClick={() => onNavigate("personas")}
          className={`vesh-chip ${view === "personas" ? "vesh-chip-active" : ""}`}
        >
          Personas
        </button>
        <button
          onClick={() => onNavigate("practitioner")}
          className={`vesh-chip ${view === "practitioner" ? "vesh-chip-active" : ""}`}
        >
          Programs
        </button>
      </nav>
      <div className="flex items-center gap-2">
        {signedIn ? (
          <button onClick={onSignOut} className="vesh-button vesh-button-green">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        ) : (
          <button onClick={() => onNavigate("student")} className="vesh-button">
            Start free
          </button>
        )}
      </div>
    </header>
  );
}

function PersonaCard({
  persona,
  selected,
  onStart,
}: {
  persona: PersonaData;
  selected?: boolean;
  onStart: (persona: PersonaData) => void;
}) {
  return (
    <article
      className={`vesh-card p-4 ${selected ? "bg-[var(--vesh-paper-hot)]" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className={`vesh-avatar ${difficultyClass(persona.difficulty)}`}>
          {initials(persona.name)}
        </div>
        <span className={`vesh-chip ${selected ? "vesh-chip-active" : ""}`}>
          {persona.difficulty}
        </span>
      </div>
      <h3 className="text-lg font-black uppercase leading-none tracking-[-0.02em]">
        {persona.name}
      </h3>
      <p className="mt-1 text-sm text-[var(--vesh-muted)]">
        {persona.condition} / {persona.occupation}
      </p>
      <p className="mt-3 line-clamp-3 text-sm text-[var(--vesh-muted)]">
        {persona.description}
      </p>
      <button onClick={() => onStart(persona)} className="vesh-button mt-4 w-full">
        Start case
      </button>
    </article>
  );
}

function Metric({
  label,
  value,
  detail,
  compact = false,
}: {
  label: string;
  value: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div className={`vesh-card min-w-0 ${compact ? "p-3" : "p-4"}`}>
      <div className="vesh-kicker text-[var(--vesh-muted)]">{label}</div>
      <div
        className={`mt-2 font-black uppercase leading-none tracking-[-0.03em] ${
          compact
            ? "whitespace-nowrap text-[clamp(1.35rem,1.35vw,1.55rem)]"
            : "text-4xl"
        }`}
      >
        {value}
      </div>
      <p className="mt-2 text-xs text-[var(--vesh-muted)]">{detail}</p>
    </div>
  );
}

function RailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="w-full border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-soft)] p-3 shadow-[4px_4px_0_rgba(17,17,15,0.14)]">
      <div className="flex items-center gap-2 text-[var(--vesh-muted)]">
        <Icon className="h-4 w-4" />
        <span className="vesh-kicker">{label}</span>
      </div>
      <div className="mt-2 text-sm font-black uppercase leading-tight">{value}</div>
    </div>
  );
}

function CoachCard({
  tone,
  eyebrow,
  title,
  children,
}: {
  tone: "good" | "next" | "watch";
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const Icon = tone === "watch" ? AlertTriangle : tone === "next" ? Target : CheckCircle;
  const toneClass =
    tone === "watch"
      ? "vesh-note-red"
      : tone === "good"
        ? "vesh-note-green"
        : "";

  return (
    <div className={`vesh-note ${toneClass}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-soft)]">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="vesh-kicker text-[var(--vesh-muted)]">{eyebrow}</div>
          <strong className="mt-1 block text-lg leading-none">{title}</strong>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--vesh-ink)]">
        {children}
      </p>
    </div>
  );
}

export default function BoldVeshApp() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const [view, setView] = useState<View>("home");
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string[]>([
    "Reflect the pressure before moving into assessment.",
    "Ask one question at a time.",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice ready");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const sessionId = useRef(`session-${Date.now()}`);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const convexPersonas = useQuery(convexFunctions.personas.listForUser, {
    ownerClerkId: user?.id,
  });

  const personas = useMemo(
    () => ((convexPersonas as PersonaData[] | undefined) ?? defaultPersonas),
    [convexPersonas]
  );

  const currentUserType =
    (user?.publicMetadata?.userType as "student" | "practitioner" | undefined) ??
    "student";

  const signedIn = !!user && isLoaded;

  const navigate = (target: View) => {
    if (!signedIn && target !== "home") {
      router.push("/sign-up?userType=student");
      return;
    }
    setView(target);
  };

  const handleSignOut = async () => {
    stopVoice();
    stopListening();
    await signOut();
    setView("home");
    setSelectedPersona(null);
    setMessages([]);
  };

  const speakText = async (text: string, persona: PersonaData | null) => {
    if (typeof window === "undefined") return;

    const cleanText = text
      .replace(/\*([^*]+)\*/g, "")
      .replace(/\[([^\]]+)\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    stopVoice();
    setIsSpeaking(true);
    setVoiceStatus("Speaking");

    const voiceId = persona ? personaVoiceIds[persona.name] : undefined;

    if (voiceId) {
      try {
        const stream = await elevenLabsService.streamAudio(cleanText, voiceId);
        if (stream) {
          await elevenLabsService.playAudio(stream);
          setIsSpeaking(false);
          setVoiceStatus("Voice ready");
          return;
        }
      } catch (error) {
        console.warn("ElevenLabs playback failed, using browser voice.", error);
      }
    }

    if (!("speechSynthesis" in window)) {
      setIsSpeaking(false);
      setVoiceStatus("Voice unavailable");
      return;
    }

    const speakWithVoices = (voices: SpeechSynthesisVoice[]) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const lowerName = persona?.name.toLowerCase() ?? "";
      const preferFemale = lowerName.includes("sarah") || lowerName.includes("elena");
      const voice = voices.find((candidate) => {
        const name = candidate.name.toLowerCase();
        return preferFemale
          ? ["female", "samantha", "victoria", "jenny", "aria"].some((key) => name.includes(key))
          : ["male", "david", "mark", "guy", "alex", "antoni"].some((key) => name.includes(key));
      }) ?? voices.find((candidate) => /google|microsoft|natural/i.test(candidate.name)) ?? voices[0];

      if (voice) utterance.voice = voice;
      utterance.rate = lowerName.includes("marcus") ? 0.92 : 1;
      utterance.pitch = lowerName.includes("marcus") ? 0.92 : 1;
      utterance.volume = 0.9;
      utterance.onend = () => {
        setIsSpeaking(false);
        setVoiceStatus("Voice ready");
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setVoiceStatus("Voice unavailable");
      };
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakWithVoices(voices);
      return;
    }

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => speakWithVoices(window.speechSynthesis.getVoices()),
      { once: true }
    );
  };

  const stopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    elevenLabsService.stop();
    setIsSpeaking(false);
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Recognition may already be stopped by the browser.
    }

    recognitionRef.current = null;
    setIsListening(false);
    setVoiceStatus("Voice ready");
  };

  const toggleListening = () => {
    if (typeof window === "undefined") return;

    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus("Mic unsupported");
      return;
    }

    stopVoice();
    const recognition = new SpeechRecognition() as SpeechRecognitionLike;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus("Listening");
    };
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setInput(transcript.trim());
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus("Voice ready");
    };
    recognition.onerror = (event: any) => {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceStatus(event?.error === "not-allowed" ? "Mic blocked" : "Mic error");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const startSession = async (persona: PersonaData) => {
    if (!signedIn) {
      router.push("/sign-up?userType=student");
      return;
    }

    stopVoice();
    stopListening();
    sessionId.current = `session-${Date.now()}`;
    setSelectedPersona(persona);
    setMessages([]);
    setInput("");
    setFeedback([
      "Begin the session with your first therapeutic response.",
      "The client will answer after you send or speak your line.",
    ]);
    setVoiceStatus("Voice ready");
    setView("session");

    await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId.current,
      },
      body: JSON.stringify({ type: "set_persona", persona: persona.id }),
    }).catch(() => undefined);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "trainee", text },
    ]);
    setIsLoading(true);

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
      const replyText =
        data?.reply?.text ||
        "I hear you, but I am not sure I believe this can actually help.";
      const coachFeedback = Array.isArray(data?.reply?.state?.feedback)
        ? data.reply.state.feedback
        : ["Good reflection. Stay with the emotion before giving direction."];

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "client", text: replyText },
      ]);
      setFeedback(coachFeedback.slice(-3));
      void speakText(replyText, selectedOrFirst);
    } catch {
      const fallbackReply =
        "Part of me wants to answer, and part of me feels embarrassed saying it out loud.";
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "client",
          text: fallbackReply,
        },
      ]);
      setFeedback([
        "The reply named ambivalence well.",
        "Try a grounded follow-up question next.",
      ]);
      void speakText(fallbackReply, selectedOrFirst);
    } finally {
      setIsLoading(false);
    }
  };

  const finishSession = () => {
    stopVoice();
    stopListening();
    setView("summary");
  };

  const selectedOrFirst = selectedPersona ?? personas[0];

  return (
    <main className="vesh-shell min-h-screen">
      <Topbar
        view={view}
        onNavigate={navigate}
        onSignOut={handleSignOut}
        signedIn={signedIn}
      />

      {view === "home" && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 gap-8 p-6 lg:grid-cols-[1fr_440px] lg:items-center lg:p-10">
          <div>
            <div className="vesh-kicker mb-4">Landing page</div>
            <h1 className="vesh-heading max-w-3xl">
              Clinical practice that finally feels{" "}
              <span className="inline-block bg-[var(--vesh-black)] px-3 pb-2 text-[var(--vesh-paper-soft)]">
                alive.
              </span>
            </h1>
            <p className="vesh-subheading mt-5 max-w-xl">
              AI clients, live supervision cues, and review-ready session notes
              for therapy students who need reps before real stakes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() =>
                  signedIn
                    ? setView(currentUserType === "practitioner" ? "practitioner" : "student")
                    : router.push("/sign-up?userType=student")
                }
                className="vesh-button"
              >
                Start rehearsal
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => selectedOrFirst && startSession(selectedOrFirst)}
                className="vesh-button vesh-button-yellow"
              >
                View demo case
              </button>
            </div>
          </div>

          <div className="vesh-card grid min-h-[470px] grid-cols-[80px_1fr] overflow-hidden">
            <div className="border-r-[1.5px] border-[var(--vesh-black)] bg-[rgba(255,75,53,0.09)] p-5 text-center text-2xl font-black text-[var(--vesh-coral)]">
              04
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="vesh-kicker text-[var(--vesh-muted)]">
                    Live rehearsal
                  </div>
                  <h2 className="mt-2 text-xl font-black uppercase leading-none">
                    Sarah Chen / anxiety intake
                  </h2>
                </div>
                <span className="vesh-chip vesh-chip-active">Ready</span>
              </div>
              <div className="my-4 h-[1.5px] bg-[var(--vesh-black)]" />
              <div className="vesh-note">
                <strong>Coach margin</strong>
                <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                  Reflect the pressure first. Assessment comes after she feels
                  heard.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Metric label="Rapport" value="82%" detail="opening phase" compact />
                <Metric label="Pace" value="Good" detail="steady" compact />
                <Metric label="Risk" value="Low" detail="stable" compact />
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "student" && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 md:grid-cols-[78px_1fr_300px]">
          <aside className="vesh-rail hidden p-4 md:grid md:content-start md:justify-items-center md:gap-3">
            {["J", "C", "R"].map((item) => (
              <span key={item} className="vesh-chip w-10 px-0">
                {item}
              </span>
            ))}
          </aside>
          <div className="p-6">
            <div className="vesh-kicker">Student dashboard</div>
            <h1 className="vesh-heading mt-2 text-4xl">Practice journal</h1>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric label="Sessions" value="12" detail="3 this week" />
              <Metric label="Rapport" value="4.2" detail="steady rise" />
              <Metric label="Focus" value="Pace" detail="recommended skill" />
            </div>
            <div className="my-5 h-[1.5px] bg-[var(--vesh-black)]" />
            <div className="grid gap-4 md:grid-cols-3">
              {personas.slice(0, 3).map((persona, index) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  selected={index === 0}
                  onStart={startSession}
                />
              ))}
            </div>
          </div>
          <aside className="border-t-[1.5px] border-[var(--vesh-black)] bg-[rgba(15,61,50,0.06)] p-6 md:border-l-[1.5px] md:border-t-0">
            <div className="vesh-note">
              <strong>This week</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                You are improving at naming emotion. Next: ask fewer stacked
                questions.
              </p>
            </div>
            <div className="mt-5 h-20 grid-cols-[repeat(18,1fr)] items-end gap-1 grid">
              {[28, 42, 35, 54, 30, 48, 62, 38, 44, 58, 31, 49, 60, 37, 53, 43, 57, 46].map(
                (height, index) => (
                  <span
                    key={index}
                    className="block min-h-2 border-[1.5px] border-[var(--vesh-black)]"
                    style={{
                      height,
                      background:
                        index % 5 === 1
                          ? "var(--vesh-coral)"
                          : index % 4 === 0
                          ? "var(--vesh-yellow)"
                          : "var(--vesh-green-bright)",
                    }}
                  />
                )
              )}
            </div>
          </aside>
        </section>
      )}

      {view === "practitioner" && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 md:grid-cols-[220px_1fr]">
          <aside className="bg-[var(--vesh-black)] p-6 text-[var(--vesh-paper-soft)]">
            <h1 className="text-4xl font-black uppercase tracking-[-0.03em]">
              Desk
            </h1>
            <p className="mt-2 text-sm text-[#cabca0]">
              Cohort 04 / supervision queue
            </p>
            <div className="mt-6 grid gap-2">
              {["Review queue", "Rubrics", "Personas", "Exports"].map((item, index) => (
                <span
                  key={item}
                  className={`vesh-chip ${
                    index === 0 ? "vesh-chip-active" : "bg-transparent text-[var(--vesh-paper-soft)]"
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </aside>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="vesh-kicker">Practitioner dashboard</div>
                <h1 className="vesh-heading mt-2 text-4xl">
                  Clinical skills matrix
                </h1>
              </div>
              <button onClick={() => setView("personas")} className="vesh-button vesh-button-green">
                Assign case
              </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric label="Students" value="42" detail="cohort 04" />
              <Metric label="Reviewed" value="68%" detail="this week" />
              <Metric label="Flags" value="7" detail="need attention" />
            </div>
            <div className="vesh-table mt-5 grid-cols-[1.1fr_0.8fr_0.8fr_1fr_1.2fr]">
              {["Learner", "Rapport", "Risk", "Case", "Note"].map((head) => (
                <div key={head} className="vesh-table-head">
                  {head}
                </div>
              ))}
              {scoreRows.flatMap((row, rowIndex) =>
                row.map((cell, cellIndex) => (
                  <div
                    key={`${rowIndex}-${cellIndex}`}
                    className={
                      cellIndex === 1 && rowIndex !== 3
                        ? "bg-[#c8f2d9]"
                        : cellIndex === 1
                        ? "bg-[#ffc6ba]"
                        : cellIndex === 2 && rowIndex === 0
                        ? "bg-[#fff0ad]"
                        : cellIndex === 2 && rowIndex > 1
                        ? "bg-[#c8f2d9]"
                        : ""
                    }
                  >
                    {cell}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {view === "personas" && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 gap-5 p-6 lg:grid-cols-[1fr_330px]">
          <div>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="vesh-kicker">Persona management</div>
                <h1 className="vesh-heading mt-2 text-4xl">Case file library</h1>
              </div>
              <button onClick={() => setShowUploadModal(true)} className="vesh-button">
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {personas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  selected={selectedPersona?.id === persona.id}
                  onStart={startSession}
                />
              ))}
            </div>
          </div>
          <aside>
            <div className="vesh-note vesh-note-green">
              <strong>Selected file</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                Case files show clinical context, difficulty, and the next
                learning move without becoming generic profile cards.
              </p>
            </div>
            <div className="vesh-card mt-4 p-4">
              <div className="vesh-kicker text-[var(--vesh-muted)]">Default set</div>
              <p className="mt-2 text-sm text-[var(--vesh-muted)]">
                Sarah, Marcus, and Elena stay ready for fast practice. Custom
                uploads appear in the same library.
              </p>
            </div>
          </aside>
        </section>
      )}

      {view === "session" && selectedOrFirst && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 md:grid-cols-[150px_1fr_320px] xl:grid-cols-[170px_1fr_360px]">
          <aside className="vesh-rail hidden p-4 md:grid md:content-start md:gap-3">
            <RailItem
              icon={FileText}
              label="Case"
              value={selectedOrFirst.name.split(" ")[0]}
            />
            <RailItem icon={Clock} label="Session" value="25 min" />
            <RailItem icon={Mic} label="Voice" value={voiceStatus} />
          </aside>
          <div className="grid grid-rows-[auto_1fr_auto] gap-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="vesh-kicker">Live session notebook</div>
                <h1 className="vesh-heading mt-2 text-4xl">
                  {selectedOrFirst.name} rehearsal
                </h1>
              </div>
              <button onClick={finishSession} className="vesh-button vesh-button-green">
                End session
              </button>
            </div>

            <div className="grid content-start gap-3 overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="vesh-card max-w-[620px] p-4 text-sm leading-relaxed">
                  <div className="vesh-kicker mb-2 text-[var(--vesh-muted)]">
                    Your first move
                  </div>
                  Start by greeting the client or naming what you notice. The
                  simulated client will respond after your first line.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`vesh-card max-w-[82%] p-3 text-sm leading-relaxed ${
                    message.role === "trainee"
                      ? "justify-self-end bg-[var(--vesh-green)] text-[var(--vesh-paper-soft)]"
                      : "justify-self-start"
                  }`}
                >
                  <div
                    className={`vesh-kicker mb-2 ${
                      message.role === "trainee"
                        ? "text-[#bff3db]"
                        : "text-[var(--vesh-muted)]"
                    }`}
                  >
                    {message.role === "trainee" ? "You" : "Client response"}
                  </div>
                  <div>{message.text}</div>
                </div>
              ))}
              {isLoading && (
                <div className="vesh-card max-w-[78%] p-3 text-sm">
                  <div className="vesh-kicker mb-2 text-[var(--vesh-muted)]">
                    Client response
                  </div>
                  Thinking through the case...
                </div>
              )}
            </div>

            <div className="vesh-card flex items-center gap-2 p-2">
              <MessageSquare className="ml-2 h-4 w-4 text-[var(--vesh-muted)]" />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendMessage();
                }}
                placeholder="Write or speak your next response..."
                className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--vesh-muted)]"
              />
              <button
                className={`vesh-chip ${isListening ? "vesh-chip-active" : ""}`}
                title={isListening ? "Stop listening" : "Start voice input"}
                type="button"
                onClick={toggleListening}
              >
                <Mic className="h-4 w-4" />
              </button>
              <button onClick={sendMessage} className="vesh-button" disabled={isLoading || isSpeaking}>
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
          <aside className="border-t-[1.5px] border-[var(--vesh-black)] bg-[rgba(15,61,50,0.06)] p-6 md:border-l-[1.5px] md:border-t-0">
            <div className="mb-4">
              <div className="vesh-kicker">Live supervisor</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-muted)]">
                Feedback on your latest trainee response.
              </p>
            </div>
            <CoachCard tone="good" eyebrow="What worked" title="Stay with the feeling">
              You noticed the client was guarded instead of forcing a quick
              assessment.
            </CoachCard>
            <div className="mt-3">
              <CoachCard tone="next" eyebrow="Next move" title="Make one clean follow-up">
                {feedback[0] ?? "Ask what safety would feel like in the body."}
              </CoachCard>
            </div>
            <div className="mt-3">
              <CoachCard tone="watch" eyebrow="Clinical watch" title="Avoid shallow check-ins">
                {feedback[1] ?? "Avoid advice before exploring shame."}
              </CoachCard>
            </div>
          </aside>
        </section>
      )}

      {view === "summary" && selectedOrFirst && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 gap-5 p-6 lg:grid-cols-[1fr_320px]">
          <main className="vesh-card vesh-paper min-h-[620px] p-6 lg:pl-24">
            <div className="vesh-kicker text-[var(--vesh-muted)]">Case review</div>
            <h1 className="vesh-heading mt-2 text-4xl">
              {selectedOrFirst.name} / {selectedOrFirst.condition}
            </h1>
            <p className="vesh-subheading mt-3">
              25 minute rehearsal completed with {messages.length} learner and
              client turns.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric label="Empathy" value="4.6" detail="strong" />
              <Metric label="Technique" value="4.1" detail="developing" />
              <Metric label="Risk" value="3.9" detail="contained" />
            </div>
            <div className="vesh-table mt-5 grid-cols-[1.1fr_1fr_1fr_1.4fr]">
              {["Moment", "Skill", "Score", "Faculty note"].map((head) => (
                <div key={head} className="vesh-table-head">
                  {head}
                </div>
              ))}
              {[
                ["Opening", "Validation", "Strong", "Accurately named pressure."],
                ["Middle", "Assessment", "Okay", "Asked two questions at once."],
                ["Closing", "Containment", "Good", "Clear next-step summary."],
              ].flatMap((row, rowIndex) =>
                row.map((cell, cellIndex) => (
                  <div
                    key={`${rowIndex}-${cellIndex}`}
                    className={cellIndex === 2 && rowIndex !== 1 ? "bg-[#c8f2d9]" : cellIndex === 2 ? "bg-[#fff0ad]" : ""}
                  >
                    {cell}
                  </div>
                ))
              )}
            </div>
          </main>
          <aside>
            <div className="vesh-note vesh-note-green">
              <strong>Keep practicing</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                Emotion reflection before problem solving.
              </p>
            </div>
            <div className="vesh-note mt-3">
              <strong>Next assignment</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                Repeat the same case with a stricter time limit.
              </p>
            </div>
            <button onClick={() => setView("student")} className="vesh-button mt-5 w-full">
              <CheckCircle className="h-4 w-4" />
              Save report
            </button>
          </aside>
        </section>
      )}

      <PersonaUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={(persona) => {
          setSelectedPersona(persona);
          setShowUploadModal(false);
        }}
        userId={user?.id}
      />
    </main>
  );
}
