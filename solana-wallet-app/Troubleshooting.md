# Railway Deployment Troubleshooting Guide

## Issue: App Stuck on "Initializing Web3Auth..." on Railway

**Symptom**: The app at `https://demo-solana-app-production.up.railway.app/` shows "Initializing Web3Auth..." and never loads.

**Root Cause**: Next.js `NEXT_PUBLIC_*` environment variables are embedded at **build time**, not runtime. If the environment variable isn't available during the Docker build, it won't be in the client bundle, causing Web3Auth to fail silently.

---

## Understanding the Problem

### How Next.js Handles `NEXT_PUBLIC_*` Variables

1. **Build Time**: Next.js embeds `NEXT_PUBLIC_*` variables into the client-side JavaScript bundle during `npm run build`
2. **Runtime**: These variables are static strings in the bundle - they cannot be changed after build
3. **Railway**: Environment variables must be available during the Docker build step, not just at runtime

### Current Code Issue

The code in `lib/web3authContext.tsx` has a placeholder workaround:
- If the variable is missing at build time, it returns `'PLACEHOLDER_CLIENT_ID_FOR_BUILD'`
- This prevents build failures but causes silent runtime failures
- Web3Auth tries to initialize with an invalid client ID and fails silently
- The app gets stuck on "Initializing Web3Auth..." because the error isn't properly caught

---

## Solutions

### Solution 1: Verify Railway Environment Variables (IMMEDIATE)

**Check Railway Dashboard:**

1. Go to Railway Dashboard → Your Project → **Variables**
2. Verify these variables exist:
   - `NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID` (or `NEXT_PUBLIC_METAMASK_CLIENT_ID`)
   - `NEXT_PUBLIC_SOLANA_RPC_URL`
   - `NEXT_PUBLIC_SOLANA_NETWORK`
   - `EMBEDDED_WALLET_SECRET_KEY` (server-side only, no `NEXT_PUBLIC_` prefix)

3. **Critical Checks:**
   - ✅ Variable is in **Shared Variables** (checkmark beside it)
   - ✅ Variable name matches exactly (case-sensitive, no typos)
   - ✅ Value is correct (no extra quotes, spaces, or newlines)
   - ✅ Variable is set as **Public** (not Secret) if Railway has that option

4. **Check Build Logs:**
   - Railway Dashboard → Your Service → **Deployments** → Latest deployment → **Build Logs**
   - Look for environment variable injection during build
   - Verify the variable is available when `npm run build` runs

### Solution 2: Ensure Variables Are Set Before Build

**Important**: Railway environment variables must be set **BEFORE** the build starts.

1. **Set Variables First:**
   - Add/update variables in Railway Dashboard
   - Wait for them to be saved

2. **Trigger New Build:**
   - Railway auto-deploys on git push, OR
   - Manually trigger redeploy: Railway Dashboard → Your Service → **Deployments** → **Redeploy**

3. **Verify Build:**
   - Check build logs to ensure variables are present
   - Build should complete successfully

### Solution 3: Fix Code to Fail Explicitly (RECOMMENDED)

Update the code to throw errors instead of using placeholders, so failures are visible:

**File: `lib/web3authContext.tsx`**

```typescript
function getWeb3AuthClientId(): string {
  // Check Railway Variables first (production)
  // Support both variable names for compatibility
  let clientId = process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID || 
                 process.env.NEXT_PUBLIC_METAMASK_CLIENT_ID;

  // Strip quotes if Railway added them (Railway sometimes includes quotes in variable values)
  if (clientId) {
    clientId = clientId.trim();
    // Remove surrounding quotes if present
    if ((clientId.startsWith('"') && clientId.endsWith('"')) || 
        (clientId.startsWith("'") && clientId.endsWith("'"))) {
      clientId = clientId.slice(1, -1);
    }
  }

  // Validate and provide helpful error messages
  if (!clientId || clientId.trim() === '' || clientId === 'PLACEHOLDER_CLIENT_ID_FOR_BUILD') {
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY;
    const envSource = isRailway ? 'Railway Variables' : '.env file';
    
    const errorMessage = `
