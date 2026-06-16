# Vesh AI

Vesh is a therapy-skills practice app built with Next.js, Clerk, Convex, Gemini,
and speech tools.

## Stack

- Next.js App Router
- Clerk for authentication
- Convex for personas, chat sessions, and session history
- Gemini for patient persona replies and uploaded case generation
- Tailwind CSS for UI styling

## Local Setup

Install dependencies:

```bash
npm install
```

Create or update `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

NEXT_PUBLIC_CONVEX_URL=your-convex-url
CONVEX_DEPLOYMENT=your-convex-deployment
CLERK_JWT_ISSUER_DOMAIN=your-clerk-issuer-domain

GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

Link and run Convex:

```bash
npx convex dev
```

Seed bundled default personas from another terminal:

```bash
npx convex run personas:seedDefaults
```

Run the app:

```bash
npm run dev
```

## Verification

```bash
npm test
npm run type-check
npm run build
```

`npm run build` requires the Clerk and Convex environment variables above.
