import { auth } from "./firebase";
import { signOut, User } from "firebase/auth";

/**
 * Sign out the current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
