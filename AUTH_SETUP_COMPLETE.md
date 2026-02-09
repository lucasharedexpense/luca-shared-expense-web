# Complete Authentication Setup Guide

## ✅ What's Been Configured

### 1. **Firebase Authentication Module** (`src/lib/firebase-auth.ts`)
- ✅ Email/Password Sign Up (`signUpWithEmail`)
- ✅ Email/Password Login (`loginWithEmail`)
- ✅ Google Sign In (`signInWithGoogle`)
- ✅ Logout (`logout`)
- ✅ Proper error handling with user-friendly messages
- ✅ Auto-creates user profile in Firestore

### 2. **Authentication Pages**
- ✅ **Login Page** (`src/app/auth/login/page.tsx`)
  - Email + Password login
  - Google Sign In button
  - Form validation
  - Error messages
  - Redirect to `/home` on success

- ✅ **Sign Up Page** (`src/app/auth/signup/page.tsx`)
  - Email + Password sign up
  - Google Sign In button
  - Password confirmation
  - Form validation
  - Auto-creates Firestore user doc
  - Redirect to `/auth/fill-profile` on success

- ✅ **Fill Profile Page** (`src/app/auth/fill-profile/page.tsx`)
  - Avatar selection
  - Profile completion
  - Ready to use

### 3. **Auth Context Provider** (`src/lib/auth-context.tsx`)
- ✅ Global auth state management
- ✅ `useAuth()` hook for accessing user info
- ✅ Wraps entire app in root layout
- ✅ Automatically watches auth state changes

### 4. **Middleware Protection** (`src/middleware.ts`)
- ✅ Protects routes: `/home`, `/event`, `/account`, `/settings`, `/scan`, `/contacts`
- ✅ Redirects logged-in users away from auth pages
- ✅ Redirects non-logged-in users to home page

---

## 🚀 How to Use

### Get Current User (Any Client Component)

```tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export default function Profile() {
  const { user, loading, error } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      <p>UID: {user.uid}</p>
    </div>
  );
}
```

### Logout

```tsx
"use client";

import { logout } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

---

## 🔐 Authentication Flow

### Sign Up Flow
```
1. User fills form (email + password)
2. Click "Continue" or "Sign up with Google"
3. Firebase creates auth account
4. Auto-creates user document in Firestore:
   {
     uid: "user-id",
     email: "user@example.com",
     displayName: "email-prefix",
     avatar: "https://api.dicebear.com/...",
     createdAt: Timestamp
   }
5. Redirects to "/auth/fill-profile"
```

### Login Flow
```
1. User enters email + password
2. Click "Log in" or "Continue with Google"
3. Firebase authenticates
4. Redirects to "/home"
5. AuthProvider auto-syncs user state
```

### Protected Route Flow
```
1. User tries to access "/home" without login
2. Middleware checks "luca_session" cookie
3. If not logged in → redirects to "/"
4. If logged in → allows access
5. Components use useAuth() to access current user
```

---

## ⚠️ Important Notes

### Session Management
- Firebase SDK automatically manages session tokens
- Cookies are set automatically by Firebase
- No manual cookie management needed for most cases

### Error Handling
All Firebase errors are mapped to user-friendly messages:
- "Email already in use"
- "User not found"
- "Incorrect password"
- "Too many login attempts"
- etc.

### Firestore User Document
When user signs up or signs in with Google, a document is created in the `users` collection:

```
Collection: "users"
├── Document: {uid}
│   ├── uid: "firebase-auth-uid"
│   ├── email: "user@example.com"
│   ├── displayName: "John"
│   ├── avatar: "https://..."
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp (from firebase-db functions)
```

### Google Sign-In Setup
For Google Sign In to work:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project "luca-f40d7"
3. Go to Authentication → Sign-in methods
4. Enable "Google"
5. Add your domain to authorized domains (for production)

---

## 🧪 Testing

### Test Sign Up
1. Go to `http://localhost:3000/auth/signup`
2. Enter email + password
3. Click "Continue" or "Sign up with Google"
4. Should redirect to `/auth/fill-profile`
5. Firestore should have new user doc

### Test Login
1. Go to `http://localhost:3000/auth/login`
2. Enter credentials of existing user
3. Click "Log in" or "Continue with Google"
4. Should redirect to `/home`
5. `useAuth()` should return logged-in user

### Test Protected Routes
1. Try accessing `/home` without logout
2. Should allow access (you're logged in)
3. Open DevTools → Application → Cookies
4. Should see Firebase session cookies
5. Try deleting cookies and refresh
6. Should redirect you back (auth lost)

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `src/lib/firebase.ts` | Firebase initialization |
| `src/lib/firebase-auth.ts` | Auth functions (signup, login, google, logout) |
| `src/lib/firebase-db.ts` | Firestore CRUD operations |
| `src/lib/auth-context.tsx` | Auth state provider + useAuth hook |
| `src/app/auth/login/page.tsx` | Login UI + logic |
| `src/app/auth/signup/page.tsx` | Sign up UI + logic |
| `src/app/auth/fill-profile/page.tsx` | Complete profile after signup |
| `src/middleware.ts` | Protected route redirects |
| `.env.local` | Firebase config (keep secret) |

---

## 🔄 What's Next?

1. **Set up Firestore Security Rules** in Firebase Console
2. **Add more auth methods**: Email verification, Password reset, Phone auth
3. **Save user preferences** in Firestore after fill-profile
4. **Implement role-based access** (admin, user, moderator)
5. **Add session persistence checks** for better UX

---

## ⚠️ Production Checklist

- [ ] Set up Firestore security rules (not open to public)
- [ ] Configure CORS for production domain
- [ ] Enable reCAPTCHA for auth forms
- [ ] Set up email verification
- [ ] Implement password reset email
- [ ] Enable Google API for Sign In
- [ ] Test on production domain before launch
- [ ] Set up error logging/monitoring
- [ ] Consider implementing 2FA for admin users
