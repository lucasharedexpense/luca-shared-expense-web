import { auth } from "./firebase";
import {
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  AuthError,
} from "firebase/auth";
import { addDocument, getDocuments, queryDocuments } from "./firebase-db";
import { where } from "firebase/firestore";

// ============================================================================
// ERROR HANDLING
// ============================================================================

const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Email already in use. Please use a different email.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/user-not-found":
      return "User not found. Please check your email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many login attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Login cancelled.";
    case "auth/popup-blocked":
      return "Popup was blocked. Please allow popups for this site.";
    default:
      return error.message || "An authentication error occurred.";
  }
};

// ============================================================================
// SIGN UP - EMAIL & PASSWORD
// ============================================================================

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string = ""
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await addDocument("users", {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.email?.split("@")[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError));
  }
};

// ============================================================================
// LOGIN - EMAIL & PASSWORD
// ============================================================================

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError));
  }
};

// ============================================================================
// SIGN IN WITH GOOGLE
// ============================================================================

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user exists in Firestore
    const existingUsers = await queryDocuments("users", [where("uid", "==", user.uid)]);

    // If user doesn't exist, create user document
    if (existingUsers.length === 0) {
      await addDocument("users", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0],
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        createdAt: new Date(),
      });
    }

    return user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError));
  }
};

// ============================================================================
// LOGOUT
// ============================================================================

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// ============================================================================
// GET CURRENT USER
// ============================================================================

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// ============================================================================
// GET USER PROFILE FROM FIRESTORE
// ============================================================================

export const getUserProfile = async (uid: string) => {
  try {
    const users = await queryDocuments("users", [where("uid", "==", uid)]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};
