# Hosting Options for Solana Wallet App

## The Challenge

**GitHub Pages** only serves **static files** - no server-side code, no API routes, no Node.js runtime.

**Our app needs:**
- Frontend (Next.js pages) ✅ Can be static
- Feemaster API routes (use Tether SDK with native modules) ❌ Needs Node.js server

## Hosting Solutions

### Option 1: GitHub Pages + Separate API Server (Recommended for Free)

**Architecture:**
```
Frontend (GitHub Pages) → API Server (Vercel/Railway/Render)
```

**Setup:**
1. **Frontend on GitHub Pages:**
   - Next.js static export (`output: 'export'`)
   - All pages are static HTML/JS
   - Calls external API for feemaster operations

2. **API Server (separate service):**
   - Deploy feemaster API routes to:
     - **Vercel** (free tier, serverless functions)
     - **Railway** (free tier, full Node.js)
     - **Render** (free tier, full Node.js)
     - **Fly.io** (free tier, full Node.js)

**Pros:**
- ✅ Free hosting for both frontend and API
- ✅ GitHub Pages for frontend (fast, CDN)
- ✅ Separate API can use native modules
- ✅ Can scale independently

**Cons:**
- ⚠️ Two separate deployments
- ⚠️ Need to configure CORS for API
- ⚠️ API URL needs to be in environment variables

**Example:**
```typescript
// Frontend calls external API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.vercel.app';

const response = await fetch(`${API_URL}/api/feemaster/setup`, {
  method: 'POST',
  body: JSON.stringify({ seedPhrase }),
});
```

### Option 2: Full Next.js Hosting (Easiest)

**Services:**
- **Vercel** (made by Next.js creators) - Free tier
- **Netlify** - Free tier
- **Railway** - Free tier

**Architecture:**
```
Full Next.js App (Frontend + API Routes)
```

**Setup:**
- Deploy entire Next.js app
- API routes work natively
- Tether SDK should work (if native modules are supported)

**Pros:**
- ✅ Single deployment
- ✅ API routes work automatically
- ✅ No CORS issues
- ✅ Easy to set up

**Cons:**
- ⚠️ Need to verify native modules work (sodium-native)
- ⚠️ Not "free" if you exceed limits (but generous free tiers)

### Option 3: Client-Side Only (No Server Needed)

**Architecture:**
```
Static Frontend (GitHub Pages) → Direct Solana RPC calls
```

**Setup:**
- Remove all API routes
- Use Tether SDK in browser (if possible)
- Or use `@solana/web3.js` directly in browser
- Store seed phrase in browser localStorage (insecure, demo only)

**Pros:**
- ✅ Single deployment (GitHub Pages only)
- ✅ No server costs
- ✅ Simple architecture

**Cons:**
- ❌ Native modules (sodium-native) won't work in browser
- ❌ Tether SDK may not work in browser
- ❌ Seed phrase stored in browser (insecure)
- ❌ No server-side validation

## Recommended Approach

### For Demo/Testing: **Option 1 (GitHub Pages + Vercel API)**

**Why:**
1. **Frontend on GitHub Pages** - Free, fast, easy
2. **API on Vercel** - Free tier, supports Next.js API routes, handles native modules

**Steps:**

1. **Frontend (GitHub Pages):**
   ```bash
   # Configure for static export
   next.config.js: { output: 'export' }
   
   # Update API calls to use external URL
   const API_URL = 'https://your-api.vercel.app';
   ```

2. **API Server (Vercel):**
   ```bash
   # Create separate repo or folder for API
   # Deploy just the API routes to Vercel
   # Get API URL: https://your-api.vercel.app
   ```

3. **Connect them:**
   ```typescript
   // Frontend .env.local
   NEXT_PUBLIC_API_URL=https://your-api.vercel.app
   ```

### For Production: **Option 2 (Full Next.js on Vercel)**

**Why:**
- Single deployment
- Better security (server-side operations)
- Easier to manage
- Vercel handles native modules

## Implementation Guide

### Option 1: Split Architecture

#### Step 1: Separate API Server

Create `api-server/` directory:

```
api-server/
├── app/
│   └── api/
│       └── feemaster/
│           ├── setup/
│           │   └── route.ts
│           ├── balance/
│           │   └── route.ts
│           └── private-key/
│               └── route.ts
├── lib/
│   └── feemaster.ts
├── package.json
└── vercel.json
```

#### Step 2: Deploy API to Vercel

```bash
cd api-server
vercel deploy
# Get URL: https://your-api.vercel.app
```

#### Step 3: Update Frontend

```typescript
// lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.vercel.app';

export async function setupFeemaster(seedPhrase: string) {
  const response = await fetch(`${API_URL}/api/feemaster/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seedPhrase }),
  });
  return response.json();
}
```

#### Step 4: Deploy Frontend to GitHub Pages

```bash
# Build static export
npm run build

# Deploy to GitHub Pages
# (using GitHub Actions workflow)
```

## Cost Comparison

| Option | Frontend | API | Total Cost |
|--------|----------|-----|------------|
| GitHub Pages + Vercel | Free | Free (100GB bandwidth) | **Free** |
| Full Vercel | Free (100GB bandwidth) | Included | **Free** |
| GitHub Pages + Railway | Free | Free (500 hours/month) | **Free** |
| GitHub Pages + Render | Free | Free (750 hours/month) | **Free** |

## Recommendation

**For this demo:** Use **Option 1 (GitHub Pages + Vercel API)**

**Why:**
- ✅ Both free
- ✅ Native modules work on Vercel
- ✅ Frontend on fast CDN (GitHub Pages)
- ✅ Easy to set up
- ✅ Can scale if needed

**Next Steps:**
1. Create separate API server directory
2. Move feemaster API routes to API server
3. Deploy API to Vercel
4. Update frontend to call external API
5. Deploy frontend to GitHub Pages

## Alternative: Test if Native Modules Work on Vercel

Before splitting, test if Tether SDK works in Next.js API routes on Vercel:

1. Deploy current app to Vercel
2. Test feemaster setup endpoint
3. If it works → Use Option 2 (full Vercel)
4. If it doesn't → Use Option 1 (split architecture)

