import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyFirebaseToken, getFirebaseUserId, getFirebaseUser } from './firebase';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export interface AuthResult {
  userId: string | null;
  email: string | null;
  authMethod: 'better-auth' | 'firebase' | null;
  decodedToken?: any;
}

/**
 * Ensure a user exists in the database, creating them if they don't exist
 * This handles both Better Auth users (who may already exist) and Firebase users (who need to be created)
 */
async function ensureUserExists(
  userId: string,
  email: string | null,
  name?: string | null,
  image?: string | null,
  emailVerified?: boolean
): Promise<string> {
  try {
    // First, if we have an email, try to reuse any existing account by email.
    // This links Firebase users (uid) to an existing Better Auth account so history is shared.
    if (email) {
      const existingByEmail = await prisma.user.findFirst({
        where: { email },
      });

      if (existingByEmail) {
        // Optionally refresh profile details
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            name: name ?? existingByEmail.name,
            image: image ?? existingByEmail.image,
            emailVerified: emailVerified ?? existingByEmail.emailVerified,
            updatedAt: new Date(),
          },
        });
        return existingByEmail.id;
      }
    }

    // Try to find existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      // User exists, update if needed
      if (email && existingUser.email !== email) {
        await prisma.user.update({
          where: { id: userId },
          data: { email, updatedAt: new Date() },
        });
      }
      return userId;
    }

    // User doesn't exist, create them
    if (!email) {
      throw new Error('Email is required to create a new user');
    }

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        name: name || null,
        image: image || null,
        emailVerified: emailVerified ?? false,
      },
    });

    console.log(`[Auth] Created new user in database: ${userId} (${email})`);
    return newUser.id;
  } catch (error: any) {
    // If user was created between our check and create, that's fine
    if (error.code === 'P2002') {
      // Unique constraint violation - user was created by another request
      console.log(`[Auth] User ${userId} already exists (race condition)`);
      return userId;
    }
    console.error('[Auth] Error ensuring user exists:', error);
    throw error;
  }
}

/**
 * Verify authentication from either Better Auth session or Firebase ID token
 * This allows both web (Better Auth) and mobile (Firebase) clients to access the API
 * Automatically ensures users exist in the database for both auth providers
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  // Try Better Auth first (for web clients)
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    } as any);

    if (session?.user?.id) {
      // Better Auth users should already exist, but ensure they do
      const userId = await ensureUserExists(
        session.user.id,
        session.user.email || null,
        session.user.name || null,
        session.user.image || null,
        session.user.emailVerified || false
      );

      return {
        userId,
        email: session.user.email || null,
        authMethod: 'better-auth',
        decodedToken: session,
      };
    }
  } catch (error) {
    // Better Auth failed, try Firebase
    console.log('[Auth] Better Auth session not found, trying Firebase...');
  }

  // Try Firebase token (for mobile clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decodedToken = await verifyFirebaseToken(token);
      if (decodedToken) {
        // Fetch full user record from Firebase to get name and picture
        let firebaseUser = null;
        try {
          firebaseUser = await getFirebaseUser(decodedToken.uid);
        } catch (error) {
          console.log('[Auth] Could not fetch Firebase user record, using token data only');
        }

        // Firebase users need to be created in the database
        // Use Firebase UID as the user ID, and extract user info from Firebase user record or token
        const userId = await ensureUserExists(
          decodedToken.uid,
          decodedToken.email || firebaseUser?.email || null,
          firebaseUser?.displayName || decodedToken.name || null,
          firebaseUser?.photoURL || decodedToken.picture || null,
          decodedToken.email_verified || firebaseUser?.emailVerified || false
        );

        return {
          userId,
          email: decodedToken.email || firebaseUser?.email || null,
          authMethod: 'firebase',
          decodedToken,
        };
      }
    } catch (error) {
      console.error('[Auth] Firebase token verification failed:', error);
    }
  }

  // No valid authentication found
  return {
    userId: null,
    email: null,
    authMethod: null,
  };
}

/**
 * Middleware helper to require authentication
 * Returns the user ID if authenticated, or throws an error response
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.userId) {
    throw new Error('UNAUTHORIZED');
  }
  
  return authResult;
}

