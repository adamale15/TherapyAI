"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

const clerkNotebookAppearance = {
  elements: {
    rootBox: "mx-auto w-full max-w-[430px]",
    card:
      "bg-[#fbf1dc] border-[1.5px] border-[#11110f] rounded shadow-[7px_7px_0_rgba(17,17,15,0.2)]",
    headerTitle:
      "text-[#11110f] font-black uppercase tracking-[-0.03em] text-3xl",
    headerSubtitle: "text-[#77664f] text-sm",
    socialButtonsBlockButton:
      "bg-[#fff8ea] border-[1.5px] border-[#11110f] text-[#11110f] rounded font-black uppercase text-xs hover:bg-[#ffe66b]",
    socialButtonsBlockButtonText: "text-[#11110f] font-black",
    formButtonPrimary:
      "bg-[#ff4b35] hover:bg-[#c43225] text-[#fff8ea] rounded border-[1.5px] border-[#11110f] shadow-[4px_4px_0_#11110f] font-black uppercase text-xs",
    formFieldInput:
      "!bg-[#fff8ea] !border-[1.5px] !border-[#11110f] !text-[#11110f] rounded focus:!ring-2 focus:!ring-[#ff4b35]",
    formFieldLabel: "text-[#11110f] font-black uppercase text-xs",
    footerActionLink: "text-[#c43225] hover:text-[#11110f] font-black",
    identityPreviewText: "text-[#11110f] font-bold",
    identityPreviewEditButton: "text-[#c43225] hover:text-[#11110f]",
    formResendCodeLink: "text-[#c43225] hover:text-[#11110f]",
    dividerLine: "bg-[#d6bf98]",
    dividerText: "text-[#77664f] uppercase text-xs tracking-wider",
    alertText: "text-[#11110f]",
    formFieldSuccessText: "text-[#0f3d32]",
    formFieldErrorText: "text-[#c43225]",
    formFieldOptionalIndicator: "text-[#77664f] text-xs",
  },
  variables: {
    colorPrimary: "#ff4b35",
    colorBackground: "#fbf1dc",
    borderRadius: "0.25rem",
    fontFamily: "var(--font-archivo, system-ui, sans-serif)",
  },
} as const;

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("userType");
  const intent = searchParams.get("intent");
  const isDemoIntent = intent === "demo";

  return (
    <main className="vesh-shell min-h-screen">
      <header className="vesh-topbar">
        <div className="vesh-brand">
          <span className="vesh-mark">V</span>
          Vesh
        </div>
        <div />
        <div className="vesh-kicker">Sign up</div>
      </header>

      <section className="grid min-h-[calc(100vh-58px)] place-items-center p-6">
        <div className="w-full max-w-[430px]">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="vesh-note vesh-note-green">
              <strong>{isDemoIntent ? "Continue from your demo" : "Student"}</strong>
              <p className="mt-1 text-xs text-[#11110f]">
                {isDemoIntent
                  ? "Unlock the full rehearsal with Sarah and save your first report."
                  : "Practice journal and live coaching."}
              </p>
            </div>
            <div className="vesh-note">
              <strong>{isDemoIntent ? "Start with the student practice workspace" : "Practitioner"}</strong>
              <p className="mt-1 text-xs text-[#11110f]">
                {isDemoIntent
                  ? "Voice clients, longer sessions, and clinical rubrics open after sign-up."
                  : "Cohort review and rubric tools."}
              </p>
            </div>
          </div>
          <SignUp
            appearance={clerkNotebookAppearance}
            forceRedirectUrl={
              userType ? `/api/auth/set-user-type?userType=${userType}` : undefined
            }
            fallbackRedirectUrl="/"
            routing="path"
            path="/sign-up"
          />
        </div>
      </section>
    </main>
  );
}
