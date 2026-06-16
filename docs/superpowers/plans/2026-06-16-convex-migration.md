# Convex Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase-backed application data with Convex-backed personas and chat sessions while keeping Clerk as the only auth system.

**Architecture:** Add Convex schema/functions for personas and chat sessions, expose Convex to React through a Clerk-aware provider, and use Convex HTTP access from server-only Next.js routes. Keep Gemini, document parsing, and ElevenLabs behind Next route handlers because they require secrets or Node libraries.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Clerk, Convex, Gemini, Tailwind CSS, Vitest for focused unit tests.

---

## File Structure

- Create `convex/schema.ts`: Convex table definitions and indexes.
- Create `convex/auth.config.ts`: Clerk issuer configuration for Convex.
- Create `convex/personas.ts`: persona queries and mutations.
- Create `convex/chatSessions.ts`: chat session queries and mutations.
- Create `convex/seed.ts`: default persona seeding mutation.
- Create `lib/personas/default-personas.ts`: shared default persona constants used by UI fallback and Convex seed.
- Create `lib/convex/server.ts`: server-side Convex HTTP client helper.
- Create `components/ConvexClientProvider.tsx`: Clerk-aware Convex React provider.
- Modify `app/layout.tsx`: wrap app with Convex provider inside Clerk provider.
- Modify `components/TherapyAi.tsx`: read personas from Convex and remove Supabase-specific fallback assumptions.
- Modify `components/PersonaManagement.tsx`: use Convex query/mutation hooks for persona management.
- Modify `app/api/chat/route.ts`: store sessions through Convex instead of Supabase.
- Create `app/api/personas/preview/route.ts`: parse uploaded documents and return generated preview.
- Create `app/api/personas/upload/route.ts`: parse uploaded documents, generate persona, and save through Convex.
- Modify `lib/llm.ts`: load personas through Convex and remove hardcoded/stale assumptions.
- Modify `lib/services/persona-generator.ts`: remove hardcoded Gemini key fallback.
- Modify `app/api/elevenlabs/route.ts` and `lib/services/elevenlabs-service.ts`: use server-only `ELEVENLABS_API_KEY`.
- Remove Supabase runtime files and package dependency after call sites are migrated.
- Add `vitest.config.ts` and focused tests under `tests/`.

## Tasks

### Task 1: Add Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `tests/persona-generator.test.ts`

- [ ] Add `vitest` as a dev dependency and add `"test": "vitest run"` to scripts.
- [ ] Create one failing test that asserts persona generation refuses to initialize without `GEMINI_API_KEY`.
- [ ] Run `npm test -- tests/persona-generator.test.ts` and confirm it fails because the production code still has a hardcoded fallback.
- [ ] Remove the hardcoded fallback in `lib/services/persona-generator.ts`.
- [ ] Run the test again and confirm it passes.

### Task 2: Add Convex Dependency and Generated Baseline

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `convex/schema.ts`
- Create: `convex/auth.config.ts`

- [ ] Install `convex`.
- [ ] Create schema tables for `personas`, `chatSessions`, and `sessionHistory`.
- [ ] Configure Convex Clerk auth with `CLERK_JWT_ISSUER_DOMAIN`.
- [ ] Run `npx convex codegen` or `npx convex dev --once` if environment allows it.
- [ ] If codegen cannot run because no Convex deployment is configured, leave a clear setup note and keep code imports compatible with generated files.

### Task 3: Extract Shared Default Personas

**Files:**
- Create: `lib/personas/default-personas.ts`
- Modify: `components/TherapyAi.tsx`
- Create: `tests/default-personas.test.ts`

- [ ] Write a failing test that asserts the shared default persona list includes Sarah, Marcus, and Elena with stable IDs.
- [ ] Extract the hardcoded persona list from `TherapyAi.tsx` into `lib/personas/default-personas.ts`.
- [ ] Update `TherapyAi.tsx` to import the shared constants.
- [ ] Run the test and `npm run type-check`.

### Task 4: Implement Convex Persona Functions

**Files:**
- Create: `convex/personas.ts`
- Create: `convex/seed.ts`
- Modify: `components/PersonaManagement.tsx`
- Modify: `components/TherapyAi.tsx`

- [ ] Implement `listForCurrentUser`, `getById`, `saveCustom`, and `deleteCustom` Convex functions.
- [ ] Implement idempotent default persona seeding.
- [ ] Replace fetch-based persona loading in UI with Convex hooks.
- [ ] Keep local default constants as a first-run fallback if Convex returns no seeded defaults.
- [ ] Run type-check.

### Task 5: Implement Convex Chat Session Functions

**Files:**
- Create: `convex/chatSessions.ts`
- Create: `lib/convex/server.ts`
- Modify: `app/api/chat/route.ts`
- Modify: `app/api/chat/stream/route.ts`
- Modify: `lib/llm.ts`

- [ ] Implement Convex mutations for `getOrCreate`, `setPersona`, `appendTurns`, `clearHistory`, and `saveCompleted`.
- [ ] Replace `supabaseSessionStore` usage in chat routes with Convex HTTP calls.
- [ ] Update `therapyReply` persona lookup to use Convex-compatible persona data passed by the route.
- [ ] Keep `/api/chat/stream` as readiness/keepalive only unless token streaming is implemented separately.
- [ ] Run type-check.

### Task 6: Wire Persona Upload Routes

**Files:**
- Create: `app/api/personas/preview/route.ts`
- Create: `app/api/personas/upload/route.ts`
- Modify: `components/PersonaUploadModal.tsx`

- [ ] Implement multipart parsing with `request.formData()`.
- [ ] Parse PDF/DOCX text using existing document parser behavior adapted for temporary files.
- [ ] Generate preview with `PersonaGenerator`.
- [ ] Generate and save custom persona through Convex in upload route.
- [ ] Update upload modal to use relative URLs and show returned errors.
- [ ] Run type-check.

### Task 7: Remove Supabase and Legacy Auth

**Files:**
- Delete: `lib/supabase/client.ts`
- Delete: `lib/supabase-session-store.ts`
- Delete: `lib/session-store.ts`
- Delete: `lib/services/supabase-auth.ts`
- Delete: `lib/services/fallback-auth.ts`
- Delete: `lib/services/auth-interface.ts`
- Delete: `app/api/auth/login/route.ts`
- Delete: `app/api/auth/register/route.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] Search for all Supabase imports and remove migrated call sites.
- [ ] Remove `@supabase/supabase-js`.
- [ ] Keep `supabase/` SQL files only if archived docs still reference them, otherwise delete them as stale setup.
- [ ] Run `npm install` to update lockfile.
- [ ] Run `npm run type-check`.

### Task 8: Final Polish and Verification

**Files:**
- Modify: `README.md`
- Modify: `README-SUPABASE.md` or replace with Convex setup docs
- Modify: `MIGRATION-SUMMARY.md`

- [ ] Document required environment variables: Clerk keys, `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, `CLERK_JWT_ISSUER_DOMAIN`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`.
- [ ] Run `npm test`.
- [ ] Run `npm run type-check`.
- [ ] Run `npm run build` if Convex generated files and required env vars are available.
- [ ] Summarize any environment-gated verification that could not be completed.

## Self-Review

- Spec coverage: Convex schema/functions, Clerk auth, server-only integrations, persona upload, cleanup, tests, and docs are covered.
- Placeholder scan: No task contains undefined placeholders.
- Type consistency: Persona IDs remain strings; user ownership uses Clerk user IDs; route handlers call Convex through server helpers.
