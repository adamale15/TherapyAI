import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
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
    expect(app).toContain("summaryDuration} minute rehearsal");
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
    expect(app).toContain("summaryAnalysis.metrics");
    expect(app).toContain("programHistorySessions");
    expect(app).toContain("savedScoreDisplay");
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

  test("landing hero is an interactive notebook that works without auth", () => {
    const app = read("components/BoldVeshApp.tsx");
    const hero = read("components/NotebookHero.tsx");

    expect(app).not.toContain("Clinical training lab");
    expect(app).not.toContain("min-h-[470px]");
    expect(app).toContain("NotebookHero");
    expect(app).toContain("onStartRehearsal");
    expect(app).not.toContain("vesh-demo-card");
    expect(app).not.toContain("function DemoStat");

    expect(hero).not.toContain("/api/chat");
    expect(hero).not.toContain('"set_persona"');
    expect(hero).not.toContain('"text_input"');
    expect(hero).toContain("buildDemoClientReply");
    expect(hero).toContain("it will get better");
    expect(hero).toContain("I want to believe that");
    expect(hero).toContain("pickDemoReply");
    expect(hero).toContain("analyzeClinicalSession");
    expect(hero).toContain("onStartRehearsal");
  });

  test("core app surfaces include mobile responsive layout guards", () => {
    const app = read("components/BoldVeshApp.tsx");
    const hero = read("components/NotebookHero.tsx");
    const css = read("app/globals.css");
    const modal = read("components/PersonaUploadModal.tsx");

    expect(app).toContain("vesh-mobile-nav");
    expect(app).toContain("p-4 sm:p-6");
    expect(app).toContain("overflow-x-auto");
    expect(app).toContain("min-w-[780px]");
    expect(app).toContain("sm:flex-nowrap");
    expect(app).toContain("max-w-[92%]");
    expect(hero).toContain("sm:min-h-[380px]");
    expect(hero).toContain("max-w-full");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain("--vesh-shadow: 4px 4px 0");
    expect(modal).toContain("max-h-[92vh]");
    expect(modal).toContain("grid gap-3 sm:flex");
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

  test("landing page is a student-first conversion surface", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("REALISTIC PRACTICE.");
    expect(app).toContain("CLINICAL FEEDBACK.");
    expect(app).toContain("REAL GROWTH.");
    expect(app).toContain("Try the live demo");
    expect(app).toContain("See a sample report");
    expect(app).toContain("Built for therapy students");
    expect(app).toContain("Full rehearsal after sign-up");
    expect(app).toContain("router.push(demoSignUpPath)");
  });

  test("logged-out notebook demo has a stronger guided conversion funnel", () => {
    const hero = read("components/NotebookHero.tsx");

    expect(hero).toContain("DEMO_TURN_LIMIT");
    expect(hero).toContain("Mini report unlocked");
    expect(hero).toContain("Create account for full session");
    expect(hero).toContain("Try a 3-turn rehearsal");
    expect(hero).toContain("Reflection before assessment");
    expect(hero).toContain("Full sessions use AI voice clients");
    expect(hero).not.toContain("Offer advice");
  });

  test("sign-up page adapts when visitor arrives from the demo", () => {
    const signUp = read("app/sign-up/[[...sign-up]]/page.tsx");

    expect(signUp).toContain('searchParams.get("intent")');
    expect(signUp).toContain("Continue from your demo");
    expect(signUp).toContain("Unlock the full rehearsal");
    expect(signUp).toContain("Start with the student practice workspace");
  });

  test("first-run student dashboard guides the next action instead of showing only empty data", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("StudentDashboard");
    expect(app).toContain("First practice plan");
    expect(app).toContain("Start {persona.name} case");
    expect(app).toContain("How progress works");
    expect(app).toContain("Your reports will appear here after each completed rehearsal.");
    expect(app).toContain("Recommended first case");
    expect(app).not.toContain("Training journal");
    expect(app).not.toContain("Practice journal");
    expect(app).not.toContain("firstRunStudentVisible");
  });

  test("demo intent is reserved for the completed demo signup path", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain('const studentSignUpPath = "/sign-up?userType=student";');
    expect(app).toContain('const demoSignUpPath = "/sign-up?userType=student&intent=demo";');
    expect(app).toContain("router.push(studentSignUpPath)");
    expect((app.match(/router\.push\(demoSignUpPath\)/g) ?? []).length).toBe(1);
  });

  test("auth entrypoints work as links and land signed-in users in the workspace", () => {
    const app = read("components/BoldVeshApp.tsx");
    const signIn = read("app/sign-in/[[...sign-in]]/page.tsx");
    const setUserType = read("app/api/auth/set-user-type/route.ts");

    expect(signIn).toContain('fallbackRedirectUrl="/?auth=1"');
    expect(signIn).toContain('forceRedirectUrl="/?auth=1"');
    expect(app).toContain('href="/sign-in"');
    expect(app).toContain("href={studentSignUpPath}");
    expect(app).toContain("openWorkspaceAfterAuth");
    expect(app).toContain('urlParams.get("auth") === "1"');
    expect(app).toContain('urlParams.get("userTypeSet") === "true"');
    expect(app).toContain("user.reload()");
    expect(app).toContain('window.history.replaceState({}, "", window.location.pathname)');
    expect(setUserType).toContain('redirectUrl.searchParams.set("userType", userType)');
    expect(app).not.toContain('onClick={() => router.push("/sign-in")}');
  });

  test("signed-in users do not see logged-out homepage actions", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("handledInitialSignedInHome");
    expect(app).toContain('const isInitialSignedInHome = view === "home" && !handledInitialSignedInHome.current;');
    expect(app).toContain("!authRedirect && !userTypeSet && !isInitialSignedInHome");
    expect(app).toContain("AppShell");
    expect(app).toContain("onSignOut={handleSignOut}");
    expect(app).toContain(") : isLoaded ? (");
    expect(app).toContain('aria-hidden="true"');
    expect(app).toMatch(/\) : isLoaded \? \(\s*<>\s*<a\s+href="\/sign-in"/);
    expect(app).not.toContain("function Topbar");
    expect(app).not.toContain('onClick={() => onNavigate("home")}');
  });

  test("first-run dashboard waits for saved history before showing empty-state guidance", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("completedSessionsLoaded");
    expect(app).toContain("studentDashboardVisible");
    expect(app).toContain('const studentDashboardVisible = view === "student";');
    expect(app).toContain("Loading practice history");
    expect(app).not.toContain("showFirstRunStudent");
  });

  test("notebook demo completion has one clear accessible conversion action", () => {
    const hero = read("components/NotebookHero.tsx");

    expect(hero).toContain('aria-live="polite"');
    expect(hero).toContain("demoComplete");
    expect(hero).toContain("disabled={busy || demoComplete}");
    expect(hero).not.toContain("Start full rehearsal");
    expect(hero).not.toContain("/api/chat");
  });

  test("home page matches the reference masthead and desktop hero shell", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("AI THERAPY TRAINING FOR THERAPY STUDENTS");
    expect(app).toContain("PRACTICE MORE. GET BETTER. HELP MORE.");
    expect(app).toContain("How it works");
    expect(app).toContain("For schools");
    expect(app).toContain("Pricing");
    expect(app).toContain("Resources");
    expect(app).toContain("Log in");
    expect(app).toContain("Start practicing");
    expect(app).toContain("REALISTIC PRACTICE.");
    expect(app).toContain("CLINICAL FEEDBACK.");
    expect(app).toContain("REAL GROWTH.");
    expect(app).toContain("NOT A REPLACEMENT FOR SUPERVISION");
  });

  test("home masthead does not duplicate the Vesh wordmark above the product header", () => {
    const app = read("components/BoldVeshApp.tsx");
    const homeMasthead = app.match(/function HomeMasthead\(\) \{[\s\S]*?function PersonaCard/);

    expect(homeMasthead?.[0]).toBeDefined();
    expect(homeMasthead?.[0]).not.toContain("<Brand />");
    expect(homeMasthead?.[0]).toContain("AI THERAPY TRAINING FOR THERAPY STUDENTS");
    expect(homeMasthead?.[0]).toContain("PRACTICE MORE. GET BETTER. HELP MORE.");
  });

  test("notebook hero includes the reference live rubric sidebar", () => {
    const hero = read("components/NotebookHero.tsx");

    expect(hero).toContain("Live rehearsal");
    expect(hero).toContain("Anxiety Intake - Sarah Chen");
    expect(hero).toContain("Time left");
    expect(hero).toContain("Coaching margin");
    expect(hero).toContain("Alliance score");
    expect(hero).toContain("Reflection ratio");
    expect(hero).toContain("Question quality");
    expect(hero).toContain("Risk screen");
    expect(hero).toContain("View full rubric");
    expect(hero).toContain("Reflect");
    expect(hero).toContain("Explore");
    expect(hero).toContain("Open question");
  });

  test("first-run dashboard matches the reference guided dashboard", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("Welcome to Vesh, future therapist");
    expect(app).toContain("Practice checklist");
    expect(app).toContain("{checklistCount} / 4");
    expect(app).toContain("Run your first rehearsal");
    expect(app).toContain("Complete and review your report");
    expect(app).toContain("Explore suggested next moves");
    expect(app).toContain("Save your session to your journal");
    expect(app).toContain("Your progress");
    expect(app).toContain("Report preview");
    expect(app).toContain("Build the relationship before you solve.");
    expect(app).toContain("See sample report");
  });

  test("signed-in dashboard derives case and report details from live data", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("function chooseRecommendedPersona");
    expect(app).toContain("function personaCaseLabel");
    expect(app).toContain("function personaTags");
    expect(app).toContain("latestReportPersona");
    expect(app).toContain("latestReportCaseLabel");
    expect(app).toContain("{persona.condition}");
    expect(app).toContain("{tag}");
    expect(app).toContain('{hasReports ? "Open latest report" : "See sample report"}');
    expect(app).not.toContain("Sarah is a 21-year-old student experiencing academic stress");
    expect(app).not.toContain('<span className="vesh-chip px-2 py-1 text-[10px]">Anxiety</span>');
    expect(app).not.toContain('<span className="vesh-chip px-2 py-1 text-[10px]">College student</span>');
    expect(app).not.toContain('["Alliance", hasReports ? clinicalDashboard.allianceMeanDisplay : "4.1 / 5"]');
    expect(app).not.toContain(': "1.2 : 1"');
  });

  test("dashboard recommended case uses a compact case-file illustration", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("function DashboardCaseIllustration");
    expect(app).toContain("<DashboardCaseIllustration />");
    expect(app).toContain("h-40 sm:h-52");
    expect((app.match(/<PersonaPortrait persona={persona}/g) ?? []).length).toBe(1);
  });

  test("student dashboard rail is interactive and accessible", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("function DashboardRailIcon");
    expect(app).toContain("function AppShell");
    expect(app).toContain("type=\"button\"");
    expect(app).toContain("aria-label={label}");
    expect(app).toContain("title={label}");
    expect(app).toContain("onNavigate");
    expect(app).toContain('label="Browse cases"');
    expect(app).toContain('label="Programs"');
    expect(app).toContain("grid-cols-4");
    expect(app).not.toContain('label="Start rehearsal"');
    expect(app).not.toContain("onStartPractice");
    expect(app).not.toContain(">Practice</button>");
    expect(app).not.toContain('label="Open report preview"');
    expect(app).not.toContain("onOpenReport");
  });

  test("student dashboard progress metrics do not use the cramped four-column strip", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("dashboardMetrics");
    expect(app).toContain("grid gap-3 sm:grid-cols-2");
    expect(app).not.toContain("grid grid-cols-4 gap-2 text-xs");
    expect(app).toContain("max-w-[1480px]");
  });

  test("signed-in workspace views share one app shell instead of mixing topbar navigation", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain('const appShellVisible = view !== "home";');
    expect(app).toContain('data-testid="vesh-app-shell"');
    expect(app).toContain("{appShellVisible && (");
    expect(app).not.toContain("<Topbar");
    expect(app).not.toContain('label="Open report preview"');
    expect(app).not.toContain('active={view === "briefing" || view === "session"}');
  });

  test("program session history can download saved reports directly", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("programHistorySessions");
    expect(app).toContain("Session history");
    expect(app).toContain('["Case", "Alliance", "Empathy", "Turns", "Date", "Report"]');
    expect(app).toContain("onClick={() => void downloadReportPdf(session)}");
    expect(app).toContain("Download report");
    expect(app).toContain("const downloadReportPdf = async (session?: CompletedClinicalSession)");
    expect(app).toContain('const reportStatus = session ? "Saved session report" : completionLabel;');
  });

  test("case cards use reusable male and female SVG portraits", () => {
    const app = read("components/BoldVeshApp.tsx");

    expect(app).toContain("function PersonaPortrait");
    expect(app).toContain("personaPortraitVariant");
    expect(app).toContain("/persona-art/female-silhouette.svg");
    expect(app).toContain("/persona-art/male-silhouette.svg");
    expect(app).toContain("<PersonaPortrait persona={persona}");
    expect(app).not.toContain("function FemalePortraitSvg");
    expect(app).not.toContain("function MalePortraitSvg");
    expect(app).not.toContain("function CasePortrait");
  });

  test("persona SVG assets embed their artwork instead of referencing a nested image", () => {
    const male = read("public/persona-art/male-silhouette.svg");
    const female = read("public/persona-art/female-silhouette.svg");

    expect(male).toContain("data:image/jpeg;base64,");
    expect(female).toContain("data:image/jpeg;base64,");
    expect(male).not.toContain("./source-silhouettes.jpg");
    expect(female).not.toContain("./source-silhouettes.jpg");
    expect(existsSync(join(root, "public/persona-art/source-silhouettes.jpg"))).toBe(false);
  });
});
