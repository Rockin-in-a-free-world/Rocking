import { NextRequest, NextResponse } from 'next/server';

/**
 * Get feemaster private key (for funding account)
 * This is a SECONDARY operation (button on dashboard)
 */
export async function GET() {
  try {
    const privateKey = process.env.FEEMASTER_PRIVATE_KEY;
    
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Feemaster account not set up. Run setup first.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      privateKey,
      warning: '⚠️ Keep this private key secure. Never share it.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get private key' },
      { status: 500 }
    );
  }
}

