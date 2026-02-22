"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { LucaLogo } from "@/components/ui/Icons";
import { signInWithGoogle } from "@/lib/firebase-auth";
import { validateEmail, getPasswordError, getConfirmPasswordError } from "@/lib/validation";

// --- COMPONENT: CUSTOM INPUT FORM ---
interface CustomInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  isPassword?: boolean;
  error?: string | null;
}

const CustomInputForm = ({ 
  value, 
  onChange, 
  placeholder, 
  icon, 
  isPassword = false, 
  error 
}: CustomInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="w-full flex flex-col gap-1">
        <div className={`w-full h-12.5 bg-ui-grey/50 rounded-full flex items-center px-6 transition-all border ${
            error ? "border-red-400 bg-red-50" : "border-transparent focus-within:border-ui-accent-yellow"
        }`}>
            {/* Left Icon */}
            <div className={`mr-3 ${error ? "text-red-400" : "text-ui-black"}`}>
                {icon}
            </div>

            {/* Input Field */}
            <input 
                type={isPassword && !isPasswordVisible ? "password" : "text"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent outline-none text-sm font-medium text-ui-black placeholder:text-ui-black/50"
            />

            {/* Right Icon (Password Toggle) */}
            {isPassword && (
                <button 
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="ml-3 text-ui-black hover:text-gray-600 focus:outline-none"
                    type="button"
                >
                    {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            )}
        </div>

        {/* Error Message */}
        {error && (
            <p className="text-xs text-red-500 font-medium ml-4 flex items-center gap-1 animate-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" /> {error}
            </p>
        )}
    </div>
  );
};

// --- MAIN PAGE ---
export default function SignUpPage() {
  const router = useRouter();
  
  // State Input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // State Error
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Validation Logic
  const validate = () => {
    let isValid = true;
    
    // Email Validation
    if (!email) {
        setEmailError("Email tidak boleh kosong");
        isValid = false;
    } else if (!validateEmail(email)) {
        setEmailError("Format email tidak valid");
        isValid = false;
    } else {
        setEmailError(null);
    }

    // Password Validation
    const pwError = getPasswordError(password);
    if (pwError) {
        setPasswordError(pwError);
        isValid = false;
    } else {
        setPasswordError(null);
    }

    // Confirm Password Validation
    const confirmErr = getConfirmPasswordError(password, confirmPassword);
    if (confirmErr) {
        setConfirmError(confirmErr);
        isValid = false;
    } else {
        setConfirmError(null);
    }

    return isValid;
  };

  // Handle Sign Up → Redirect ke halaman verifikasi OTP
  const handleSignUp = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    setGlobalError(null);

    try {
        // Cek dulu apakah email sudah terdaftar di Firebase
        const { fetchSignInMethodsForEmail } = await import("firebase/auth");
        const { auth } = await import("@/lib/firebase");
        const methods = await fetchSignInMethodsForEmail(auth, email);
        
        if (methods.length > 0) {
          setGlobalError("Email already in use. Please use a different email.");
          setIsLoading(false);
          return;
        }
    }  catch (error) {
        // fetchSignInMethods bisa error di beberapa config Firebase, skip saja
    }

    try {
        // Simpan email & password di sessionStorage untuk dipakai setelah OTP verified
        sessionStorage.setItem("otp_email", email);
        sessionStorage.setItem("otp_password", password);

        // Redirect ke halaman verifikasi email
        router.push("/auth/verify-email");

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Sign up failed. Please try again.";
        setGlobalError(errorMessage);
        setIsLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isLoading) return;
    setIsGoogleLoading(true);
    setGlobalError(null);
    try {
        const user = await signInWithGoogle();
        document.cookie = "luca_session=true; path=/; max-age=604800";
        const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
        router.push(isNewUser ? "/auth/fill-profile" : "/home");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Google sign-up failed. Please try again.";
        if (!errorMessage.includes("cancelled") && !errorMessage.includes("closed-by-user")) {
          setGlobalError(errorMessage);
        }
        setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-white px-8 py-6 max-w-md mx-auto relative">
      
      {/* 1. LOADING BAR OVERLAY */}
      {(isLoading || isGoogleLoading) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden z-50">
            <div className="h-full bg-ui-accent-yellow animate-progress-indeterminate origin-left" />
        </div>
      )}

      {/* 2. BACK BUTTON */}
      <div className="mb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-7 h-7 text-ui-black" />
        </button>
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto no-scrollbar">
        
        {/* HEADER: Title & Logo */}
        <div className="flex justify-between items-start mb-10">
            <div>
                <h1 className="text-3xl font-bold font-display text-ui-black mb-1">
                    Welcome to Luca!
                </h1>
                <p className="text-sm font-medium text-ui-dark-grey">
                    Splitting bills made easy.
                </p>
            </div>
            <div className="w-8.5 h-8.5">
                <LucaLogo className="w-full h-full" />
            </div>
        </div>

        {/* FORM INPUTS */}
        <div className="flex flex-col gap-4 mb-8">
            <CustomInputForm 
                value={email}
                onChange={(val) => { setEmail(val); setEmailError(null); }}
                placeholder="Email Address"
                icon={<Mail className="w-4 h-4" />}
                error={emailError}
            />

            <CustomInputForm 
                value={password}
                onChange={(val) => { setPassword(val); setPasswordError(null); }}
                placeholder="Password"
                icon={<Lock className="w-4 h-4" />}
                isPassword={true}
                error={passwordError}
            />

            <CustomInputForm 
                value={confirmPassword}
                onChange={(val) => { setConfirmPassword(val); setConfirmError(null); }}
                placeholder="Confirm Password"
                icon={<Lock className="w-4 h-4" />}
                isPassword={true}
                error={confirmError}
            />
        </div>

        {/* Global Error Banner */}
        {globalError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {globalError}
            </div>
        )}

        {/* SUBMIT BUTTON & GOOGLE SIGN UP */}
        <div className="flex flex-col gap-3">
            <button 
                onClick={handleSignUp}
                disabled={isLoading || isGoogleLoading}
                className="w-full h-12.5 bg-ui-accent-yellow text-ui-black font-bold text-sm rounded-full hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                    </>
                ) : (
                    "Continue"
                )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google Sign Up */}
            <button 
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full h-12.5 bg-white border-2 border-gray-200 text-ui-black font-bold text-sm rounded-full hover:border-gray-300 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
                {isGoogleLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing up...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign up with Google
                    </>
                )}
            </button>
        </div>

        {/* Login Link */}
        <div className="mt-8 text-center">
            <p className="text-sm font-medium text-ui-black">
                Already have an account?{" "}
                <button 
                    onClick={() => router.push("/auth/login")}
                    className="text-ui-accent-yellow font-bold hover:underline"
                >
                    Log In.
                </button>
            </p>
        </div>

      </div>

      {/* 4. FOOTER */}
      <div className="mt-auto pt-6 text-center">
        <p className="text-xs font-semibold text-ui-black/60">
            Privacy Policy   ·   Terms of Service
        </p>
      </div>

    </div>
  );
}