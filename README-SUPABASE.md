# Supabase Migration Guide

This project has been migrated from Google Cloud Storage to Supabase for all database operations.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys

### 2. Set Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase/schema.sql` to create all tables

### 4. Seed Default Personas

1. In Supabase SQL Editor, run `supabase/seed-default-personas.sql`
2. This will populate the default personas (Sarah, Marcus, Elena)

### 5. Install Dependencies

```bash
npm install
```

## Database Schema

The following tables are created:

- **users**: User authentication and profile data
- **personas**: Therapy personas (default and custom)
- **chat_sessions**: Active chat sessions with conversation history
- **session_history**: Completed therapy sessions with scores and analytics

## Migration Notes

### What Changed

1. **Authentication**: Now uses Supabase `users` table instead of GCS files
2. **Personas**: Stored in Supabase `personas` table instead of file system
3. **Sessions**: Chat sessions persisted in Supabase `chat_sessions` table
4. **Session History**: Completed sessions saved to `session_history` table

### Removed Dependencies

- `@google-cloud/storage` - No longer needed
- GCS credentials file - No longer needed

### New Dependencies

- `@supabase/supabase-js` - Supabase client library

## API Changes

All API routes now use Supabase services:

- `/api/auth/login` - Uses `SupabaseAuthService`
- `/api/auth/register` - Uses `SupabaseAuthService`
- `/api/personas/*` - Uses `SupabasePersonaLoader`
- `/api/chat` - Uses `SupabaseSessionStore`

## Fallback Behavior

The application includes fallback services that use in-memory storage if Supabase is unavailable. This ensures the app continues to work during development or if Supabase connection fails.

## Next Steps

1. Run the schema SQL in your Supabase project
2. Seed the default personas
3. Update your environment variables
4. Test authentication and persona loading
5. Verify chat sessions are being saved

