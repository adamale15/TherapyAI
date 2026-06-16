# Bold Notebook UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Vesh from the current dark glass/purple interface into the approved bold startup notebook design system.

**Architecture:** Keep the existing Next.js, Clerk, and Convex behavior intact. Add a focused CSS design system in `app/globals.css`, then restyle the current React components around the existing state flow instead of changing data logic.

**Tech Stack:** Next.js App Router, React, Tailwind utility classes, Clerk, Convex, Vitest.

---

### Task 1: Design-System Acceptance Test

**Files:**
- Create: `tests/bold-notebook-ui.test.ts`

- [ ] **Step 1: Add a static acceptance test**

```ts
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
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/bold-notebook-ui.test.ts`

Expected: fail because the new CSS variables/classes and auth theme are not implemented yet.

### Task 2: Global Design System

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the old glass defaults with bold notebook tokens**

Add CSS variables for ink, paper, coral, green, yellow, blue, muted text, border, and shadow.

- [ ] **Step 2: Add reusable classes**

Add `.vesh-shell`, `.vesh-topbar`, `.vesh-brand`, `.vesh-button`, `.vesh-card`, `.vesh-note`, `.vesh-chip`, `.vesh-paper`, `.vesh-input`, `.vesh-table`, `.vesh-rail`, and `.vesh-avatar`.

- [ ] **Step 3: Update the font stack**

Use `Archivo` for product UI and keep a serif available for occasional clinical/report headings.

### Task 3: Auth Pages

**Files:**
- Modify: `app/sign-in/[[...sign-in]]/page.tsx`
- Modify: `app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: Restyle page shell**

Use paper background, bold Vesh topbar, and a centered card that matches the approved mockup.

- [ ] **Step 2: Restyle Clerk appearance**

Use coral primary, paper card, black borders, square-ish radius, and no purple gradient classes.

### Task 4: App Surfaces

**Files:**
- Modify: `components/TherapyAi.tsx`
- Modify: `components/StudentDashboard.tsx`
- Modify: `components/PractitionerDashboard.tsx`
- Modify: `components/PersonaManagement.tsx`
- Modify: `components/PersonaUploadModal.tsx`

- [ ] **Step 1: Restyle landing and role flows**

Replace hero glass/purple treatment with bold notebook landing.

- [ ] **Step 2: Restyle dashboards**

Make student dashboard a practice journal and practitioner dashboard a supervision desk.

- [ ] **Step 3: Restyle persona management and upload**

Make personas feel like case files and upload feel like a clinical note import modal.

- [ ] **Step 4: Restyle live session and summary**

Use notebook grid, left rail, chat page, and right coach margin.

### Task 5: Verification

**Files:**
- No new files.

- [ ] **Step 1: Run automated checks**

Run:

```powershell
npm test
npm run type-check
npm run build
```

- [ ] **Step 2: Visual verify locally**

Start the app, open the local URL, and inspect landing, auth, dashboard, persona, upload, live session, and summary surfaces.

- [ ] **Step 3: Commit and push**

Commit the visual rebuild and push to `main` after checks pass.
