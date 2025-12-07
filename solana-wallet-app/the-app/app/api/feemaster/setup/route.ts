import { NextRequest, NextResponse } from 'next/server';
import { createFeemasterAccount, getFeemasterPublicKey } from '@/lib/feemaster';
import { generateSeedPhrase } from '@/lib/feemaster-generate';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup/Login feemaster account
 * 
 * Two modes:
 * 1. Setup (new): Generate new seed phrase → creates new wallet
 * 2. Login (existing): Use provided seed phrase → accesses existing wallet (account index 0)
 * 
 * Uses Tether SDK to derive account index 0 from seed phrase
 */
export async function POST(request: NextRequest) {
  try {
    let { seedPhrase } = await request.json();

    const isNewSetup = !seedPhrase || seedPhrase.trim() === '';
    
    // If no seed phrase provided, generate one (new setup)
    if (isNewSetup) {
      seedPhrase = generateSeedPhrase();
    }

    // Access feemaster account using Tether SDK
    // Tether SDK derives account index 0 from the seed phrase
    // This will throw an error if seed phrase is invalid
    let walletManager;
    let publicKey;
    try {
      walletManager = createFeemasterAccount(seedPhrase);
      publicKey = await getFeemasterPublicKey(walletManager);
    } catch (error: any) {
      // Tether SDK will throw error if seed phrase is invalid
      return NextResponse.json(
        { error: `Invalid seed phrase: ${error.message || 'Seed phrase validation failed. Please check your seed phrase and try again.'}` },
        { status: 400 }
      );
    }

    // Store credentials
    // On Railway: Use Railway environment variables (set via dashboard or API)
    // Local dev: Store in .env.local for development
    const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.RAILWAY;
    
    if (isRailway) {
      // On Railway: Return instructions to add to Railway secrets
      // Railway secrets should be added via Railway dashboard or Railway API
      return NextResponse.json({
        success: true,
        publicKey,
        seedPhrase: isNewSetup ? seedPhrase : undefined, // Only return if newly generated
        isNewSetup,
        message: isNewSetup 
          ? 'New feemaster account created. Add FEEMASTER_SEED_PHRASE and FEEMASTER_PUBLIC_KEY to Railway Variables.'
          : 'Feemaster account accessed successfully.',
        instructions: isNewSetup 
          ? 'Go to Railway dashboard → Your Project → Variables → Add: FEEMASTER_SEED_PHRASE and FEEMASTER_PUBLIC_KEY'
          : undefined,
        railway: true,
      });
    } else {
      // Local development: Store in .env.local
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      
      // Read existing .env.local if it exists
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      // Add or update feemaster credentials
      const lines = envContent.split('\n');
      const newLines: string[] = [];
      let foundSeed = false;
      let foundPublicKey = false;

      for (const line of lines) {
        if (line.startsWith('FEEMASTER_SEED_PHRASE=')) {
          newLines.push(`FEEMASTER_SEED_PHRASE="${seedPhrase}"`);
          foundSeed = true;
        } else if (line.startsWith('FEEMASTER_PUBLIC_KEY=')) {
          newLines.push(`FEEMASTER_PUBLIC_KEY=${publicKey}`);
          foundPublicKey = true;
        } else if (line.trim() !== '') {
          newLines.push(line);
        }
      }

      // Add missing entries
      if (!foundSeed) {
        newLines.push(`FEEMASTER_SEED_PHRASE="${seedPhrase}"`);
      }
      if (!foundPublicKey) {
        newLines.push(`FEEMASTER_PUBLIC_KEY=${publicKey}`);
      }

      // Write to .env.local
      fs.writeFileSync(envPath, newLines.join('\n') + '\n');

      return NextResponse.json({
        success: true,
        publicKey,
        seedPhrase: isNewSetup ? seedPhrase : undefined, // Only return if newly generated
        isNewSetup,
        message: isNewSetup 
          ? 'New feemaster account created and stored in .env.local'
          : 'Feemaster account accessed successfully.',
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to setup feemaster account' },
      { status: 500 }
    );
  }
}

