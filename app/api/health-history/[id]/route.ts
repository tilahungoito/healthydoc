import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    } as any);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to delete health records' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const recordId = params.id;

    // Verify the record belongs to the user
    const record = await prisma.healthRecord.findFirst({
      where: {
        id: recordId,
        userId: userId,
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete the record
    await prisma.healthRecord.delete({
      where: {
        id: recordId,
      },
    });

    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting health record:', error);
    return NextResponse.json(
      { error: 'Failed to delete health record' },
      { status: 500 }
    );
  }
}




