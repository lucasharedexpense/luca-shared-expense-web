/**
 * Environment validation script
 * Run this on app startup to verify Firebase config
 */

export const validateFirebaseEnv = () => {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

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

  console.log("✅ Firebase environment variables loaded successfully");
};
