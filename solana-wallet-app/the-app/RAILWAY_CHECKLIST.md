# Railway Configuration Checklist

## ✅ Environment Variables (Railway Dashboard → Variables)

### Required for Build & Runtime:

1. **Solana Configuration** ✅ (You've added this)
   - `NEXT_PUBLIC_SOLANA_RPC_URL` = `https://api.devnet.solana.com`
   - `NEXT_PUBLIC_SOLANA_NETWORK` = `devnet`
   - `SOLANA_RPC_URL` = `https://api.devnet.solana.com`

### Optional (Set after feemaster setup):

2. **Feemaster Account** (Can be set via `/feemaster` page after deployment)
   - `FEEMASTER_SEED_PHRASE` = "word1 word2 ... word12" (12 or 24 words)
   - `FEEMASTER_PUBLIC_KEY` = Public key (will be generated)

## 🔧 Railway Service Configuration

### Check These Settings:

1. **Service Settings** (Railway Dashboard → Your Service → Settings)
   - ✅ **Source**: Connected to GitHub repo
   - ✅ **Branch**: Should be `main` or `dev` (whichever you want to deploy)
   - ✅ **Root Directory**: Leave empty (or set to `/` if needed)
   - ✅ **Build Command**: Should auto-detect `npm run build` (with `--webpack` flag)
   - ✅ **Start Command**: Should be `npm start`

2. **Deployment Settings**
   - ✅ **Auto-Deploy**: Enabled (deploys on every push)
   - ✅ **Health Check**: Not required for Next.js (optional)

3. **Networking**
   - ✅ **Public Domain**: Railway will auto-generate one
   - ✅ **Custom Domain**: Optional (can add later)

## 📋 Pre-Deployment Checklist

- [x] Solana RPC URL added to Railway variables
- [ ] `NEXT_PUBLIC_SOLANA_NETWORK` = `devnet` added
- [ ] `SOLANA_RPC_URL` = `https://api.devnet.solana.com` added
- [ ] Railway service connected to GitHub repo
- [ ] Build is running (check build logs)

## 🚀 Post-Deployment Steps

Once the build succeeds:

1. **Get Your App URL**
   - Railway dashboard → Your Service → Settings → Domains
   - Copy the Railway-generated URL (e.g., `https://your-app.up.railway.app`)

2. **Test the App**
   - Visit: `https://your-app.up.railway.app`
   - Should see the landing page

3. **Set Up Feemaster** (Optional, can do later)
   - Visit: `https://your-app.up.railway.app/feemaster`
   - Generate or enter seed phrase
   - Copy the returned `FEEMASTER_SEED_PHRASE` and `FEEMASTER_PUBLIC_KEY`
   - Add them to Railway Variables
   - Refresh the feemaster dashboard

## ⚠️ Important Notes

1. **Shared Variables vs Service Variables**
   - If you used "Shared Variables", they're available to all services in the project
   - This is fine for a single-service app
   - If you have multiple services later, you can move them to service-specific variables

2. **Variable Names Must Match Exactly**
   - Case-sensitive: `NEXT_PUBLIC_SOLANA_RPC_URL` not `next_public_solana_rpc_url`
   - No spaces or typos

3. **NEXT_PUBLIC_ Prefix**
   - Variables starting with `NEXT_PUBLIC_` are exposed to the browser
   - Only use this prefix for variables that are safe to expose
   - Server-only variables (like `FEEMASTER_SEED_PHRASE`) should NOT have this prefix

4. **Build Time vs Runtime**
   - All variables are available at build time
   - All variables are available at runtime
   - Next.js will bundle `NEXT_PUBLIC_*` variables into the client bundle

## 🔍 Verify Configuration

After adding variables, check:

1. **Railway Dashboard → Variables**
   - All required variables are listed
   - Values are correct (no typos)
   - No extra spaces or quotes (unless needed)

2. **Build Logs**
   - Should show: "Creating an optimized production build ..."
   - Should show: "✓ Compiled successfully"
   - Should complete without errors

3. **Deploy Logs**
   - Should show: "npm start"
   - Should show: "Ready on http://0.0.0.0:3000"
   - No crash errors

## 🆘 If Build Fails

1. Check Railway build logs for specific error
2. Verify all environment variables are set
3. Check that variable names match exactly (case-sensitive)
4. Ensure no extra spaces or quotes in values
5. Try redeploying after fixing variables

## 📞 Next Steps

Once build succeeds:
- Test the app at your Railway URL
- Set up feemaster account (optional)
- Test user login with seed phrase
- Test sending SOL transactions
- Monitor Railway metrics for usage/costs

