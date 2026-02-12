import { auth } from "./firebase";
import {
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  AuthError,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from "firebase/auth";
import { addDocument, getDocuments, queryDocuments, updateDocument, deleteDocument } from "./firebase-db";
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
      return "Login cancelled. Please wait before trying again.";
    case "auth/cancelled-popup-request":
      return "__CANCELLED_POPUP__"; // sentinel – callers should silently ignore
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
      username: displayName || user.email?.split("@")[0],
      avatarName: "avatar_1",
      createdAt: Date.now(),
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

// Module-level lock to prevent concurrent signInWithPopup calls
// (React Strict Mode double-mount or rapid clicks)
let _googlePopupInFlight = false;

export const signInWithGoogle = async (): Promise<User> => {
  // Guard: if a popup is already open, wait for it instead of opening another
  if (_googlePopupInFlight) {
    throw new Error("__CANCELLED_POPUP__");
  }
  _googlePopupInFlight = true;

  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Fire-and-forget: create user doc in Firestore if needed (don't block redirect)
    ensureUserDocument(user);

    return user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError));
  } finally {
    _googlePopupInFlight = false;
  }
};

// Background helper — ensures a Firestore user doc exists without blocking sign-in
const ensureUserDocument = async (user: User) => {
  try {
    const existingUsers = await queryDocuments("users", [where("uid", "==", user.uid)]);
    if (existingUsers.length === 0) {
      await addDocument("users", {
        uid: user.uid,
        email: user.email,
        username: user.displayName || user.email?.split("@")[0],
        avatarName: "avatar_1",
        createdAt: Date.now(),
      });
    }
  } catch (error) {
    console.error("Error ensuring user document:", error);
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

// ============================================================================
// UPDATE USER PROFILE IN FIRESTORE
// ============================================================================

export const updateUserProfile = async (
  uid: string,
  data: { username?: string; avatarName?: string }
): Promise<void> => {
  try {
    const users = await queryDocuments("users", [where("uid", "==", uid)]);
    if (users.length > 0) {
      const userDocId = users[0].id;
      await updateDocument("users", userDocId, data);
    } else {
      throw new Error("User profile not found");
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No user is currently logged in");
    }

    // Re-authenticate the user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update the password
    await updatePassword(user, newPassword);
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === "auth/wrong-password") {
      throw new Error("Current password is incorrect");
    }
    throw new Error(authError.message || "Failed to change password");
  }
};

// ============================================================================
// DELETE ACCOUNT
// ============================================================================

export const deleteAccount = async (password?: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No user is currently logged in");
    }

    // If password is provided and user has email, re-authenticate first
    if (password && user.email) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }

    // Delete user document from Firestore
    const users = await queryDocuments("users", [where("uid", "==", user.uid)]);
    if (users.length > 0) {
      await deleteDocument("users", users[0].id);
    }

    // Delete the user from Firebase Auth
    await deleteUser(user);
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === "auth/requires-recent-login") {
      throw new Error("Please log in again before deleting your account");
    }
    throw new Error(authError.message || "Failed to delete account");
  }
};
