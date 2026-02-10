"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { LucaLogo } from "@/components/ui/Icons";
import { sendOtpEmail, verifyOtp, getResendCooldownRemaining } from "@/lib/otp-emailjs";

// ============================================================================
// OTP INPUT COMPONENT
// ============================================================================

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
}

const OtpInput = ({ length, value, onChange, disabled, error, success }: OtpInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    // Hanya angka
    if (char && !/^\d$/.test(char)) return;
    
    const newValue = value.split("");
    newValue[index] = char;
    const joined = newValue.join("").slice(0, length);
    onChange(joined);

    // Auto-focus ke input berikutnya
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    // Focus ke input terakhir yang terisi
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const getBorderColor = () => {
    if (success) return "border-green-400 bg-green-50";
    if (error) return "border-red-400 bg-red-50";
    return "border-gray-200 focus-within:border-ui-accent-yellow";
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all duration-200 ${getBorderColor()} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${success ? "text-green-600" : error ? "text-red-500" : "text-ui-black"}`}
        />
      ))}
    </div>
  );
};

// ============================================================================
// MAIN PAGE: VERIFY EMAIL
// ============================================================================

export default function VerifyEmailPage() {
  const router = useRouter();

  // Ambil email & password dari sessionStorage
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP state
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isInitialSend, setIsInitialSend] = useState(true);

  // Feedback state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0);

  // Guard agar OTP hanya dikirim sekali (React Strict Mode double-mount)
  const hasSentInitialOtp = useRef(false);

  // ========== INIT: Ambil data dari sessionStorage & kirim OTP pertama ==========
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("otp_email");
    const storedPassword = sessionStorage.getItem("otp_password");

    if (!storedEmail || !storedPassword) {
      // Kalau ga ada data, redirect balik ke signup
      router.replace("/auth/signup");
      return;
    }

    setEmail(storedEmail);
    setPassword(storedPassword);

    // Kirim OTP pertama kali (hanya sekali)
    if (!hasSentInitialOtp.current) {
      hasSentInitialOtp.current = true;
      handleSendOtp(storedEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== COOLDOWN TIMER ==========
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ========== SEND OTP ==========
  const handleSendOtp = useCallback(async (targetEmail?: string) => {
    const emailToSend = targetEmail || email;
    if (!emailToSend) return;

    setIsSending(true);
    setError(null);

    const result = await sendOtpEmail(emailToSend);

    if (result.success) {
      // Set cooldown
      const remaining = getResendCooldownRemaining(emailToSend);
      setCooldown(remaining > 0 ? remaining : 60);
      setIsInitialSend(false);
    } else {
      setError(result.message);
    }

    setIsSending(false);
  }, [email]);

  // ========== VERIFY OTP ==========
  const handleVerify = useCallback(async () => {
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = verifyOtp(email, otpValue);

    if (result.success) {
      setSuccess(true);

      // OTP terverifikasi → Lanjut proses signup Firebase
      try {
        const { signUpWithEmail } = await import("@/lib/firebase-auth");
        await signUpWithEmail(email, password);

        // Set session cookie agar middleware tahu user sudah login
        document.cookie = "luca_session=true; path=/; max-age=604800"; // 7 hari

        // Bersihkan sessionStorage
        sessionStorage.removeItem("otp_email");
        sessionStorage.removeItem("otp_password");

        // Redirect ke fill-profile
        setTimeout(() => {
          router.push("/auth/fill-profile");
        }, 1000);
      } catch (signupError) {
        const errorMessage = signupError instanceof Error ? signupError.message : "Sign up failed.";
        setError(errorMessage);
        setSuccess(false);
        setIsVerifying(false);
      }
    } else {
      setError(result.message);
      setOtpValue("");
      setIsVerifying(false);
    }
  }, [otpValue, email, password, router]);

  // ========== AUTO-VERIFY saat 6 digit ter-isi ==========
  useEffect(() => {
    if (otpValue.length === 6 && !isVerifying && !success) {
      handleVerify();
    }
  }, [otpValue, isVerifying, success, handleVerify]);

  // ========== MASK EMAIL ==========
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local}@${domain}`;
    return `${local[0]}${"•".repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}@${domain}`;
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-white px-8 py-6 max-w-md mx-auto relative">

      {/* LOADING BAR */}
      {(isVerifying || isSending) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden z-50">
          <div className="h-full bg-ui-accent-yellow animate-[progress-indeterminate_1.5s_ease-in-out_infinite] origin-left" 
               style={{ animation: "progress-indeterminate 1.5s ease-in-out infinite" }} />
        </div>
      )}

      {/* BACK BUTTON */}
      <div className="mb-4">
        <button
          onClick={() => {
            sessionStorage.removeItem("otp_email");
            sessionStorage.removeItem("otp_password");
            router.push("/auth/signup");
          }}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-7 h-7 text-ui-black" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto no-scrollbar">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-ui-black mb-1">
              Verify Your Email
            </h1>
            <p className="text-sm font-medium text-ui-dark-grey">
              We sent a verification code to
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Mail className="w-4 h-4 text-ui-accent-yellow" />
              <p className="text-sm font-bold text-ui-black">{maskEmail(email)}</p>
            </div>
          </div>
          <div className="w-8.5 h-8.5">
            <LucaLogo className="w-full h-full" />
          </div>
        </div>

        {/* OTP INPUT */}
        <div className="mb-6">
          <OtpInput
            length={6}
            value={otpValue}
            onChange={setOtpValue}
            disabled={isVerifying || success}
            error={!!error}
            success={success}
          />
        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-600 font-medium flex items-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4" />
            Email verified! Creating your account...
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && !success && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2 animate-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* VERIFY BUTTON */}
        <button
          onClick={handleVerify}
          disabled={otpValue.length !== 6 || isVerifying || success}
          className="w-full h-12.5 bg-ui-accent-yellow text-ui-black font-bold text-sm rounded-full hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm mb-4"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Verified!
            </>
          ) : (
            "Verify Email"
          )}
        </button>

        {/* RESEND OTP */}
        <div className="text-center mt-2">
          <p className="text-sm text-ui-dark-grey font-medium mb-2">
            Didn&apos;t receive the code?
          </p>
          <button
            onClick={() => handleSendOtp()}
            disabled={cooldown > 0 || isSending || success}
            className="text-sm font-bold text-ui-accent-yellow hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Resend in {cooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Resend Code
              </>
            )}
          </button>
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-auto pt-6 text-center">
        <p className="text-xs font-semibold text-ui-black/60">
          Privacy Policy &nbsp;·&nbsp; Terms of Service
        </p>
      </div>

      {/* INLINE KEYFRAMES for progress bar */}
      <style jsx>{`
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%) scaleX(0.3); }
          40% { transform: translateX(0%) scaleX(0.5); }
          100% { transform: translateX(100%) scaleX(0.3); }
        }
      `}</style>
    </div>
  );
}
