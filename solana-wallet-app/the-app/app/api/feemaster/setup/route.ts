import { NextRequest, NextResponse } from 'next/server';
import { createFeemasterAccountSimple } from '@/lib/feemaster-simple';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup feemaster account - creates account index 0 and stores in .env
 * This is the FIRST operation - just account creation and storage
 */
export async function POST(request: NextRequest) {
  try {
    const { seedPhrase } = await request.json();

    // Validate seed phrase
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return NextResponse.json(
        { error: 'Seed phrase must be 12 or 24 words' },
        { status: 400 }
      );
    }

    // Create feemaster account (index 0)
    const { publicKey, privateKey } = await createFeemasterAccountSimple(seedPhrase);

    // Store insecurely in .env.local (for demo only)
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
    let foundPrivateKey = false;

    for (const line of lines) {
      if (line.startsWith('FEEMASTER_SEED_PHRASE=')) {
        newLines.push(`FEEMASTER_SEED_PHRASE="${seedPhrase}"`);
        foundSeed = true;
      } else if (line.startsWith('FEEMASTER_PUBLIC_KEY=')) {
        newLines.push(`FEEMASTER_PUBLIC_KEY=${publicKey}`);
        foundPublicKey = true;
      } else if (line.startsWith('FEEMASTER_PRIVATE_KEY=')) {
        newLines.push(`FEEMASTER_PRIVATE_KEY=${privateKey}`);
        foundPrivateKey = true;
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
    if (!foundPrivateKey) {
      newLines.push(`FEEMASTER_PRIVATE_KEY=${privateKey}`);
    }

    // Write to .env.local
    fs.writeFileSync(envPath, newLines.join('\n') + '\n');

    return NextResponse.json({
      success: true,
      publicKey,
      message: 'Feemaster account created and stored in .env.local',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to setup feemaster account' },
      { status: 500 }
    );
  }
}

