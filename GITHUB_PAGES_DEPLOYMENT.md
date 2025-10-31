# GitHub Pages Deployment Guide

This guide explains how to deploy Dastar to GitHub Pages.

## Important Notes

⚠️ **GitHub Pages Deployment Modes**

Dastar has **two deployment workflows**:

1. **Server Mode** (`.github/workflows/deploy.yml`) - **NOT COMPATIBLE** with GitHub Pages static hosting
   - Includes API routes that require a Node.js server
   - Best for: Vercel, Netlify, or self-hosted

2. **Client-Only Mode** (`.github/workflows/deploy-static.yml`) - **COMPATIBLE** with GitHub Pages
   - Removes API routes during build
   - AI calls made directly from browser using user's API key
   - **Users MUST provide their own OpenAI API key**

## Option 1: Deploy to Vercel (Recommended)

The easiest option with full server support:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy

No additional configuration needed!

## Option 2: Deploy Static Version to GitHub Pages

### Prerequisites

- GitHub repository
- OpenAI API key (users will provide their own)

### Step 1: Enable GitHub Pages

1. Go to your repository settings
2. Navigate to **Pages** section
3. Under **Build and deployment**:
   - Source: **GitHub Actions**
   - (Not "Deploy from a branch")

### Step 2: Create Static Deployment Branch (Optional)

If you want to keep both server and static versions:

```bash
# Create a new branch for static deployment
git checkout -b gh-pages-static

# Push to GitHub
git push -u origin gh-pages-static
```

The workflow will automatically run when you push to this branch.

### Step 3: Manual Deployment Trigger

You can also manually trigger the deployment:

1. Go to **Actions** tab in your repository
2. Select **Deploy Static to GitHub Pages**
3. Click **Run workflow**
4. Select branch: `main` or `gh-pages-static`
5. Click **Run workflow**

### Step 4: Access Your App

After deployment completes (3-5 minutes):

- Your app will be available at: `https://yourusername.github.io/repository-name/`
- Example: `https://johndoe.github.io/dastar/`

### Step 5: Configure Settings

**IMPORTANT**: Users must configure their own API key:

1. Open the deployed app
2. Go to **Settings** page
3. Add OpenAI API key
4. (Optional) Change base URL for custom endpoints

## What Happens During Static Deployment?

The `.github/workflows/deploy-static.yml` workflow:

1. ✅ Checks out your code
2. ✅ Installs dependencies
3. ✅ **Removes `app/api` directory** (server routes)
4. ✅ Updates `next.config.ts` to enable static export
5. ✅ Builds as static HTML/CSS/JS
6. ✅ Deploys to GitHub Pages

## Client-Side vs Server-Side Differences

### Client-Side (GitHub Pages)

**Pros:**
- Free hosting
- No server costs
- Fast CDN delivery
- Automatic HTTPS

**Cons:**
- API key exposed in browser (users must use their own)
- No server-side validation
- Requires CORS-compatible APIs
- Larger client bundle

**Features that work:**
- ✅ Chat with AI (using user's API key)
- ✅ Voice transcription (using user's API key)
- ✅ File management (IndexedDB)
- ✅ File System API sync
- ✅ Visualizations (map, graph)
- ✅ All offline features

### Server-Side (Vercel/Netlify)

**Pros:**
- API key stays secure on server
- Server-side validation
- Better security
- Can add server-only features

**Cons:**
- Requires hosting platform
- May have costs (free tiers available)

**Features:**
- ✅ All client-side features
- ✅ Secure API key handling
- ✅ Server-side rate limiting
- ✅ Usage analytics

## Security Considerations

### For GitHub Pages (Client-Side)

⚠️ **Important Security Notes:**

1. **User API Keys**: Users provide their own OpenAI API keys
   - Keys are stored in IndexedDB (browser-local)
   - Never shared or transmitted except to OpenAI
   - Users can use custom base URLs (LocalAI, Ollama, etc.)

2. **No Server Secrets**: Since there's no server, no secrets are exposed

3. **CORS**: OpenAI API supports CORS, so browser requests work

4. **Browser Security**: All data stays in user's browser
   - IndexedDB encrypted at rest (browser-managed)
   - File System API requires user permission

### For Server Deployment

- Environment variables keep API keys secure
- Server-side validation possible
- Rate limiting can be implemented
- User keys still stored locally (optional server fallback)

## Troubleshooting

### Build Fails on GitHub Actions

**Error**: `npm ci` fails with lock file mismatch

**Solution**: The workflow uses `npm install` instead of `npm ci`

### Base Path Issues

If assets don't load, check:

1. Workflow sets `NEXT_PUBLIC_BASE_PATH=/${{ github.event.repository.name }}`
2. Your repo name matches the path in the URL

### CORS Errors

If you see CORS errors:

1. Check that base URL in Settings is correct
2. Verify API supports CORS (OpenAI does)
3. For custom APIs, ensure CORS headers are set

### API Key Not Working

1. Go to Settings page
2. Verify API key is correct
3. Check base URL matches your provider
4. Test with a simple message

## Custom Domain

To use a custom domain with GitHub Pages:

1. Add `CNAME` file to `public/` directory:
   ```
   yourdomain.com
   ```

2. Update workflow to preserve CNAME:
   ```yaml
   - name: Add CNAME
     run: echo "yourdomain.com" > ./out/CNAME
   ```

3. Configure DNS:
   - Add CNAME record pointing to `yourusername.github.io`
   - Wait for DNS propagation (up to 24 hours)

4. In repository settings → Pages:
   - Enter your custom domain
   - Enable "Enforce HTTPS"

## Switching Between Modes

### From Static to Server

1. Stop using the static workflow
2. Deploy to Vercel/Netlify
3. Optionally add server environment variables

### From Server to Static

1. Users export their data from Dev page
2. Create `gh-pages-static` branch
3. Push and workflow runs automatically
4. Users import their data in new deployment

## Monitoring

GitHub Pages doesn't provide analytics, but you can add:

- Google Analytics (add to `app/layout.tsx`)
- Vercel Analytics (if using Vercel)
- Custom tracking (PostHog, Plausible, etc.)

## Support

For issues:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for general deployment help
- Check GitHub Actions logs for build errors
- Open an issue on GitHub
