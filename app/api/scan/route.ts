import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { AIClient } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (supports both Better Auth and Firebase)
    // Note: This endpoint allows unauthenticated access, but you can require auth if needed
    const authResult = await verifyAuth(request);
    
    // Optional: Require authentication for scan analysis
    // if (!authResult.userId) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    let body: any;
    try {
      body = await request.json();
    } catch {
      // Handle malformed JSON to avoid 500s and give a clear 400 response
      const raw = await request.text();
      return NextResponse.json(
        { error: 'Invalid JSON body', received: raw },
        { status: 400 }
      );
    }

    const { scanDescription, scanType } = body ?? {};

    if (!scanDescription || !scanType) {
      return NextResponse.json(
        { error: 'Scan description and type are required' },
        { status: 400 }
      );
    }

    const client = new AIClient();
    const analysis = await client.analyzeBodyScan(scanDescription, scanType);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in scan route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze scan' },
      { status: 500 }
    );
  }
}

