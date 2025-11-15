import { NextRequest, NextResponse } from 'next/server';
import { HealthAnalyzer } from '@/lib/ai/health-analyzer';
import { UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput, additionalContext, language } = body;

    if (!userInput) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      );
    }

    const analyzer = new HealthAnalyzer();
    const analysis = await analyzer.analyzeUserInput(
      userInput,
      additionalContext as UserProfile,
      language || 'en'
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error in analyze route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500 }
    );
  }
}

