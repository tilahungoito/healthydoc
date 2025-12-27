import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
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
    // Verify authentication (supports both Better Auth for web and Firebase for mobile)
    const authResult = await verifyAuth(request);

    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to delete health records' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const body = await request.json();
    const { recordIds } = body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { error: 'No record IDs provided' },
        { status: 400 }
      );
    }

    // Verify all records belong to the user
    const records = await prisma.healthRecord.findMany({
      where: {
        id: { in: recordIds },
        userId: userId,
      },
      select: {
        id: true,
      },
    });

    const validRecordIds = records.map((r) => r.id);

    if (validRecordIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found to delete' },
        { status: 404 }
      );
    }

    // Delete the records
    const deleteResult = await prisma.healthRecord.deleteMany({
      where: {
        id: { in: validRecordIds },
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} record(s)`,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error('Error deleting health records:', error);
    return NextResponse.json(
      { error: 'Failed to delete health records' },
      { status: 500 }
    );
  }
}




