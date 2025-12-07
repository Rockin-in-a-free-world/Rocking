# Deploying to GitHub Pages

This guide shows you how to deploy your Solana Wallet Demo App to GitHub Pages for free hosting.

## Prerequisites

- GitHub account
- Git installed locally
- Next.js app ready to deploy

## Step 1: Configure Next.js for Static Export

### 1. Update `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export
  images: {
    unoptimized: true, // Required for static export
  },
  basePath: process.env.NODE_ENV === 'production' 
    ? '/solana-wallet-app' // Your repo name
    : '',
  assetPrefix: process.env.NODE_ENV === 'production'
    ? '/solana-wallet-app' // Your repo name
    : '',
}

module.exports = nextConfig
```

### 2. Update Environment Variables

Create `.env.production`:

```bash
NEXT_PUBLIC_METAMASK_CLIENT_ID=your_client_id
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

**Important**: Prefix public variables with `NEXT_PUBLIC_` so they're available in the browser.

### 3. Update API Routes

GitHub Pages only serves static files, so you can't use Next.js API routes. You have two options:

**Option A: Use Client-Side Only**
- Make all API calls directly from the browser
- Use MetaMask SDK directly in components
- Query Solana RPC directly from client

**Option B: Use External API**
- Deploy API to Vercel/Netlify separately
- Or use serverless functions

For this demo, we'll use **Option A** (client-side only).

## Step 2: Update Code for Static Export

### 1. Remove API Routes

Delete or comment out any API routes in `app/api/`.

### 2. Update Imports

Make sure all Solana/MetaMask code works client-side:

```typescript
'use client'; // Add to all components that use browser APIs

import { useEffect, useState } from 'react';
```

### 3. Handle Environment Variables

```typescript
const METAMASK_CLIENT_ID = process.env.NEXT_PUBLIC_METAMASK_CLIENT_ID!;
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
```

## Step 3: Set Up GitHub Repository

### 1. Initialize Git (if not already)

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name it `solana-wallet-app` (or your preferred name)
4. Don't initialize with README (you already have files)
5. Click "Create repository"

### 3. Connect Local to Remote

```bash
git remote add origin https://github.com/YOUR_USERNAME/solana-wallet-app.git
git branch -M main
git push -u origin main
```

## Step 4: Set Up GitHub Actions

### 1. Create Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_METAMASK_CLIENT_ID: ${{ secrets.METAMASK_CLIENT_ID }}
          NEXT_PUBLIC_SOLANA_RPC_URL: https://api.devnet.solana.com
          NEXT_PUBLIC_SOLANA_NETWORK: devnet
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2. Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - Name: `METAMASK_CLIENT_ID`
   - Value: Your MetaMask client ID
5. Click **Add secret**

### 3. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

## Step 5: Update package.json Scripts

```json
{
  "scripts": {
    "build": "next build",
    "export": "next build",
    "start": "next start"
  }
}
```

## Step 6: Deploy

### 1. Push Changes

```bash
git add .
git commit -m "Configure for GitHub Pages"
git push
```

### 2. Monitor Deployment

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Watch the workflow run
4. Wait for "Deploy to GitHub Pages" to complete

### 3. Access Your App

Your app will be available at:
```
https://YOUR_USERNAME.github.io/solana-wallet-app/
```

## Troubleshooting

### Issue: 404 Errors

**Solution**: Make sure `basePath` in `next.config.js` matches your repository name.

### Issue: Environment Variables Not Working

**Solution**: 
- Ensure variables are prefixed with `NEXT_PUBLIC_`
- Rebuild after adding secrets
- Check GitHub Actions logs

### Issue: API Routes Not Working

**Solution**: GitHub Pages is static-only. Move API logic to client-side or use external API.

### Issue: Images Not Loading

**Solution**: Set `images: { unoptimized: true }` in `next.config.js`.

## Alternative: Manual Deployment

If you prefer manual deployment:

```bash
# Build locally
npm run build

# The 'out' directory contains static files
# Copy contents to 'docs' folder
cp -r out/* docs/

# Commit and push
git add docs/
git commit -m "Deploy to GitHub Pages"
git push
```

Then in GitHub Settings → Pages, set source to `/docs` folder.

## Custom Domain (Optional)

1. Add `CNAME` file to `public/` folder:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Add CNAME record pointing to `YOUR_USERNAME.github.io`

3. GitHub will automatically detect and configure

## Best Practices

1. **Use Environment Variables**: Never commit secrets
2. **Test Locally**: Run `npm run build` before pushing
3. **Monitor Actions**: Check GitHub Actions for build errors
4. **Version Control**: Tag releases for easy rollback

## Limitations

- **Static Only**: No server-side rendering or API routes
- **Build Time**: Each push triggers a new build (~2-5 minutes)
- **Bandwidth**: GitHub Pages has usage limits (generous for demos)

## Next Steps

1. Set up custom domain (optional)
2. Add analytics (optional)
3. Configure CDN caching (optional)
4. Set up staging branch for testing

## Resources

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions](https://docs.github.com/en/actions)

