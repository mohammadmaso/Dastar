# Deployment Guide

Dastar is a Next.js application with API routes that requires a server runtime. This document explains the deployment options.

## Important Notes

⚠️ **This app CANNOT be deployed as a pure static site to GitHub Pages** because it uses:
- Next.js API Routes (`/api/chat`, `/api/transcribe`, `/api/files`)
- Server-side components and dynamic routes
- OpenAI API calls that must be proxied through the backend

## Recommended Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest option as it's made by the Next.js team:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key (optional if users provide their own)
5. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Option 2: Netlify

Netlify also supports Next.js with API routes:

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import your repository
4. Set build command: `npm run build`
5. Set publish directory: `.next`
6. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key (optional)
7. Deploy

### Option 3: Self-Hosted (Docker)

For self-hosting, use Docker:

```bash
# Build Docker image
docker build -t dastar .

# Run container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key_here \
  dastar
```

### Option 4: Node.js Server

Deploy to any VPS with Node.js:

```bash
# Install dependencies
npm install

# Build production
npm run build

# Start server
npm start
```

Required environment variables:
- `OPENAI_API_KEY` (optional if users provide their own in settings)

## GitHub Pages Alternative (Client-Only Mode)

If you want to deploy to GitHub Pages, you'll need to:

1. **Remove API routes** and move all OpenAI calls to the client
2. **Important security consideration**: This will expose your API key in the client code
3. Instead, users MUST provide their own OpenAI API key in Settings

To enable GitHub Pages deployment:

1. Update `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  output: 'export', // Enable static export
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: { unoptimized: true },
};
```

2. Remove all files in `app/api/` directory

3. Update client components to call OpenAI directly using user-provided keys

4. Push to GitHub and enable GitHub Pages in repository settings

## Environment Variables

### Required (for server deployment)
- None (users can provide API keys in Settings)

### Optional
- `OPENAI_API_KEY`: Default OpenAI API key
- `OPENAI_BASE_URL`: Custom OpenAI-compatible API endpoint
- `NEXT_PUBLIC_BASE_PATH`: Base path for sub-directory deployment

## PWA Considerations

The app is configured as a PWA (Progressive Web App):
- Service worker will cache assets for offline use
- Users can install it as a native app
- All data is stored locally in IndexedDB
- File System Access API works on supported browsers

## Post-Deployment Setup

After deployment, users should:

1. Open the app in a modern browser (Chrome, Edge, or Brave recommended)
2. Go to Settings page
3. Configure their OpenAI API key and base URL
4. Optionally connect a local folder using File System Access API
5. Start creating notes!

## Monitoring

For production monitoring, consider:
- Vercel Analytics (built-in with Vercel)
- Google Analytics
- Sentry for error tracking
- Custom logging in API routes

## Updating

To deploy updates:

**Vercel/Netlify**: Push to your main branch, auto-deploys

**Self-hosted**:
```bash
git pull
npm install
npm run build
pm2 restart dastar  # or your process manager
```