⚠️ Web3Auth Client ID is not set!

Current environment: ${isRailway ? 'Railway (production)' : 'Local development'}

To fix this:
${isRailway ? `
1. Go to Railway Dashboard → Your Project → Variables
2. Add ONE of these (both work):
   - NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID = your_web3auth_client_id
   - NEXT_PUBLIC_METAMASK_CLIENT_ID = your_web3auth_client_id
3. Make sure it's set as a "Public" variable (not secret)
4. Make sure it's in "Shared Variables" (checkmark beside it)
5. Redeploy the service (variables must be set BEFORE build)

Note: Railway Variables are shared across all services in the project.
IMPORTANT: Variables must be set BEFORE building. Next.js embeds NEXT_PUBLIC_ variables at build time.
` : `
1. Create or update .env.local file in the-app directory
2. Add ONE of these (both work):
   - NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID=your_web3auth_client_id
   - NEXT_PUBLIC_METAMASK_CLIENT_ID=your_web3auth_client_id
3. Restart the dev server

Get your Client ID from: https://dashboard.web3auth.io
`}

Web3Auth will not work until this is configured.
    `.trim();

    console.error(errorMessage);
    
    // Always throw error - don't use placeholder
    // This ensures the error is caught and displayed to the user
    throw new Error(
      `Web3Auth Client ID is required but not set in ${envSource}. ` +
      `Please configure NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID or NEXT_PUBLIC_METAMASK_CLIENT_ID ` +
      `in Railway Variables (make sure it's in Shared Variables with a checkmark) or .env.local file. ` +
      `IMPORTANT: On Railway, variables must be set BEFORE building. ` +
      `Get your Client ID from: https://dashboard.web3auth.io`
    );
  }

  return clientId;
}
```

**File: `components/Web3AuthWrapper.tsx`**

Add validation in the useEffect:

```typescript
useEffect(() => {
  // Check if we're on a feemaster page
  const isFeemaster = pathname?.startsWith('/feemaster') || false;
  setIsFeemasterPage(isFeemaster);

  // Only initialize Web3Auth for user pages (not feemaster)
  if (isFeemaster) {
    // Feemaster pages don't need Web3Auth - skip initialization
    return;
  }

  try {
    // Get config only in browser (client-side) and only for user pages
    const web3AuthContextConfig = getWeb3AuthContextConfig();
    
    // Validate that clientId is not a placeholder
    const clientId = web3AuthContextConfig.web3AuthOptions.clientId;
    if (!clientId || clientId === 'PLACEHOLDER_CLIENT_ID_FOR_BUILD' || clientId.trim() === '') {
      throw new Error('Web3Auth Client ID is not configured. Please set NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID in Railway Variables and redeploy.');
    }
    
    setConfig(web3AuthContextConfig);
  } catch (err: any) {
    console.error('Web3Auth configuration error:', err);
    setError(err.message || 'Failed to initialize Web3Auth');
  }
}, [pathname]);
```

### Solution 4: Alternative - Use Runtime Environment Variable Injection

If Railway doesn't pass variables during build, you can use a workaround with a server-side API route:

**Create: `app/api/config/route.ts`**

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    clientId: process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID || 
              process.env.NEXT_PUBLIC_METAMASK_CLIENT_ID,
    solanaRpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    solanaNetwork: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  });
}
```

Then fetch this in your client code. However, this is less ideal because:
- Adds an extra API call
- Still requires the variable to be set (just accessed at runtime)
- Doesn't solve the root cause

**Recommendation**: Fix the build-time variable injection instead.

---

## Step-by-Step Fix Checklist

### Immediate Actions

- [ ] **Check Railway Variables**
  - [ ] Open Railway Dashboard → Your Project → Variables
  - [ ] Verify `NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID` exists
  - [ ] Verify it's in Shared Variables (checkmark)
  - [ ] Verify value is correct (no quotes/spaces)
  - [ ] Verify `NEXT_PUBLIC_SOLANA_RPC_URL` is set
  - [ ] Verify `NEXT_PUBLIC_SOLANA_NETWORK` is set

