"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  FileText,
  LogOut,
  MessageSquare,
  Mic,
  Send,
  Target,
  Upload,
} from "lucide-react";
import { PersonaUploadModal } from "./PersonaUploadModal";
import NotebookHero from "./NotebookHero";
import {
  analyzeClinicalSession,
  summarizeClinicalHistory,
  type CompletedClinicalSession,
} from "@/lib/clinical-metrics";
import { convexFunctions } from "@/lib/convex/functions";
import { defaultPersonas, type PersonaData } from "@/lib/personas/default-personas";
import { elevenLabsService } from "@/lib/services/elevenlabs-service";

type View =
  | "home"
  | "student"
  | "practitioner"
  | "personas"
  | "briefing"
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

const sessionDurations = [10, 25, 45] as const;
type SessionDuration = (typeof sessionDurations)[number];
type SessionEndReason = "manual" | "time";

function formatTimeRemaining(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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
    <>
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
              <span>Out</span>
            </button>
          ) : (
            <button onClick={() => onNavigate("student")} className="vesh-button">
              Start free
            </button>
          )}
        </div>
      </header>
      {signedIn && (
        <nav className="vesh-mobile-nav md:hidden">
          <button
            onClick={() => onNavigate("student")}
            className={`vesh-chip flex-1 ${view === "student" ? "vesh-chip-active" : ""}`}
          >
            Journal
          </button>
          <button
            onClick={() => onNavigate("personas")}
            className={`vesh-chip flex-1 ${view === "personas" ? "vesh-chip-active" : ""}`}
          >
            Personas
          </button>
          <button
            onClick={() => onNavigate("practitioner")}
            className={`vesh-chip flex-1 ${view === "practitioner" ? "vesh-chip-active" : ""}`}
          >
            Programs
          </button>
        </nav>
      )}
    </>
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
        className={`mt-2 break-words font-black uppercase leading-none tracking-[0] ${
          compact
            ? "whitespace-nowrap text-[clamp(1.35rem,1.35vw,1.55rem)]"
            : "text-[clamp(1.7rem,9vw,2.25rem)] sm:text-4xl"
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
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice ready");
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(25);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(sessionDuration * 60);
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const sessionId = useRef(`session-${Date.now()}`);
  const savedSessionKeys = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const convexPersonas = useQuery(convexFunctions.personas.listForUser, {
    ownerClerkId: user?.id,
  });
  const completedSessions = useQuery(
    convexFunctions.chatSessions.listCompletedForUser,
    user?.id ? { ownerClerkId: user.id } : "skip"
  );
  const saveCompletedSession = useMutation(convexFunctions.chatSessions.saveCompleted);

  const personas = useMemo(
    () => ((convexPersonas as PersonaData[] | undefined) ?? defaultPersonas),
    [convexPersonas]
  );

  const currentUserType =
    (user?.publicMetadata?.userType as "student" | "practitioner" | undefined) ??
    "student";

  const signedIn = !!user && isLoaded;
  const timeRemainingLabel =
    remainingSeconds > 0 ? formatTimeRemaining(remainingSeconds) : "Time up";
  const selectedOrFirst = selectedPersona ?? personas[0];
  const sessionAnalysis = useMemo(() => analyzeClinicalSession(messages), [messages]);
  const clinicalDashboard = useMemo(
    () => summarizeClinicalHistory((completedSessions ?? []) as CompletedClinicalSession[]),
    [completedSessions]
  );
  const needsReviewCount = ((completedSessions ?? []) as CompletedClinicalSession[]).filter(
    (session) => {
      const scores = session.scores ?? {};
      return (
        (typeof scores.alliance === "number" && scores.alliance < 3) ||
        (typeof scores.empathicAccuracy === "number" && scores.empathicAccuracy < 3) ||
        (typeof scores.riskScreen === "number" && scores.riskScreen < 5)
      );
    }
  ).length;
  const completionLabel =
    sessionEndReason === "time" ? "Time limit reached" : "Ended by learner";

  useEffect(() => {
    if (view !== "session" || !sessionStartedAt) return;

    const updateRemaining = () => {
      const elapsedSeconds = Math.floor((Date.now() - sessionStartedAt) / 1000);
      setRemainingSeconds(Math.max(0, sessionDuration * 60 - elapsedSeconds));
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [sessionDuration, sessionStartedAt, view]);

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

  const startSession = (persona: PersonaData) => {
    if (!signedIn) {
      router.push("/sign-up?userType=student");
      return;
    }

    stopVoice();
    stopListening();
    setSelectedPersona(persona);
    setMessages([]);
    setInput("");
    setSessionStartedAt(null);
    setRemainingSeconds(sessionDuration * 60);
    setSessionEndReason(null);
    setVoiceStatus("Voice ready");
    setView("briefing");
  };

  const beginSession = async () => {
    if (!selectedOrFirst) return;

    stopVoice();
    stopListening();
    sessionId.current = `session-${Date.now()}`;
    const startedAt = Date.now();
    setSessionStartedAt(startedAt);
    setRemainingSeconds(sessionDuration * 60);
    setSessionEndReason(null);
    setMessages([]);
    setInput("");
    setVoiceStatus("Voice ready");
    setView("session");

    await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId.current,
      },
      body: JSON.stringify({ type: "set_persona", persona: selectedOrFirst.id }),
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

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "client", text: replyText },
      ]);
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
      void speakText(fallbackReply, selectedOrFirst);
    } finally {
      setIsLoading(false);
    }
  };

  const persistCompletedSession = async () => {
    if (!user?.id || !selectedOrFirst || savedSessionKeys.current.has(sessionId.current)) {
      return;
    }

    savedSessionKeys.current.add(sessionId.current);

    await saveCompletedSession({
      ownerClerkId: user.id,
      personaId: selectedOrFirst.id,
      personaName: selectedOrFirst.name,
      duration: sessionDuration,
      totalMessages: messages.length,
      scores: sessionAnalysis.scores,
      messages,
    }).catch((error) => {
      savedSessionKeys.current.delete(sessionId.current);
      console.error("Could not save completed session", error);
    });
  };

  const finishSession = (reason: SessionEndReason = "manual") => {
    stopVoice();
    stopListening();
    if (reason === "time") {
      setRemainingSeconds(0);
    }
    setSessionEndReason(reason);
    void persistCompletedSession();
    setView("summary");
  };

  useEffect(() => {
    if (view === "session" && sessionStartedAt && remainingSeconds === 0) {
      finishSession("time");
    }
  }, [remainingSeconds, sessionStartedAt, view]);

  const downloadReportPdf = async () => {
    if (!selectedOrFirst) return;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const lineHeight = 7;
      let y = 20;

      const addText = (text: string, size = 11, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, 174) as string[];
        lines.forEach((line) => {
          if (y > pageHeight - 18) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      };

      const addSection = (title: string) => {
        y += 4;
        doc.setDrawColor(17, 17, 15);
        doc.line(margin, y, 192, y);
        y += 9;
        addText(title, 13, true);
      };

      const safeName = selectedOrFirst.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const generatedDate = new Date();
      const learnerTurns = messages.filter((message) => message.role === "trainee").length;
      const clientTurns = messages.filter((message) => message.role === "client").length;

      doc.setTextColor(17, 17, 15);
      addText("Vesh Session Report", 20, true);
      addText(`${selectedOrFirst.name} / ${selectedOrFirst.condition}`, 14, true);
      addText(`Generated ${generatedDate.toLocaleString()}`);
      addText(`Status: ${completionLabel}`);
      addText(`Session length: ${sessionDuration} minutes`);
      addText(`Transcript: ${learnerTurns} trainee turns, ${clientTurns} client turns`);

      addSection("Case Focus");
      addText(`Training objective: ${selectedOrFirst.background.sessionGoals[0]}`);
      addText(`Primary watch point: ${selectedOrFirst.background.therapeuticConsiderations[0]}`);

      addSection("Scores");
      sessionAnalysis.metrics.forEach((item) => {
        addText(`${item.label}: ${item.display} (${item.detail})`);
      });

      addSection("Coach Notes");
      sessionAnalysis.suggestions.forEach((item, index) => {
        addText(`${index + 1}. ${item.title}: ${item.body}`);
      });

      addSection("Transcript");
      if (messages.length === 0) {
        addText("No trainee-client turns were recorded in this session.");
      } else {
        messages.forEach((message) => {
          const speaker = message.role === "trainee" ? "Trainee" : selectedOrFirst.name;
          addText(`${speaker}: ${message.text}`);
          y += 2;
        });
      }

      doc.save(`vesh-session-${safeName}-${generatedDate.toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("PDF export failed", error);
      window.alert("Could not create the PDF report. Please try again.");
    }
  };

  return (
    <main className="vesh-shell min-h-screen">
      <Topbar
        view={view}
        onNavigate={navigate}
        onSignOut={handleSignOut}
        signedIn={signedIn}
      />

      {view === "home" && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(320px,0.75fr)_minmax(560px,1.25fr)] lg:items-center lg:gap-8 lg:p-10">
          <div>
            <h1 className="vesh-heading max-w-3xl">
              Clinical practice that finally feels{" "}
              <span className="inline-block bg-[var(--vesh-black)] px-2 pb-1 text-[var(--vesh-paper-soft)] sm:px-3 sm:pb-2">
                alive.
              </span>
            </h1>
            <p className="vesh-subheading mt-5 max-w-xl">
              AI clients, live supervision cues, and review-ready session notes
              for therapy students who need reps before real stakes.
            </p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
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
                Preview case
              </button>
            </div>
          </div>

          <NotebookHero
            onStartRehearsal={() =>
              signedIn
                ? setView(currentUserType === "practitioner" ? "practitioner" : "student")
                : router.push("/sign-up?userType=student")
            }
          />
        </section>
      )}

      {view === "student" && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 md:grid-cols-[1fr_300px]">
          <div className="p-4 sm:p-6">
            <div className="vesh-kicker">Training journal</div>
            <h1 className="vesh-heading mt-2">Practice journal</h1>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric
                label="Completed cases"
                value={String(clinicalDashboard.completedSessions)}
                detail="saved reports"
              />
              <Metric
                label="Alliance mean"
                value={clinicalDashboard.allianceMeanDisplay}
                detail="working alliance"
              />
              <Metric
                label="Practice focus"
                value={clinicalDashboard.practiceFocus}
                detail="lowest scored skill"
              />
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
          <aside className="border-t-[1.5px] border-[var(--vesh-black)] bg-[rgba(15,61,50,0.06)] p-4 sm:p-6 md:border-l-[1.5px] md:border-t-0">
            <div className="vesh-note">
              <strong>{clinicalDashboard.practiceFocus}</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                {clinicalDashboard.completedSessions > 0
                  ? "Your next practice target is based on your lowest average clinical skill score."
                  : "Complete a session to unlock trend-based coaching."}
              </p>
            </div>
            {clinicalDashboard.latestRows.length > 0 ? (
              <div className="mt-5 h-20 grid-cols-[repeat(12,1fr)] items-end gap-1 grid">
                {((completedSessions ?? []) as CompletedClinicalSession[]).slice(0, 12).map((session) => {
                  const alliance =
                    typeof session.scores?.alliance === "number" ? session.scores.alliance : 1;
                  return (
                    <span
                      key={`${session.createdAt}-${session.personaName}`}
                      className="block min-h-2 border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-green-bright)]"
                      style={{ height: Math.max(12, alliance * 14) }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="vesh-card mt-5 p-4 text-sm text-[var(--vesh-muted)]">
                No completed reports yet.
              </div>
            )}
          </aside>
        </section>
      )}

      {view === "practitioner" && (
        <section className="vesh-program-shell min-h-[calc(100vh-58px)] p-4 sm:p-6 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="vesh-kicker text-[var(--vesh-muted)]">
                Cohort performance
              </div>
              <h1 className="vesh-heading mt-2">
                Program outcomes
              </h1>
              <p className="vesh-subheading mt-3 max-w-2xl">
                Review completed sessions, spot low-skill patterns, and assign
                the next case from the same workspace.
              </p>
            </div>
            <button onClick={() => setView("personas")} className="vesh-button vesh-button-green">
              Assign case
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_320px]">
            <div>
              <div className="grid gap-3 md:grid-cols-3">
                <Metric
                  label="Reviewed sessions"
                  value={String(clinicalDashboard.completedSessions)}
                  detail="completed reports"
                />
                <Metric
                  label="Alliance mean"
                  value={clinicalDashboard.allianceMeanDisplay}
                  detail="bond/tasks/goals"
                />
                <Metric
                  label="Needs review"
                  value={String(needsReviewCount)}
                  detail="risk or low skill score"
                />
              </div>

              <div className="vesh-card mt-5 overflow-hidden">
                <div className="border-b-[1.5px] border-[var(--vesh-black)] p-4">
                  <div className="vesh-kicker text-[var(--vesh-muted)]">
                    Clinical skills matrix
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="vesh-table vesh-program-table min-w-[620px] grid-cols-[1.1fr_0.8fr_0.8fr_1fr_1.2fr]">
                    {["Case", "Alliance", "Empathy", "Turns", "Date"].map((head) => (
                      <div key={head} className="vesh-table-head">
                        {head}
                      </div>
                    ))}
                    {(clinicalDashboard.latestRows.length > 0
                      ? clinicalDashboard.latestRows
                      : [["No completed sessions", "No data", "No data", "0 turns", ""]]
                    ).flatMap((row, rowIndex) =>
                      row.map((cell, cellIndex) => (
                        <div
                          key={`${rowIndex}-${cellIndex}`}
                          className={
                            cellIndex === 1 && rowIndex !== clinicalDashboard.latestRows.length
                              ? "bg-[#c8f2d9]"
                              : cellIndex === 1
                                ? "bg-[#fff0ad]"
                                : cellIndex === 2 && rowIndex !== clinicalDashboard.latestRows.length
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
              </div>
            </div>

            <aside className="grid content-start gap-4">
              <div className="vesh-note vesh-note-green">
                <strong>{clinicalDashboard.practiceFocus}</strong>
                <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-ink)]">
                  {clinicalDashboard.completedSessions > 0
                    ? "Next assignment should target the lowest average score across recent completed sessions."
                    : "Completed sessions will turn this panel into a live coaching priority."}
                </p>
              </div>
              <div className="vesh-card p-4">
                <div className="vesh-kicker text-[var(--vesh-muted)]">
                  Active signal
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--vesh-muted)]">
                  Alliance, empathy, risk screening, and turn quality are pulled
                  from saved rehearsal reports instead of static demo values.
                </p>
              </div>
            </aside>
          </div>
        </section>
      )}

      {view === "personas" && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_330px]">
          <div>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="vesh-kicker">Case library</div>
                <h1 className="vesh-heading mt-2">Case file library</h1>
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
              <strong>Case context</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                Case files show clinical context, difficulty, and the next
                learning move without becoming generic profile cards.
              </p>
            </div>
              <div className="vesh-card mt-4 p-4">
              <div className="vesh-kicker text-[var(--vesh-muted)]">Built-in cases</div>
              <p className="mt-2 text-sm text-[var(--vesh-muted)]">
                Sarah, Marcus, and Elena stay ready for fast practice. Custom
                uploads appear in the same library.
              </p>
            </div>
          </aside>
        </section>
      )}

      {view === "briefing" && selectedOrFirst && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_360px]">
          <main className="vesh-card vesh-paper p-4 sm:p-6 lg:p-8">
            <div className="vesh-kicker text-[var(--vesh-muted)]">Pre-session briefing</div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="vesh-heading">
                  {selectedOrFirst.name}
                </h1>
                <p className="vesh-subheading mt-3 max-w-2xl">
                  {selectedOrFirst.age}, {selectedOrFirst.occupation}.{" "}
                  {selectedOrFirst.description}
                </p>
              </div>
              <span className={`vesh-chip ${difficultyClass(selectedOrFirst.difficulty)}`}>
                {selectedOrFirst.difficulty}
              </span>
            </div>

            <div className="my-6 h-[1.5px] bg-[var(--vesh-black)]" />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="vesh-note vesh-note-green">
                <strong>Training objective</strong>
                <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-ink)]">
                  {selectedOrFirst.background.sessionGoals[0]} while keeping the
                  opening grounded, collaborative, and clinically paced.
                </p>
              </div>
              <div className="vesh-note">
                <strong>Encounter frame</strong>
                <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-ink)]">
                  Early-session practice. The client may be guarded at first and
                  should open up gradually as rapport improves.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="vesh-card p-4">
                <div className="vesh-kicker text-[var(--vesh-muted)]">Background</div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--vesh-muted)]">
                  {selectedOrFirst.background.demographics.slice(1).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="vesh-card p-4">
                <div className="vesh-kicker text-[var(--vesh-muted)]">Presenting concerns</div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--vesh-muted)]">
                  {selectedOrFirst.background.presentingConcerns.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="vesh-card p-4">
                <div className="vesh-kicker text-[var(--vesh-muted)]">Clinical notes</div>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--vesh-muted)]">
                  {selectedOrFirst.background.clinicalNotes.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </main>

          <aside className="grid content-start gap-4">
            <div className="vesh-card p-4">
              <div className="vesh-kicker text-[var(--vesh-muted)]">Session length</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {sessionDurations.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setSessionDuration(duration)}
                    className={`vesh-chip min-h-12 ${
                      sessionDuration === duration ? "vesh-chip-active" : ""
                    }`}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>
            <div className="vesh-note vesh-note-red">
              <strong>Watch for</strong>
              <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-ink)]">
                {selectedOrFirst.background.therapeuticConsiderations[0]}
              </p>
            </div>
            <button onClick={() => void beginSession()} className="vesh-button w-full">
              Begin session
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => setView("personas")} className="vesh-button vesh-button-yellow w-full">
              Choose another case
            </button>
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
            <RailItem icon={Clock} label="Session" value={`${sessionDuration} min`} />
            <RailItem icon={Clock} label="Time left" value={timeRemainingLabel} />
            <RailItem icon={Mic} label="Voice" value={voiceStatus} />
          </aside>
          <div className="grid min-h-[calc(100vh-58px)] grid-rows-[auto_minmax(280px,1fr)_auto] gap-4 p-4 sm:p-6 md:min-h-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="vesh-kicker">Live session notebook</div>
                <h1 className="vesh-heading mt-2">
                  {selectedOrFirst.name} rehearsal
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`vesh-chip min-h-10 ${remainingSeconds === 0 ? "bg-[var(--vesh-coral)] text-[var(--vesh-paper-soft)]" : "vesh-chip-active"}`}>
                  Time left {timeRemainingLabel}
                </span>
                <button
                  onClick={() => finishSession("manual")}
                  className="vesh-button vesh-button-green"
                >
                  End session
                </button>
              </div>
            </div>

            <div className="grid content-start gap-3 overflow-y-auto pr-1 sm:pr-2">
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
                  className={`vesh-card max-w-[92%] p-3 text-sm leading-relaxed sm:max-w-[82%] ${
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

            <div className="vesh-card flex flex-wrap items-center gap-2 p-2 sm:flex-nowrap">
              <MessageSquare className="ml-1 hidden h-4 w-4 text-[var(--vesh-muted)] sm:block" />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendMessage();
                }}
                placeholder="Write or speak your next response..."
                className="vesh-session-input min-w-[180px] flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-[var(--vesh-muted)]"
              />
              <button
                className={`vesh-chip min-h-10 px-3 ${isListening ? "vesh-chip-active" : ""}`}
                title={isListening ? "Stop listening" : "Start voice input"}
                type="button"
                onClick={toggleListening}
              >
                <Mic className="h-4 w-4" />
              </button>
              <button onClick={sendMessage} className="vesh-button min-h-10 flex-1 sm:flex-none" disabled={isLoading || isSpeaking}>
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
          <aside className="border-t-[1.5px] border-[var(--vesh-black)] bg-[rgba(15,61,50,0.06)] p-4 sm:p-6 md:border-l-[1.5px] md:border-t-0">
            <div className="mb-4">
              <div className="vesh-kicker">Live supervisor</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-muted)]">
                Feedback on your latest trainee response.
              </p>
            </div>
            <CoachCard
              tone={sessionAnalysis.suggestions[0].tone}
              eyebrow="What worked"
              title={sessionAnalysis.suggestions[0].title}
            >
              {sessionAnalysis.suggestions[0].body}
            </CoachCard>
            <div className="mt-3">
              <CoachCard
                tone={sessionAnalysis.suggestions[1].tone}
                eyebrow="Next move"
                title={sessionAnalysis.suggestions[1].title}
              >
                {sessionAnalysis.suggestions[1].body}
              </CoachCard>
            </div>
            <div className="mt-3">
              <CoachCard
                tone={sessionAnalysis.suggestions[2].tone}
                eyebrow="Clinical watch"
                title={sessionAnalysis.suggestions[2].title}
              >
                {sessionAnalysis.suggestions[2].body}
              </CoachCard>
            </div>
          </aside>
        </section>
      )}

      {view === "summary" && selectedOrFirst && (
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_320px]">
          <main className="vesh-card vesh-paper min-h-[520px] p-4 sm:p-6 lg:min-h-[620px] lg:pl-24">
            <div className="vesh-kicker text-[var(--vesh-muted)]">Case review</div>
            <h1 className="vesh-heading mt-2">
              {selectedOrFirst.name} / {selectedOrFirst.condition}
            </h1>
            <p className="vesh-subheading mt-3">
              {sessionDuration} minute rehearsal completed with {messages.length} learner and
              client turns.
            </p>
            <div className="mt-4 inline-flex border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-yellow)] px-3 py-2 text-xs font-black uppercase">
              {completionLabel}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {sessionAnalysis.metrics.map((item) => (
                <Metric
                  key={item.key}
                  label={item.label}
                  value={item.display}
                  detail={item.detail}
                />
              ))}
            </div>
            <div className="mt-5 overflow-x-auto">
              <div className="vesh-table min-w-[680px] grid-cols-[1.1fr_1fr_1fr_1.4fr]">
                {["Domain", "Rating", "Score", "Faculty note"].map((head) => (
                  <div key={head} className="vesh-table-head">
                    {head}
                  </div>
                ))}
                {sessionAnalysis.facultyRows.flatMap((row, rowIndex) =>
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
            </div>
          </main>
          <aside>
            <div className="vesh-note vesh-note-green">
              <strong>{sessionAnalysis.suggestions[1].title}</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                {sessionAnalysis.suggestions[1].body}
              </p>
            </div>
            <div className="vesh-note mt-3">
              <strong>{sessionAnalysis.suggestions[2].title}</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                {sessionAnalysis.suggestions[2].body}
              </p>
            </div>
            <button
              onClick={() => void downloadReportPdf()}
              className="vesh-button mt-5 w-full"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={() => setView("student")}
              className="vesh-button vesh-button-yellow mt-3 w-full"
            >
              <CheckCircle className="h-4 w-4" />
              Back to journal
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
