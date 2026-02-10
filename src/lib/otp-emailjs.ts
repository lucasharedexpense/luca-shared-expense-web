import emailjs from "@emailjs/browser";

// ============================================================================
// EMAILJS CONFIGURATION
// ============================================================================

const EMAILJS_SERVICE_ID = "service_5htnm6l";
const EMAILJS_TEMPLATE_ID = "template_ecpplv9";
const EMAILJS_PUBLIC_KEY = "5c07CTBPmjbXOFhKJ";

// ============================================================================
// OTP CONFIGURATION
// ============================================================================

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 menit
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 detik cooldown resend

// ============================================================================
// OTP STORE (In-Memory, Client-Side)
// ============================================================================

interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

// Simpan OTP record di memory (per session)
let currentOtp: OtpRecord | null = null;

// ============================================================================
// GENERATE OTP
// ============================================================================

const generateOtpCode = (): string => {
  // Generate random 6-digit OTP
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

// ============================================================================
// SEND OTP VIA EMAILJS
// ============================================================================

export const sendOtpEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Cek cooldown resend
    if (currentOtp && currentOtp.email === email) {
      const timeSinceLastSent = Date.now() - currentOtp.lastSentAt;
      if (timeSinceLastSent < OTP_RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastSent) / 1000);
        return {
          success: false,
          message: `Please wait ${remainingSeconds}s before requesting a new code.`,
        };
      }
    }

    // Generate OTP baru
    const otpCode = generateOtpCode();

    // Kirim via EmailJS
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        otp: otpCode,
      },
      { publicKey: EMAILJS_PUBLIC_KEY }
    );

    // Simpan OTP record
    currentOtp = {
      code: otpCode,
      email,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
      lastSentAt: Date.now(),
    };

    return { success: true, message: "OTP sent successfully!" };
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "text" in error
          ? String((error as Record<string, unknown>).text)
          : JSON.stringify(error);
    console.error("Failed to send OTP:", errMsg);
    return { success: false, message: `Failed to send OTP: ${errMsg}` };
  }
};

// ============================================================================
// VERIFY OTP
// ============================================================================

export const verifyOtp = (
  email: string,
  inputCode: string
): { success: boolean; message: string } => {
  // Cek apakah ada OTP record
  if (!currentOtp || currentOtp.email !== email) {
    return { success: false, message: "No OTP found. Please request a new one." };
  }

  // Cek expired
  if (Date.now() > currentOtp.expiresAt) {
    currentOtp = null;
    return { success: false, message: "OTP has expired. Please request a new one." };
  }

  // Cek max attempts
  if (currentOtp.attempts >= OTP_MAX_ATTEMPTS) {
    currentOtp = null;
    return { success: false, message: "Too many attempts. Please request a new OTP." };
  }

  // Increment attempts
  currentOtp.attempts += 1;

  // Verify code
  if (currentOtp.code === inputCode) {
    currentOtp = null; // Clear setelah sukses
    return { success: true, message: "Email verified successfully!" };
  }

  const remaining = OTP_MAX_ATTEMPTS - currentOtp.attempts;
  return {
    success: false,
    message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
  };
};

// ============================================================================
// HELPER: GET RESEND COOLDOWN REMAINING
// ============================================================================

export const getResendCooldownRemaining = (email: string): number => {
  if (!currentOtp || currentOtp.email !== email) return 0;
  const elapsed = Date.now() - currentOtp.lastSentAt;
  const remaining = OTP_RESEND_COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

// ============================================================================
// CLEAR OTP (untuk cleanup)
// ============================================================================

export const clearOtp = (): void => {
  currentOtp = null;
};
