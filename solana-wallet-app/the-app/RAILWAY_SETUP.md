# Railway Setup Guide

## Quick Start

1. **Create Railway Account**
   - Sign up at https://railway.app
   - Free tier: $5 credit/month, 500 hours runtime

2. **Push Code to GitHub**
   ```bash
   cd the-app
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. **Deploy on Railway**
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Next.js

4. **Add Environment Variables**
   - Go to Railway dashboard → Your Project → **Variables**
   - Add required secrets (see below)

5. **Deploy**
   - Railway auto-deploys on every push
   - Get your URL: `https://your-app.up.railway.app`

## Required Environment Variables

Add these in Railway dashboard → Variables:

```bash
# MetaMask Embedded Wallets (Required)
NEXT_PUBLIC_EMBEDDED_WALLET_CLIENT_ID=your_client_id
EMBEDDED_WALLET_SECRET_KEY=your_secret_key

# Solana (Required)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Feemaster (Set after first setup)
FEEMASTER_SEED_PHRASE="word1 word2 ... word12"  # Optional: can be set via setup endpoint
FEEMASTER_PUBLIC_KEY=<public_key>                # Optional: will be set by setup
```

## How Railway Secrets Work

- **Encrypted**: Secrets are encrypted at rest
- **Injected**: Automatically available as `process.env.VARIABLE_NAME`
- **Secure**: Never exposed in build logs or code
- **Updateable**: Can be updated without redeploying

### Railway Configuration
- `railway.json` - Railway deployment config
- `.railwayignore` - Files to exclude from Railway
- Updated `.gitignore` - Added Railway-specific ignores
- Created `RAILWAY_SETUP.md` - Deployment guide

### Code for Railway
- ✅ Feemaster setup detects Railway environment
- ✅ Uses `process.env` for secrets (Railway injects automatically)
- ✅ Falls back to `.env.local` for local development
- ✅ Private key endpoint derives from seed phrase


## Feemaster Setup on Railway

1. Visit `https://your-app.up.railway.app/feemaster`
2. Enter seed phrase (or leave empty to generate)
3. Click "Login"
4. Setup endpoint will return seed phrase and public key
5. **Add to Railway Variables**:
   - Go to Railway dashboard → Variables
   - Add `FEEMASTER_SEED_PHRASE` with the returned seed phrase
   - Add `FEEMASTER_PUBLIC_KEY` with the returned public key
6. Refresh feemaster dashboard - operations will now work

## Railway Configuration

The app includes `railway.json` for Railway configuration:
- **Builder**: NIXPACKS (auto-detects Node.js)
- **Start Command**: `npm start`
- **Restart Policy**: ON_FAILURE (auto-restart on crashes)

## Troubleshooting

### Build Fails
- Check Railway build logs
- Verify Node.js version (should be 20.x)
- Check for missing dependencies

### Native Module Error
- Railway supports native modules
- If build fails, check Railway logs for specific errors
- May need to wait for Railway to install native dependencies

### Secrets Not Working
- Verify secrets are set in Railway dashboard
- Check variable names match exactly (case-sensitive)
- Restart deployment after adding secrets

## Cost

**Free Tier:**
- $5 credit/month
- 500 hours runtime/month
- Perfect for demo/testing

**Usage Estimate:**
- Next.js app: ~$0.01-0.05/hour
- With $5 credit: ~100-500 hours/month
- Well within free tier for demo

## Resources

- [Railway Docs](https://docs.railway.app)
- [Railway Pricing](https://railway.app/pricing)
- [Railway API](https://docs.railway.app/reference/api)

