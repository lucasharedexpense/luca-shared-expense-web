# 🚀 Setup Guide untuk Luca Split Bill App

## ✅ Prerequisites
- Node.js 18+
- npm 9+
- Git

## 📋 Initial Setup (Hanya sekali)

### 1. Clone Repository
```bash
git clone <repository-url>
cd luca-shared-expense-web
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables ⚠️ **PENTING**

File `.env.local` tidak ada di repository (untuk security reasons).

**Opsi A: Copy dari contoh (Recommended)**
```bash
cp .env.local.example .env.local
```

**Opsi B: Buat manual**

Buat file `.env.local` di root folder dengan isi:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDGfuLRNYPV9z-w1ziVJhrogi3EItd1ffo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=luca-f40d7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=luca-f40d7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=luca-f40d7.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=119381624546
NEXT_PUBLIC_FIREBASE_APP_ID=1:119381624546:web:7fd82b7ffa8e7e92ba80bb
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YP0H2KH3NZ
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in browser.

---

## 🔗 Key Links

- **Firebase Project**: https://console.firebase.google.com
- **Project Name**: luca-f40d7
- **Firestore Database**: [Console Link](https://console.firebase.google.com/u/0/project/luca-f40d7/firestore)

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── fill-profile/
│   ├── home/              # Home dashboard
│   ├── event/             # Event management
│   └── ...
├── components/            # React components
├── lib/                   # Utilities & libraries
│   ├── firebase.ts        # Firebase config
│   ├── firebase-auth.ts   # Auth functions
│   ├── firebase-db.ts     # Firestore functions
│   └── auth-context.tsx   # Auth provider
└── middleware.ts          # Route protection
```

---

## 🔐 Authentication

### Features
- ✅ Email/Password Sign Up & Login
- ✅ Google Sign In
- ✅ Protected Routes
- ✅ Auto user profile creation

### Usage in Components
```tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export default function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <h1>Welcome, {user.email}!</h1>;
}
```

---

## 🚨 Troubleshooting

### Error: `Firebase: Error (auth/invalid-api-key)`

**Penyebab**: `.env.local` tidak ada atau environment variables tidak terisi

**Solusi**:
1. Pastikan sudah copy `.env.local.example` ke `.env.local`
2. Cek file `.env.local` punya semua 7 variables
3. Restart dev server: `npm run dev`
4. Clear cache: `rm -r .next` lalu run lagi

### Error: Port 3000 is already in use

**Solusi**:
```bash
# Kill node process
# Windows PowerShell:
Get-Process node | Stop-Process -Force

# Atau run di port lain:
npm run dev -- -p 3001
```

### Error: Build fails dengan "Parsing ecmascript source code failed"

**Solusi**:
```bash
# Bersihkan cache
rm -r .next node_modules/.cache

# Reinstall & rebuild
npm install
npm run dev
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Run production build
npm run lint          # Check code quality
```

---

## 🔄 Git Workflow

```bash
# Update dari remote
git pull origin main

# Buat branch baru
git checkout -b feature/nama-fitur

# Commit changes
git add .
git commit -m "feat: deskripsi perubahan"

# Push
git push origin feature/nama-fitur
```

---

## 📱 Testing Authentication

### Test Sign Up
1. Go to http://localhost:3000/auth/signup
2. Enter email + password
3. Click Continue / Sign up with Google
4. Should redirect to `/auth/fill-profile`

### Test Login
1. Go to http://localhost:3000/auth/login
2. Enter credentials
3. Should redirect to `/home`

### Test Protected Routes
1. Try accessing `/home` without login
2. Should redirect to home page
3. Login → should allow access

---

## ✨ Next Steps

1. **Explore the codebase**: Check `src/app` untuk page structure
2. **Read documentation**: Ada file `.md` di root untuk panduan lebih detail
3. **Check Firebase Console**: Lihat Firestore data & auth users
4. **Start implementing**: Custom features sesuai requirement

---

## 🤝 Team Guidelines

### Before Pushing Code
- ✅ Run `npm run lint` 
- ✅ Test feature locally
- ✅ No console errors
- ✅ Clear & descriptive commit message

### .env.local
- 🔐 JANGAN commit `.env.local`
- 🔐 JANGAN share credentials di public channels
- ✅ HARUS copy `.env.local.example` jika baru setup

---

## 📞 Need Help?

1. Check existing issues in repository
2. Check error messages dalam Next.js dev server
3. Ask in team channel with error details
4. Check Firebase Console untuk debug auth issues

---

**Last Updated**: February 9, 2026  
**Next.js Version**: 16.1.6 (Turbopack)  
**Firebase SDK**: 12.9.0
