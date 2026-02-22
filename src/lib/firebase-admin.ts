/**
 * Firebase Admin SDK — Server-side Singleton
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  // Project ID boleh public, tapi Email dan Private Key ambil dari variabel rahasia
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [
      !projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `[firebase-admin] Missing required environment variables: ${missing}. ` +
        `Make sure these are set in your Vercel project settings (Settings → Environment Variables).`,
    );
  }

  // Bersihkan tanda kutip bawaan .env dan pastikan \n menjadi baris baru
  const cleanPrivateKey = privateKey.replace(/"/g, "").replace(/\\n/g, "\n");

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: cleanPrivateKey,
    }),
  });

  return getFirestore();
}

/** Server-side Firestore instance (firebase-admin). */
export const adminDb = initAdmin();