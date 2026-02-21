/**
 * Environment validation script
 * Run this on app startup to verify Firebase config
 *
 * Note: Next.js only supports static access to process.env (e.g. process.env.NEXT_PUBLIC_X).
 * Dynamic access like process.env[varName] does NOT work on client-side.
 */

export const validateFirebaseEnv = () => {
  // Must use direct static access for Next.js client-side compatibility
  const envMap: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const missingVars = Object.entries(envMap)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(
      "❌ Missing Firebase environment variables:",
      missingVars.join(", ")
    );
    console.error(
      "\n📋 How to fix:\n1. Copy .env.local.example to .env.local\n2. Ensure all Firebase credentials are filled\n3. Restart dev server\n"
    );
    throw new Error(
      `Missing Firebase config: ${missingVars.join(", ")}. See console for details.`
    );
  }

  // Environment variables validated successfully
};
