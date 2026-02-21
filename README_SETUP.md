# Luca - Split Bill Made Easy 💰

A modern web app untuk split bill dengan teman, built with Next.js 16 + Firebase.

## 🚀 Quick Start

### Step 1: Clone & Install
```bash
git clone <repository-url>
cd luca-shared-expense-web
npm install
```

### ⚠️ Step 2: Setup Environment Variables (MANDATORY)

Jalankan command ini:
```bash
cp .env.local.example .env.local
```

**PENTING:** File `.env.local` berisi Firebase credentials dan **sudah tersedia di `.env.local.example`**. Kalau gagal atau error Firebase, pastikan step ini sudah dilakukan dengan benar.

### Step 3: Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📖 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions & troubleshooting
- **[AUTH_SETUP_COMPLETE.md](AUTH_SETUP_COMPLETE.md)** - Authentication flow & usage
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Firebase integration guide

---

## ✨ Features

- 🔐 **Authentication**: Email/Password + Google Sign-In
- 📱 **Responsive**: Mobile-first design
- 💾 **Real-time**: Firestore for instant updates
- 🎯 **Protected Routes**: Middleware-protected pages
- ⚡ **Fast**: Built with Next.js 16 + Turbopack

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Backend**: Firebase (Auth + Firestore + Storage)
- **State**: React Context API
- **Dev**: Turbopack for fast builds

---

## 📚 Project Structure
```
src/
├── app/               # Pages & routes
├── components/        # Reusable components
├── lib/              # Utilities & Firebase
└── middleware.ts     # Route protection
```

---

## 🔍 Common Issues

### ❌ Firebase: Error (auth/invalid-api-key)
```bash
# Fix:
cp .env.local.example .env.local
npm run dev
```

### ❌ Port 3000 already in use
```bash
npm run dev -- -p 3001
```

---

## 📝 License

Proprietary - All rights reserved

---

**Questions?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) atau chat di team channel.
