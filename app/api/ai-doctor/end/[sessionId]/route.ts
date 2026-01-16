import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { clearContext } from '@/lib/ai-doctor/context';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  try {
    // Verify authentication (supports both Better Auth and Firebase)
    const authResult = await verifyAuth(request);

    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const { sessionId } = resolvedParams;

    // Clear conversation context and receipt
    clearContext(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending consultation:', error);
    return NextResponse.json(
      { error: 'Failed to end consultation' },
      { status: 500 }
    );
  }
}

