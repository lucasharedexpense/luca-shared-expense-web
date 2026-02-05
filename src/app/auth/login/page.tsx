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

// --- VALIDATION UTILS ---
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
export default function LoginPage() {
  const router = useRouter();
  
  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Error State
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Validation
  const validate = () => {
    let isValid = true;
    
    if (!email) {
        setEmailError("Email is required");
        isValid = false;
    } else if (!ValidationUtils.isValidEmail(email)) {
        setEmailError("Invalid email address");
        isValid = false;
    } else {
        setEmailError(null);
    }

    if (!password) {
        setPasswordError("Password is required");
        isValid = false;
    } else if (!ValidationUtils.isValidPassword(password)) {
        setPasswordError("Password must be at least 6 characters");
        isValid = false;
    } else {
        setPasswordError(null);
    }

    return isValid;
  };

  // Handle Login
  const handleLogin = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    setGlobalError(null);

    try {
        // --- SIMULATE LOGIN API ---
        console.log("Logging in with", email, password);
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay

        // SET COOKIE (PENTING untuk middleware)
        document.cookie = "luca_session=true; path=/; max-age=86400";

        // Success -> Redirect
        router.push("/home");

    } catch (err) {
        setGlobalError("Login failed. Please check your credentials.");
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-white px-8 py-6 max-w-md mx-auto relative">
      
      {/* 1. BACK BUTTON */}
      <div className="mb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-7 h-7 text-ui-black" />
        </button>
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto no-scrollbar">
        
        <h1 className="text-3xl font-bold font-display text-ui-black mb-2">
            Welcome Back!
        </h1>
        <p className="text-sm font-medium text-ui-dark-grey mb-10">
            Enter your email and password to log in.
        </p>

        <div className="flex flex-col gap-4">
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
        </div>

        {/* Global Error Banner */}
        {globalError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {globalError}
            </div>
        )}

        <div className="mt-12">
            <button 
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-12.5 bg-ui-accent-yellow text-ui-black font-bold text-sm rounded-full hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Logging in...
                    </>
                ) : (
                    "Log in"
                )}
            </button>
        </div>

        <div className="mt-4 text-center">
            <p className="text-sm font-medium text-ui-black">
                Don't have an account?{" "}
                <button 
                    onClick={() => router.push("/auth/signup")}
                    className="text-ui-accent-yellow font-bold hover:underline"
                >
                    Sign Up.
                </button>
            </p>
        </div>

      </div>

      {/* 3. FOOTER */}
      <div className="mt-auto pt-6 text-center">
        <p className="text-xs font-semibold text-ui-black/60">
            Privacy Policy   ·   Terms of Service
        </p>
      </div>

    </div>
  );
}