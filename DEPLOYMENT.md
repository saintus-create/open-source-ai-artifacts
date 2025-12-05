# Deploying to Vercel

This guide will help you deploy the Open Source AI Artifacts project to Vercel.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saintus-create/open-source-ai-artifacts)

## Manual Deployment Steps

### 1. Prerequisites

- A [Vercel account](https://vercel.com/signup)
- A [GitHub account](https://github.com/join)
- Required API keys (see Environment Variables section)

### 2. Deploy to Vercel

#### Option A: Using the Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### 3. Environment Variables

Set up the following environment variables in your Vercel project settings:

#### Required Variables

- `E2B_API_KEY` - Get your API key at [e2b.dev](https://e2b.dev/)
- `OPENAI_API_KEY` - Your OpenAI API key (or other AI provider keys)

#### Optional AI Provider Keys

- `ANTHROPIC_API_KEY` - For Claude models
- `GROQ_API_KEY` - For Groq models
- `FIREWORKS_API_KEY` - For Fireworks AI
- `TOGETHER_API_KEY` - For Together AI
- `GOOGLE_AI_API_KEY` - For Google AI (Gemini)
- `GOOGLE_VERTEX_CREDENTIALS` - For Google Vertex AI
- `MISTRAL_API_KEY` - For Mistral AI
- `XAI_API_KEY` - For xAI (Grok)

#### Optional Configuration

- `NEXT_PUBLIC_SITE_URL` - Your deployed site URL (e.g., `https://your-app.vercel.app`)
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window
- `RATE_LIMIT_WINDOW` - Rate limit time window in seconds

#### Optional Services

- `KV_REST_API_URL` - Vercel/Upstash KV for short URLs and rate limiting
- `KV_REST_API_TOKEN` - Token for Upstash KV
- `SUPABASE_URL` - Supabase URL for authentication
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog API key for analytics
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL

#### Feature Flags (Optional)

- `NEXT_PUBLIC_NO_API_KEY_INPUT` - Set to disable API key input in chat
- `NEXT_PUBLIC_NO_BASE_URL_INPUT` - Set to disable base URL input
- `NEXT_PUBLIC_HIDE_LOCAL_MODELS` - Set to hide local models from the list

### 4. Adding Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the sidebar
4. Add each variable:
   - Enter the variable name
   - Enter the value
   - Select the environment (Production, Preview, Development)
   - Click "Save"

### 5. Redeploy

After adding environment variables:
1. Go to the "Deployments" tab
2. Click the three dots menu on the latest deployment
3. Select "Redeploy"

## Automatic Deployments

Once connected, Vercel will automatically deploy:
- **Production**: Every push to your `main` branch
- **Preview**: Every push to other branches and pull requests

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click on "Domains"
3. Add your custom domain
4. Update your DNS settings as instructed

## Troubleshooting

### Build Failures

- Check the build logs in Vercel Dashboard
- Ensure all required environment variables are set
- Verify that your `package.json` has the correct build script

### Runtime Errors

- Check the Function logs in Vercel Dashboard
- Verify API keys are correct and have proper permissions
- Ensure environment variables are set for the correct environment

### Performance Issues

- Consider upgrading your Vercel plan for better performance
- Optimize images and assets
- Enable Edge Runtime where applicable

## Support

For issues specific to this project, please open an issue on [GitHub](https://github.com/saintus-create/open-source-ai-artifacts/issues).

For Vercel-specific issues, check the [Vercel Documentation](https://vercel.com/docs) or [Vercel Support](https://vercel.com/support).
