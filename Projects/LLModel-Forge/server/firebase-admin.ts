/**
 * Firebase Admin SDK Configuration
 *
 * For production, set FIREBASE_ADMIN_SDK environment variable to the path
 * of your Firebase Admin SDK JSON file, or set individual environment variables.
 */

import admin from "firebase-admin";

// Initialize Firebase Admin
let firebaseApp: admin.app.App | null = null;

export function initializeFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  try {
    // Option 1: Use service account JSON file path
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK;

    // Option 2: Use individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountPath) {
      // Initialize with service account file
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log("✅ Firebase Admin initialized with service account file");
    } else if (projectId && clientEmail && privateKey) {
      // Initialize with environment variables
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log("✅ Firebase Admin initialized with environment variables");
    } else {
      // Initialize with application default credentials (for local development)
      console.warn("⚠️ Firebase Admin SDK not configured. OAuth features will be limited.");
      console.warn("   Set FIREBASE_ADMIN_SDK or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
      return null;
    }

    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
    return null;
  }
}

// Verify Firebase ID token
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    if (!firebaseApp) {
      initializeFirebaseAdmin();
    }

    if (!firebaseApp) {
      console.warn("Firebase Admin not initialized, cannot verify token");
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}

// Get user by Firebase UID
export async function getFirebaseUser(uid: string): Promise<admin.auth.UserRecord | null> {
  try {
    if (!firebaseApp) return null;
    return await admin.auth().getUser(uid);
  } catch (error) {
    console.error("Error getting Firebase user:", error);
    return null;
  }
}

// Create custom token for user
export async function createCustomToken(uid: string, claims?: object): Promise<string | null> {
  try {
    if (!firebaseApp) return null;
    return await admin.auth().createCustomToken(uid, claims);
  } catch (error) {
    console.error("Error creating custom token:", error);
    return null;
  }
}

export { admin };
export default {
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  getFirebaseUser,
  createCustomToken,
};

