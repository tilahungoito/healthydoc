import { NextRequest, NextResponse } from 'next/server';
import { AIClient } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanDescription, scanType } = body;

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

