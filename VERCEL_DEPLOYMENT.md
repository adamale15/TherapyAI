# Vercel Deployment Guide

This guide will help you deploy the TherapyAI application to Vercel.

## Prerequisites

1. A Vercel account ([vercel.com](https://vercel.com))
2. A Supabase project ([supabase.com](https://supabase.com))
3. A Clerk account ([clerk.com](https://clerk.com))
4. A Google Gemini API key ([ai.google.dev](https://ai.google.dev))

## Step 1: Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

## Step 2: Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key**
4. Configure your application:
   - Add your Vercel deployment URL to allowed origins
   - Enable email/password authentication
   - Configure sign-up and sign-in settings

## Step 3: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your **Project URL**, **Anon Key**, and **Service Role Key**
3. In Supabase SQL Editor, run the schema:
   - Navigate to SQL Editor
   - Run the SQL from `supabase/schema.sql` (if it exists)
   - Run `supabase/seed-default-personas.sql` (if it exists)

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Install Command**: `npm install --legacy-peer-deps` (already configured in vercel.json)
   - **Output Directory**: `.next` (default)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## Step 5: Configure Environment Variables

In your Vercel project dashboard, go to **Settings → Environment Variables** and add:

### Required Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Optional: API URL (auto-detected on Vercel)
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### Environment Variable Setup

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable for all environments (Production, Preview, Development)
4. Click **Save**

## Step 6: Deploy

1. After adding environment variables, trigger a new deployment:
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger automatic deployment

## Step 7: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-app.vercel.app`)
2. Test the sign-up/sign-in flow
3. Verify that personas load correctly
4. Test a therapy session

## Troubleshooting

### Build Errors

If you encounter build errors:

1. **Dependency Issues**: The `vercel.json` already includes `--legacy-peer-deps` flag
2. **Type Errors**: Check that all TypeScript types are correct
3. **Missing Environment Variables**: Ensure all required env vars are set in Vercel

### Runtime Errors

1. **Clerk Authentication**: Verify Clerk keys are correct and URLs are whitelisted
2. **Supabase Connection**: Check Supabase credentials and database schema
3. **API Routes**: Ensure API routes are working (check Vercel function logs)

### Common Issues

- **"Missing environment variables"**: Add all required env vars in Vercel dashboard
- **"Clerk authentication failed"**: Check Clerk dashboard for allowed origins
- **"Supabase connection failed"**: Verify Supabase project is active and credentials are correct

## Post-Deployment

1. **Update Clerk Allowed Origins**: Add your production URL to Clerk dashboard
2. **Test All Features**: Verify sign-up, sign-in, persona selection, and chat sessions
3. **Monitor Logs**: Check Vercel function logs for any errors
4. **Set Up Custom Domain** (optional): Configure a custom domain in Vercel settings

## File Structure

The project structure is already optimized for Vercel:
- `vercel.json` - Vercel configuration
- `next.config.ts` - Next.js configuration
- `middleware.ts` - Clerk middleware for route protection
- API routes in `app/api/` - Serverless functions

## Support

For issues:
1. Check Vercel deployment logs
2. Check Vercel function logs
3. Verify all environment variables are set
4. Ensure database schema is properly set up in Supabase

