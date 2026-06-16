"use client";

import React, { useMemo, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  CheckCircle,
  LogOut,
  MessageSquare,
  Mic,
  Send,
  Upload,
} from "lucide-react";
import { PersonaUploadModal } from "./PersonaUploadModal";
import { convexFunctions } from "@/lib/convex/functions";
import { defaultPersonas, type PersonaData } from "@/lib/personas/default-personas";

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const sessionId = useRef(`session-${Date.now()}`);

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
    await signOut();
    setView("home");
    setSelectedPersona(null);
    setMessages([]);
  };

  const startSession = async (persona: PersonaData) => {
    if (!signedIn) {
      router.push("/sign-up?userType=student");
      return;
    }

    setSelectedPersona(persona);
    setMessages([
      {
        id: "opening",
        role: "client",
        text:
          persona.id === "marcus"
            ? "I do not really know what I am supposed to say. Work is fine, I guess."
            : persona.id === "elena"
            ? "I am here because I have to be, not because I trust this will help."
            : "I keep checking my score predictor. It makes me feel worse, but I still do it.",
      },
    ]);
    setFeedback([
      "Start with the feeling underneath the problem.",
      "Avoid reassurance until you understand what certainty does for the client.",
    ]);
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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "client",
          text: "Part of me wants to answer, and part of me feels embarrassed saying it out loud.",
        },
      ]);
      setFeedback([
        "The reply named ambivalence well.",
        "Try a grounded follow-up question next.",
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const finishSession = () => {
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
        <section className="grid min-h-[calc(100vh-58px)] grid-cols-1 md:grid-cols-[78px_1fr_310px]">
          <aside className="vesh-rail hidden p-4 md:grid md:content-start md:justify-items-center md:gap-3">
            <span className="vesh-chip w-10 px-0">{initials(selectedOrFirst.name)[0]}</span>
            <span className="vesh-chip w-10 px-0">25</span>
            <span className="vesh-chip w-10 px-0">Mic</span>
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`vesh-card max-w-[78%] p-3 text-sm leading-relaxed ${
                    message.role === "trainee"
                      ? "justify-self-end bg-[var(--vesh-green)] text-[var(--vesh-paper-soft)]"
                      : "justify-self-start"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {isLoading && (
                <div className="vesh-card max-w-[78%] p-3 text-sm">
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
              <button className="vesh-chip" title="Voice input placeholder">
                <Mic className="h-4 w-4" />
              </button>
              <button onClick={sendMessage} className="vesh-button">
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
          <aside className="border-t-[1.5px] border-[var(--vesh-black)] bg-[rgba(15,61,50,0.06)] p-6 md:border-l-[1.5px] md:border-t-0">
            <div className="vesh-note vesh-note-green">
              <strong>Good move</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                You reflected the function of reassurance seeking.
              </p>
            </div>
            <div className="vesh-note mt-3">
              <strong>Try next</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                {feedback[0] ?? "Ask what safety would feel like in the body."}
              </p>
            </div>
            <div className="vesh-note vesh-note-red mt-3">
              <strong>Watch</strong>
              <p className="mt-1 text-sm text-[var(--vesh-ink)]">
                {feedback[1] ?? "Avoid advice before exploring shame."}
              </p>
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
