"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LucaLogo } from "@/components/ui/Icons";
import { signInWithGoogle } from "@/lib/firebase-auth";
import { AlertCircle } from "lucide-react";

// --- COMPONENT: SOCIAL BUTTON ---
const SocialButton = ({ text, icon, onClick, disabled }: { text: string, icon: React.ReactNode, onClick: () => void, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full h-12.5 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-all group disabled:opacity-70 disabled:cursor-not-allowed"
  >
    <div className="w-6 h-6 mr-3 flex items-center justify-center">
      {icon}
    </div>
    <span className="text-sm font-bold text-ui-black">{text}</span>
  </button>
);

// --- MAIN PAGE ---
export default function GreetingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- HANDLERS ---
  
  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      
      // Set session cookie agar middleware tahu user sudah login
      document.cookie = "luca_session=true; path=/; max-age=604800"; // 7 hari
      
      // Cek apakah user baru
      const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
      
      if (isNewUser) {
         router.push("/auth/fill-profile");
      } else {
         router.push("/home");
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg !== "__CANCELLED_POPUP__") {
        // Show error while button is still disabled
        setErrorMsg(msg);
        // Re-enable button & dismiss after 2s
        setTimeout(() => {
          setErrorMsg(null);
          setIsLoading(false);
        }, 2000);
      } else {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-white relative overflow-hidden">
      
      {/* Loading Indicator Overlay */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden z-50">
            <div className="h-full bg-ui-accent-yellow animate-progress-indeterminate origin-left" />
        </div>
      )}

      <div className="flex-1 flex flex-col px-8 py-6 max-w-md mx-auto w-full h-full">
        
        {/* 1. TOP SPACER (Biar konten agak ke tengah vertikal) */}
        <div className="flex-1" />

        {/* 2. HEADER SECTION */}
        <div className="flex flex-col items-center text-center">
            <div className="w-15 h-15 mb-4" onClick={() => router.push("/home")}>
                <LucaLogo className="w-full h-full" />
            </div>
            
            <h1 className="text-3xl font-bold font-display text-ui-black mb-2">
                Welcome to Luca!
            </h1>
            <p className="text-base font-medium text-ui-dark-grey">
                Splitting bills made easy.
            </p>
        </div>

        {/* 3. MIDDLE SPACER */}
        <div className="flex-[0.4]" />

        {/* 4. ACTION BUTTONS */}
        <div className="flex flex-col gap-3 w-full">
            {/* Sign Up Button */}
            <button 
                onClick={() => router.push("/auth/signup")}
                className="w-full h-12.5 bg-ui-accent-yellow text-ui-black font-bold text-sm rounded-full hover:brightness-105 active:scale-[0.98] transition-all shadow-sm"
            >
                Sign Up
            </button>

            {/* Login Button */}
            <button 
                onClick={() => router.push("/auth/login")}
                className="w-full h-12.5 bg-transparent border border-ui-accent-yellow text-ui-black font-bold text-sm rounded-full hover:bg-ui-accent-yellow/5 active:scale-[0.98] transition-all"
            >
                Log in
            </button>
        </div>

        {/* 5. DIVIDER */}
        <div className="flex items-center gap-4 my-6 w-full">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-sm font-medium text-ui-dark-grey">or</span>
            <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Error Message */}
        {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2 animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
            </div>
        )}

        {/* 6. SOCIAL BUTTON */}
        <SocialButton 
            text="Continue with Google"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            icon={
                // Google Icon SVG
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.489 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" />
                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                    </g>
                </svg>
            }
        />

        {/* 7. BOTTOM SPACER */}
        <div className="flex-[0.8]" />

        {/* 8. FOOTER */}
        <div className="text-center pb-4">
            <p className="text-xs font-semibold text-ui-black/60">
                <span className="hover:underline cursor-pointer">Privacy Policy</span>
                <span className="mx-2">·</span>
                <span className="hover:underline cursor-pointer">Terms of Service</span>
            </p>
        </div>

      </div>
    </div>
  );
}