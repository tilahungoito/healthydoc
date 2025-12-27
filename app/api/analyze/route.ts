import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { HealthAnalyzer } from '@/lib/ai/health-analyzer';
import { UserProfile, HealthAnalysis } from '@/types';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function POST(request: NextRequest) {
  try {
    // Add CORS headers for mobile app
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const body = await request.json();
    const { userInput, additionalContext, language } = body;

    if (!userInput) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400, headers }
      );
    }

    // Verify authentication (supports both Better Auth and Firebase)
    const authResult = await verifyAuth(request);

    const analyzer = new HealthAnalyzer();
    const analysis = await analyzer.analyzeUserInput(
      userInput,
      additionalContext as UserProfile,
      language || 'en'
    );

    // Save health record if user is authenticated (not guest mode)
    // Note: For Firebase users, we'll use their Firebase UID as the userId
    // You may want to create a mapping table to link Firebase UIDs to your user records
    if (authResult.userId) {
      try {
        // Extract symptoms from the analysis or user input
        const symptoms = analysis.extracted_symptoms?.join(', ') || 
                        analysis.possible_conditions?.map((c: any) => c.name).join(', ') ||
                        userInput.substring(0, 200); // Fallback to first 200 chars of input

        // For Firebase users, use their Firebase UID
        // For Better Auth users, use their user ID
        // Note: You may need to create a user mapping if your schema requires integer IDs
        await prisma.healthRecord.create({
          data: {
            userId: authResult.userId,
            symptoms: symptoms,
            userInput: userInput,
            aiResult: analysis as any,
            modelVersion: 'v1',
          },
        });
      } catch (dbError) {
        // Log error but don't fail the request if saving fails
        console.error('Error saving health record:', dbError);
      }
    }

    return NextResponse.json(analysis, { headers });
  } catch (error) {
    console.error('Error in analyze route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze symptoms' },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

