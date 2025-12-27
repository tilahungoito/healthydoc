import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { AIClient } from '@/lib/ai/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (supports both Better Auth and Firebase)
    const authResult = await verifyAuth(request);

    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to start consultation' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const sessionId = `consultation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const initialMessage = "Hello! I'm your AI doctor. How can I help you today? Please describe your symptoms or health concerns in detail.";

    return NextResponse.json({
      sessionId,
      initialMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error starting consultation:', error);
    return NextResponse.json(
      { error: 'Failed to start consultation' },
      { status: 500 }
    );
  }
}

