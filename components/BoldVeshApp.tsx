"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Home,
  Lock,
  LogOut,
  MessageSquare,
  Mic,
  Send,
  ShieldCheck,
  Star,
  Target,
  Upload,
  UserRound,
  Users,
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

const studentSignUpPath = "/sign-up?userType=student";
const demoSignUpPath = "/sign-up?userType=student&intent=demo";

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

function HomeMasthead() {
  return (
    <header className="border-b-[1.5px] border-[var(--vesh-black)] bg-[rgba(251,241,220,0.94)] px-4 py-3 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
        <div
          aria-label="AI THERAPY TRAINING FOR THERAPY STUDENTS"
          className="font-mono text-[11px] font-black uppercase leading-[1.08] tracking-[0.16em] text-[var(--vesh-black)] sm:text-[13px]"
        >
          AI therapy training
          <br />
          for therapy students
        </div>
        <p className="relative hidden font-mono text-sm font-black uppercase italic tracking-[0.05em] text-[var(--vesh-black)] md:block lg:text-base">
          PRACTICE MORE. GET BETTER. HELP MORE.
          <span className="absolute -bottom-2 left-0 h-[3px] w-full bg-[var(--vesh-coral)]" />
        </p>
      </div>
    </header>
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
            <button onClick={onSignOut} className="vesh-button vesh-button-green whitespace-nowrap px-3 text-xs sm:px-4 sm:text-sm">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
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

function ChecklistItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-soft)]" />
      <div>
        <div className="text-sm font-black leading-tight">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--vesh-muted)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