- [ ] **Check Build Logs**
  - [ ] Railway Dashboard → Your Service → Deployments → Latest
  - [ ] Check if variables are available during build
  - [ ] Look for any errors related to environment variables

- [ ] **Redeploy**
  - [ ] If variables were missing, add them
  - [ ] Trigger a new deployment (push to git or manual redeploy)
  - [ ] Wait for build to complete
  - [ ] Test the app

### Code Fixes (If Variables Are Set But Still Failing)

- [ ] **Update `lib/web3authContext.tsx`**
  - [ ] Remove placeholder logic
  - [ ] Always throw error if variable is missing
  - [ ] Add better error messages

- [ ] **Update `components/Web3AuthWrapper.tsx`**
  - [ ] Add validation for placeholder client ID
  - [ ] Ensure errors are caught and displayed

- [ ] **Test Locally**
  - [ ] Test with `.env.local` file
  - [ ] Test with missing variable (should show error)
  - [ ] Verify error message is helpful

- [ ] **Deploy to Railway**
  - [ ] Push changes to git
  - [ ] Wait for Railway to build
  - [ ] Test the deployed app

---

## Verification Steps

### 1. Check Browser Console

Open browser DevTools → Console and look for:
- Error messages about missing Client ID
- Web3Auth initialization errors
- Any other relevant errors

### 2. Check Network Tab

Open browser DevTools → Network:
- Check if Web3Auth API calls are being made
- Look for failed requests
- Check response status codes

### 3. Check Railway Logs

Railway Dashboard → Your Service → **Logs**:
- Look for error messages
- Check if the app is starting correctly
- Look for environment variable references

### 4. Test Environment Variable Access

Add a temporary debug endpoint to verify variables:

**Create: `app/api/debug/env/route.ts`** (temporary, remove after debugging)

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasClientId: !!process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID,
    clientIdLength: process.env.NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID?.length || 0,
    hasSolanaRpc: !!process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    isRailway: !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY),
    // Don't expose actual values in production
  });
}
```

Visit `https://your-app.up.railway.app/api/debug/env` to check if variables are accessible at runtime.

**⚠️ Remove this endpoint after debugging!**

---

## Common Issues and Fixes

### Issue: Variable Set But Not Available During Build

**Symptom**: Variable exists in Railway but build logs show it's undefined.

**Fix**:
1. Ensure variable is in **Shared Variables** (not service-specific)
2. Check variable name matches exactly (case-sensitive)
3. Try removing and re-adding the variable
4. Trigger a fresh deployment

### Issue: Variable Has Extra Quotes

**Symptom**: Variable value includes quotes like `"your_client_id"` instead of `your_client_id`.

**Fix**:
1. Remove quotes from Railway variable value
2. The code already strips quotes, but it's better to not have them

### Issue: Variable Set After Build

**Symptom**: Added variable but app still doesn't work.

**Fix**:
1. Variables must be set **before** build starts
2. Add variable → Wait for it to save → Trigger new deployment
3. Don't add variables during an active build

### Issue: Wrong Variable Scope

**Symptom**: Variable exists but only for specific service.

**Fix**:
1. Use **Shared Variables** (checkmark beside variable name)
2. Shared variables are available to all services in the project
3. For single-service apps, shared variables are recommended

---

## Getting Your Web3Auth Client ID

If you don't have a Web3Auth Client ID:

1. Go to https://dashboard.web3auth.io
2. Sign up or log in
3. Create a new project
4. Copy the Client ID
5. Add it to Railway Variables as `NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID`

---

## Summary

**The core issue**: Next.js embeds `NEXT_PUBLIC_*` variables at build time. If the variable isn't available during the Docker build on Railway, it won't be in the client bundle, causing Web3Auth to fail.

**The fix**: 
1. Ensure `NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID` is set in Railway **Shared Variables** before building
2. Update code to fail explicitly instead of using placeholders
3. Redeploy after setting variables

**Quick check**: If the app shows "Initializing Web3Auth..." indefinitely, the Client ID is likely missing or invalid. Check Railway variables and build logs.
