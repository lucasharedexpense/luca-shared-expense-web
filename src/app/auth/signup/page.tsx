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
import { LucaLogo } from "@/components/ui/Icons"; // Pastikan icon ini ada

// --- VALIDATION HELPER ---
const ValidationUtils = {
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isValidPassword: (password: string) => password.length >= 6
};

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
        setEmailError("Email is required");
        isValid = false;
    } else if (!ValidationUtils.isValidEmail(email)) {
        setEmailError("Invalid email address");
        isValid = false;
    } else {
        setEmailError(null);
    }

    // Password Validation
    if (!password) {
        setPasswordError("Password is required");
        isValid = false;
    } else if (!ValidationUtils.isValidPassword(password)) {
        setPasswordError("Password must be at least 6 characters");
        isValid = false;
    } else {
        setPasswordError(null);
    }

    // Confirm Password Validation
    if (confirmPassword !== password) {
        setConfirmError("Passwords do not match");
        isValid = false;
    } else {
        setConfirmError(null);
    }

    return isValid;
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    setGlobalError(null);

    try {
        // --- SIMULASI SIGN UP ---
        console.log("Signing up with", email, password);
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay

        // Jika ada logic OTP, redirect ke OTP page dengan membawa email
        // router.push(`/auth/otp?email=${encodeURIComponent(email)}`);
        
        // Tapi untuk sekarang langsung ke Home (anggap sukses)
        document.cookie = "luca_session=true; path=/; max-age=86400"; // Set Cookie
        router.push("/auth/fill-profile"); // Usually fill profile after signup

    } catch (err) {
        setGlobalError("Sign up failed. Please try again.");
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-white px-8 py-6 max-w-md mx-auto relative">
      
      {/* 1. LOADING BAR OVERLAY */}
      {isLoading && (
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

        {/* SUBMIT BUTTON */}
        <div>
            <button 
                onClick={handleSignUp}
                disabled={isLoading}
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