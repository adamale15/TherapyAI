# Migration to Unified Next.js Structure

## Completed ✅

1. **Unified package.json** - All dependencies consolidated into root package.json
2. **Service files moved** - All server services moved to `lib/services/`
3. **Knowledge base moved** - Persona data and loader moved to `lib/knowledge-base/`
4. **Custom server created** - `server.ts` handles both Next.js and WebSocket connections
5. **API routes started** - Next.js API routes created for auth and personas
6. **Configuration updated** - tsconfig.json and next.config.ts configured
7. **App structure** - Web app files moved to root `app/` and `components/` directories

## Structure

```
/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── personas/      # Persona management endpoints
│   ├── layout.tsx
│   └── page.tsx
├── components/             # React components
├── lib/                   # Shared libraries
│   ├── services/          # Business logic services
│   ├── knowledge-base/     # Persona data and loaders
│   ├── llm.ts             # LLM integration
│   └── safety.ts          # Safety/crisis detection
├── server.ts              # Custom Next.js server with WebSocket
└── package.json           # Unified dependencies

```

## Remaining Tasks ⚠️

1. **Update component API URLs** - Change from `process.env.NEXT_PUBLIC_API_URL` to relative paths `/api/...`
2. **Complete API routes** - Add remaining personas routes (upload, delete, update, preview)
3. **File upload handling** - Convert multer-based uploads to Next.js FormData handling
4. **Update imports** - Ensure all imports use `@/` alias correctly
5. **Test and fix** - Run the application and fix any import/path issues
6. **Clean up** - Remove old `server/` and `web/` directories after verification

## Running the Application

```bash
# Install dependencies
npm install

# Development mode (runs custom server with WebSocket)
npm run dev

# Production build
npm run build
npm start
```

## Notes

- WebSocket server runs on the same port as Next.js (default: 3000)
- API routes are accessible at `/api/*`
- All services use the `@/` path alias for imports
- The custom server (`server.ts`) handles both HTTP and WebSocket connections

