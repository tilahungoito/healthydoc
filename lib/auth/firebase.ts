import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App | null = null;

/**
 * Validate that a private key looks like a valid PEM format
 */
function isValidPrivateKey(privateKey: string): boolean {
  if (!privateKey || typeof privateKey !== 'string') {
    return false;
  }
  
  // Check if it looks like a PEM private key
  // Should start with -----BEGIN and contain PRIVATE KEY
  const trimmed = privateKey.trim();
  const isPEMFormat = 
    trimmed.startsWith('-----BEGIN') && 
    trimmed.includes('PRIVATE KEY') &&
    trimmed.endsWith('-----');
  
  // Check if it's not obviously a placeholder
  const isPlaceholder = 
    privateKey.includes('HHHkjkriefksdflsdfjheidfh') ||
    privateKey.includes('your_') ||
    privateKey.length < 100; // Real private keys are much longer
  
  return isPEMFormat && !isPlaceholder;
}

export function initializeFirebaseAdmin() {
  // Always check if app already exists first - reuse it
  try {
    const existingApps = admin.apps;
    if (existingApps.length > 0) {
      firebaseAdmin = existingApps[0] as admin.app.App;
      console.log('[Firebase Admin] Reusing existing app instance');
      return firebaseAdmin;
    }
  } catch (error) {
    // No existing app, continue to initialize
  }

  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  // Check if Firebase credentials are provided
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  // Option 1: Use service account credentials (recommended for production)
  if (firebaseProjectId && firebasePrivateKey && firebaseClientEmail) {
    // Validate private key format before attempting initialization
    if (!isValidPrivateKey(firebasePrivateKey)) {
      console.warn('[Firebase Admin] Invalid or placeholder private key detected. Skipping service account initialization.');
      console.warn('[Firebase Admin] Please set FIREBASE_PRIVATE_KEY to a valid PEM-formatted private key from Firebase Console.');
      // Fall through to default credentials
    } else {
      try {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseProjectId,
            privateKey: firebasePrivateKey,
            clientEmail: firebaseClientEmail,
          }),
        });
        console.log('[Firebase Admin] Initialized with service account credentials');
        return firebaseAdmin;
      } catch (error: any) {
        // If app already exists, get it
        if (error.code === 'app/invalid-app-options' || error.code === 'app/duplicate-app') {
          try {
            firebaseAdmin = admin.app();
            console.log('[Firebase Admin] Reusing existing app instance');
            return firebaseAdmin;
          } catch (getAppError) {
            console.error('[Firebase Admin] Error getting existing app:', getAppError);
          }
        }
        console.error('[Firebase Admin] Failed to initialize with service account:', error.message || error);
        // Fall through to default credentials
      }
    }
  }

  // Option 2: Use default credentials (for local development with Firebase emulator)
  // This will use Application Default Credentials (ADC)
  try {
    firebaseAdmin = admin.initializeApp({
      projectId: firebaseProjectId || 'default-project',
    });
    console.log('[Firebase Admin] Initialized with default credentials');
    return firebaseAdmin;
  } catch (error: any) {
    // If app already exists, get it
    if (error.code === 'app/invalid-app-options' || error.code === 'app/duplicate-app') {
      try {
        firebaseAdmin = admin.app();
        console.log('[Firebase Admin] Reusing existing app instance');
        return firebaseAdmin;
      } catch (getAppError) {
        console.error('[Firebase Admin] Error getting existing app:', getAppError);
      }
    }
    console.warn('[Firebase Admin] Failed to initialize:', error);
    console.warn('[Firebase Admin] Firebase token verification will be disabled');
    return null;
  }
}

/**
 * Verify a Firebase ID token and return the decoded token
 * @param idToken - The Firebase ID token from the Authorization header
 * @returns Decoded token with user information, or null if verification fails
 */
export async function verifyFirebaseToken(
  idToken: string
): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('[Firebase Admin] Firebase Admin not initialized, cannot verify token');
      return null;
    }

    const decodedToken = await admin.auth(app).verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('[Firebase Admin] Token verification failed:', error.message);
    return null;
  }
}

/**
 * Get user ID from Firebase token
 * @param idToken - The Firebase ID token
 * @returns User ID (uid) or null if verification fails
 */
export async function getFirebaseUserId(idToken: string): Promise<string | null> {
  const decodedToken = await verifyFirebaseToken(idToken);
  return decodedToken?.uid || null;
}

/**
 * Get Firebase user record with full details (name, picture, etc.)
 * @param uid - Firebase user UID
 * @returns Firebase user record or null if not found
 */
export async function getFirebaseUser(uid: string): Promise<admin.auth.UserRecord | null> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('[Firebase Admin] Firebase Admin not initialized, cannot get user');
      return null;
    }

    const userRecord = await admin.auth(app).getUser(uid);
    return userRecord;
  } catch (error: any) {
    // Check for credential-related errors
    if (error.message?.includes('DECODER routines') || 
        error.message?.includes('OAuth2 access token') ||
        error.message?.includes('credential')) {
      console.error('[Firebase Admin] Credential error getting user. Please check your FIREBASE_PRIVATE_KEY is valid.');
      console.error('[Firebase Admin] Error details:', error.message);
    } else {
      console.error('[Firebase Admin] Error getting user:', error.message || error);
    }
    return null;
  }
}

