/**
 * Validation utility functions migrated from Kotlin/Android
 */

// Regex patterns
const EMAIL_REGEX = /[a-zA-Z0-9+._%\-]{1,256}@[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}(\.[a-zA-Z0-9][a-zA-Z0-9\-]{0,25})+/;
const DANGEROUS_CHARS_REGEX = /[<>"';&|\\`]/;

/**
 * Validates if an email address matches the required format
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Checks if input contains no dangerous characters
 * @param input - The string to check for dangerous characters
 * @returns true if the input is safe (contains NO dangerous characters), false otherwise
 */
export function sanitizeInput(input: string): boolean {
  return !DANGEROUS_CHARS_REGEX.test(input);
}

/**
 * Validates password and returns specific error message in Indonesian
 * Checks conditions sequentially and returns the first error found
 * @param password - The password string to validate
 * @returns Error message in Indonesian, or null if password is valid
 */
export function getPasswordError(password: string): string | null {
  // Check if blank
  if (!password || password.trim().length === 0) {
    return "Password tidak boleh kosong";
  }

  // Check minimum length
  if (password.length < 8) {
    return "Password minimal 8 karakter";
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return "Password harus mengandung huruf besar";
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return "Password harus mengandung huruf kecil";
  }

  // Check for digit
  if (!/\d/.test(password)) {
    return "Password harus mengandung angka";
  }

  // Check for special character ($@#!.)
  if (!/[$@#!.]/.test(password)) {
    return "Password harus mengandung simbol ($,@,#,!,.)";
  }

  // All checks passed
  return null;
}

/**
 * Validates if password and confirmation password match
 * @param password - The original password
 * @param confirm - The confirmation password
 * @returns Error message in Indonesian if passwords don't match, null otherwise
 */
export function getConfirmPasswordError(
  password: string,
  confirm: string
): string | null {
  if (password !== confirm) {
    return "Password tidak cocok";
  }
  return null;
}