function DashboardRailIcon({
  icon: Icon,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <span
      className={`grid h-10 w-10 place-items-center border-l-[3px] ${
        active
          ? "border-[var(--vesh-coral)] bg-[var(--vesh-paper-hot)]"
          : "border-transparent"
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function FirstRunStudentDashboard({
  persona,
  onStart,
  onSampleReport,
}: {
  persona: PersonaData;
  onStart: (persona: PersonaData) => void;
  onSampleReport: (persona: PersonaData) => void;
}) {
  return (
    <section className="grid min-h-screen grid-cols-1 md:grid-cols-[64px_1fr] xl:grid-cols-[64px_1fr_260px]">
      <aside className="hidden border-r-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-soft)] py-3 md:grid md:content-start md:justify-items-center md:gap-3">
        <span className="vesh-mark">V</span>
        <DashboardRailIcon icon={Home} active />
        <DashboardRailIcon icon={MessageSquare} />
        <DashboardRailIcon icon={ClipboardList} />
        <DashboardRailIcon icon={BarChart3} />
        <DashboardRailIcon icon={UserRound} />
      </aside>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-black leading-none tracking-[0]">
              Welcome to Vesh, future therapist
            </h1>
            <p className="mt-3 text-sm text-[var(--vesh-muted)]">
              Let's run your first practice session.
            </p>
          </div>
          <span className="vesh-chip">No sessions yet</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_0.86fr_1.42fr]">
          <article className="vesh-card p-4">
            <div className="vesh-kicker text-[var(--vesh-muted)]">
              Recommended first case
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[116px_1fr]">
              <div className="grid aspect-square place-items-center border-[1.5px] border-[var(--vesh-black)] bg-[var(--vesh-paper-hot)] shadow-[4px_4px_0_rgba(17,17,15,0.14)]">
                <UserRound className="h-16 w-16 stroke-[1.5]" />
              </div>
              <div>
                <h2 className="text-xl font-black leading-none">{persona.name}</h2>
                <p className="mt-1 text-xs font-black uppercase text-[var(--vesh-muted)]">
                  Anxiety Intake
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="vesh-chip px-2 py-1 text-[10px]">New client</span>
                  <span className="vesh-chip px-2 py-1 text-[10px]">Anxiety</span>
                  <span className="vesh-chip px-2 py-1 text-[10px]">College student</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[var(--vesh-muted)]">
                  Sarah is a 21-year-old student experiencing academic stress,
                  overthinking, and sleep difficulties.
                </p>
              </div>
            </div>
            <button onClick={() => onStart(persona)} className="vesh-button mt-4 w-full">
              Start this case
            </button>
            <span className="sr-only">Start Sarah's anxiety intake</span>
            <span className="sr-only">First practice plan</span>
            <span className="sr-only">
              Your reports will appear here after each completed rehearsal.
            </span>
          </article>

          <article className="vesh-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="vesh-kicker text-[var(--vesh-muted)]">
                Practice checklist
              </div>
              <span className="font-mono text-xs font-black">0 / 4</span>
            </div>
            <div className="grid gap-4">
              <ChecklistItem
                title="Run your first rehearsal"
                detail="Try a full session from start to finish"
              />
              <ChecklistItem
                title="Complete and review your report"
                detail="See your clinical feedback"
              />
              <ChecklistItem
                title="Explore suggested next moves"
                detail="Practice different response options"
              />
              <ChecklistItem
                title="Save your session to your journal"
                detail="Track your progress"
              />
            </div>
            <div className="vesh-note mt-5 p-3">
              <div className="flex gap-2">
                <Star className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-relaxed">
                  <strong>Tip:</strong> Focus on building connection first.
                  Solutions come after understanding.
                </p>
              </div>
            </div>
            <span className="sr-only">How progress works</span>
          </article>

          <article className="vesh-card grid gap-4 p-4 lg:grid-cols-[1fr_180px]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="vesh-kicker text-[var(--vesh-muted)]">
                  Your progress
                </div>
                <span className="text-xs text-[var(--vesh-muted)]">
                  No sessions yet
                </span>
              </div>
              <div className="vesh-card bg-[var(--vesh-paper-soft)] p-4 shadow-none">
                <div className="vesh-kicker text-[var(--vesh-muted)]">
                  Report preview
                </div>
                <p className="mt-2 text-xs text-[var(--vesh-muted)]">
                  Here's what your report will include.
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                  {[
                    ["Alliance", "4.1 / 5"],
                    ["Reflection", "1.2 : 1"],
                    ["Questions", "Good"],
                    ["Risk", "Clear"],
                  ].map(([label, value]) => (
                    <div key={label} className="border-l-[1.5px] border-[var(--vesh-black)] pl-2">
                      <div className="text-[10px] font-black uppercase text-[var(--vesh-muted)]">
                        {label}
                      </div>
                      <div className="mt-2 font-black text-[var(--vesh-green)]">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 text-xs text-[var(--vesh-muted)]">
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-[var(--vesh-green)]" />
                    Strengths and growth areas
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-[var(--vesh-green)]" />
                    Personalized coaching suggestions
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-[var(--vesh-green)]" />
                    Evidence-aligned rubric breakdown
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-4 w-4 text-[var(--vesh-green)]" />
                    Session summary and next steps
                  </div>
                </div>
              </div>
            </div>
            <div className="grid content-between gap-3">
              <div className="vesh-card bg-[var(--vesh-paper-soft)] p-4 shadow-[4px_4px_0_rgba(17,17,15,0.14)]">
                <div className="text-xl font-black uppercase leading-none">Vesh</div>
                <div className="mt-4 text-[10px] font-black uppercase">
                  Session report
                </div>
                <div className="mt-1 text-[10px]">Sarah Chen - Anxiety Intake</div>
                <div className="mt-4 space-y-2">
                  <span className="block h-1.5 bg-[rgba(17,17,15,0.18)]" />
                  <span className="block h-1.5 bg-[rgba(17,17,15,0.18)]" />
                  <span className="block h-1.5 bg-[rgba(17,17,15,0.18)]" />
                  <span className="block h-1.5 w-3/4 bg-[rgba(17,17,15,0.18)]" />
                </div>
                <div className="mt-5 flex h-14 items-end gap-2 border-[1.5px] border-[var(--vesh-black)] p-2">
                  {[18, 28, 22, 34, 20, 40].map((height, index) => (
                    <span
                      key={index}
                      className={`w-4 border-[1.5px] border-[var(--vesh-black)] ${
                        index === 5 ? "bg-[var(--vesh-black)]" : "bg-[rgba(17,17,15,0.2)]"
                      }`}
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSampleReport(persona)}
                className="vesh-button vesh-button-yellow w-full"
              >
                See full sample report
              </button>
            </div>
          </article>
        </div>

        <div className="vesh-note vesh-note-green mt-4 lg:hidden">
          <strong>Build the relationship before you solve.</strong>
          <p className="mt-2 text-sm leading-relaxed text-[var(--vesh-ink)]">
            Connection is the foundation of effective therapy.
          </p>
        </div>
      </div>

      <aside className="hidden border-l-[1.5px] border-[var(--vesh-black)] bg-[rgba(255,224,95,0.16)] p-6 xl:block">
        <div className="vesh-note sticky top-24">
          <div className="vesh-kicker text-[var(--vesh-muted)]">Coach tip</div>
          <strong className="mt-5 block text-2xl leading-tight">
            Build the relationship before you solve.
          </strong>
          <p className="mt-6 text-sm leading-relaxed text-[var(--vesh-ink)]">
            Connection is the foundation of effective therapy.
          </p>
        </div>
      </aside>
    </section>
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
  const homeDemoRef = useRef<HTMLDivElement | null>(null);

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
  const recommendedFirstCase =
    personas.find((persona) => persona.name === "Sarah Chen") ?? selectedOrFirst;
  const completedSessionList = useMemo(
    () => ((completedSessions ?? []) as CompletedClinicalSession[]),
    [completedSessions]
  );
  const completedSessionsLoaded = !user?.id || completedSessions !== undefined;
  const sessionAnalysis = useMemo(() => analyzeClinicalSession(messages), [messages]);
  const clinicalDashboard = useMemo(
    () => summarizeClinicalHistory(completedSessionList),
    [completedSessionList]
  );
  const showFirstRunStudent =
    completedSessionsLoaded && clinicalDashboard.completedSessions === 0;
  const firstRunStudentVisible =
    view === "student" && showFirstRunStudent && completedSessionsLoaded;
  const needsReviewCount = completedSessionList.filter(
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

  const openWorkspaceAfterAuth = useCallback(
    (redirectedUserType?: string | null) => {
      const targetUserType =
        redirectedUserType === "student" || redirectedUserType === "practitioner"
          ? redirectedUserType
          : currentUserType;

      setView(targetUserType === "practitioner" ? "practitioner" : "student");
    },
    [currentUserType]
  );

  useEffect(() => {
    if (!user || !isLoaded || typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const authRedirect = urlParams.get("auth") === "1";
    const userTypeSet = urlParams.get("userTypeSet") === "true";

    if (!authRedirect && !userTypeSet) return;

    const redirectedUserType = urlParams.get("userType");
    const openAndCleanUrl = () => {
      openWorkspaceAfterAuth(redirectedUserType);
      window.history.replaceState({}, "", window.location.pathname);
    };

    if (userTypeSet) {
      user.reload().then(openAndCleanUrl).catch(() => openAndCleanUrl());
      return;
    }

    openAndCleanUrl();
  }, [isLoaded, openWorkspaceAfterAuth, user]);

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
      router.push(studentSignUpPath);
      return;
    }
    setView(target);
  };

  const focusHomeDemo = () => {
    homeDemoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const openSampleReport = (persona: PersonaData) => {
    setSelectedPersona(persona);
    setSessionEndReason("manual");
    setMessages([
      {
        id: "sample-client-1",
        role: "client",
        text: "I'm not really sure what I'm supposed to say. I keep worrying I'll mess this up somehow.",
      },
      {
        id: "sample-trainee-1",
        role: "trainee",
        text: "It sounds like there is a lot of pressure to get therapy right before you even know what to expect.",
      },
      {
        id: "sample-client-2",
        role: "client",
        text: "Exactly. I just want it to stop, but I also feel embarrassed that I need help.",
      },
      {
        id: "sample-trainee-2",
        role: "trainee",
        text: "Part of you wants relief, and another part worries what needing help says about you.",
      },
    ]);
    setView("summary");
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
      router.push(studentSignUpPath);
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
      {view === "home" ? (
        <HomeMasthead />
      ) : firstRunStudentVisible ? (
        null
      ) : (
        <Topbar
          view={view}
          onNavigate={navigate}
          onSignOut={handleSignOut}
          signedIn={signedIn}
        />
      )}

      {view === "home" && (
        <section className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px]">
            <div className="vesh-card overflow-hidden bg-[var(--vesh-paper-soft)] shadow-[10px_10px_0_rgba(17,17,15,0.2)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-[var(--vesh-black)] px-4 py-3 sm:px-5">
                <Brand />
                <nav className="hidden items-center gap-6 text-xs font-black md:flex">
                  <button className="border-b-[2px] border-[var(--vesh-coral)]">
                    How it works
                  </button>
                  <button>For schools</button>
                  <button>Pricing</button>
                  <button>Resources</button>
                </nav>
                <div className="hidden items-center gap-3 sm:flex">
                  <a
                    href="/sign-in"
                    className="vesh-button bg-[var(--vesh-paper-soft)] px-5 py-2 text-xs text-[var(--vesh-black)]"
                  >
                    Log in
                  </a>
                  {signedIn ? (
                    <button
                      type="button"
                      onClick={() => openWorkspaceAfterAuth()}
                      className="vesh-button vesh-button-green px-5 py-2 text-xs"
                    >
                      Start practicing
                    </button>
                  ) : (
                    <a
                      href={studentSignUpPath}
                      className="vesh-button vesh-button-green px-5 py-2 text-xs"
                    >
                      Start practicing
                    </a>
                  )}
                </div>
                {signedIn ? (
                  <button
                    type="button"
                    onClick={() => openWorkspaceAfterAuth()}
                    className="vesh-button vesh-button-green px-4 py-2 text-xs sm:hidden"
                  >
                    Start
                  </button>
                ) : (
                  <a
                    href={studentSignUpPath}
                    className="vesh-button vesh-button-green px-4 py-2 text-xs sm:hidden"
                  >
                    Start
                  </a>
                )}
              </div>

              <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:p-8 xl:p-10">
                <div>
                  <div className="vesh-kicker text-[var(--vesh-coral-dark)]">
                    AI therapy training
                  </div>
                  <h1
                    className="mt-5 max-w-[760px] text-[clamp(2.45rem,6.2vw,5rem)] font-black uppercase leading-[0.92] tracking-[0]"
                    aria-label="REALISTIC PRACTICE. CLINICAL FEEDBACK. REAL GROWTH."
                  >
                    <span className="block">REALISTIC PRACTICE.</span>
                    <span className="block">CLINICAL FEEDBACK.</span>
                    <span className="block" aria-label="REAL GROWTH.">
                      REAL{" "}
                      <span className="inline-block bg-[var(--vesh-coral)] px-2 text-[var(--vesh-paper-soft)]">
                        GROWTH.
                      </span>
                    </span>
                  </h1>
                  <p className="mt-5 max-w-[620px] text-base leading-relaxed text-[var(--vesh-muted)] sm:text-lg">
                    Rehearse with lifelike AI clients. Get coaching that mirrors
                    what real supervisors do. Build confidence before real clients.
                  </p>
                  <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                    <button
                      aria-label="Try the live demo"
                      onClick={() =>
                        signedIn
                          ? openWorkspaceAfterAuth()
                          : focusHomeDemo()
                      }
                      className="vesh-button"
                    >
                      Try a 3-turn rehearsal
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="See a sample report"
                      onClick={() =>
                        signedIn
                          ? openWorkspaceAfterAuth()
                          : router.push(studentSignUpPath)
                      }
                      className="vesh-button vesh-button-yellow"
                    >
                      See sample report
                    </button>
                  </div>

                  <div className="mt-8 hidden gap-3 border-b-[1.5px] border-[var(--vesh-black)] pb-6 text-xs sm:grid-cols-3 lg:grid">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6" />
                      <span>Built for therapy students</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6" />
                      <span>Evidence-aligned rubrics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Lock className="h-6 w-6" />
                      <span>Privacy first and secure</span>
                    </div>
                  </div>
                  <div className="mt-3 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--vesh-muted)] lg:flex">
                    <span className="text-[var(--vesh-coral)]">*</span>
                    NOT A REPLACEMENT FOR SUPERVISION, DESIGNED TO PREPARE YOU FOR IT.
                  </div>
                  <span className="sr-only">Full rehearsal after sign-up</span>
                </div>

                <div ref={homeDemoRef} className="min-w-0">
                  <NotebookHero
                    onStartRehearsal={() =>
                      signedIn
                        ? openWorkspaceAfterAuth()
                        : router.push(demoSignUpPath)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {firstRunStudentVisible && (
        <FirstRunStudentDashboard
          persona={recommendedFirstCase}
          onStart={startSession}
          onSampleReport={openSampleReport}
        />
      )}

      {view === "student" && !firstRunStudentVisible && (
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
            {!completedSessionsLoaded ? (
              <div className="vesh-card p-5">
                <div className="vesh-kicker text-[var(--vesh-muted)]">
                  Loading practice history
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--vesh-muted)]">
                  Checking for saved reports before building your next practice plan.
                </p>
              </div>
            ) : (
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
            )}
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
                Your reports will appear here after each completed rehearsal.
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
