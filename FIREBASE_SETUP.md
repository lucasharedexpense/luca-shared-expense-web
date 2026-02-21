# Firebase Setup - Luca Split Bill App

## 📁 Struktur Files

```
src/lib/
├── firebase.ts           → Inisialisasi Firebase
├── firebase-auth.ts      → Fungsi autentikasi
├── firebase-db.ts        → Fungsi Firestore CRUD
└── auth-context.tsx      → Auth Provider & Hook useAuth()
```

## ⚙️ Konfigurasi

Environment variables sudah di-set di `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDGfuLRNYPV9z-w1ziVJhrogi3EItd1ffo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=luca-f40d7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=luca-f40d7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=luca-f40d7.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=119381624546
NEXT_PUBLIC_FIREBASE_APP_ID=1:119381624546:web:7fd82b7ffa8e7e92ba80bb
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YP0H2KH3NZ
```

## 📝 Cara Pakai

### 1. Get Current User (Client Component)

```tsx
"use client";

import { useAuth } from "@/lib/auth-context";

export default function UserProfile() {
  const { user, loading, error } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

### 2. Add Data ke Firestore

```tsx
"use client";

import { addDocument } from "@/lib/firebase-db";
import { useAuth } from "@/lib/auth-context";

export default function CreateEvent() {
  const { user } = useAuth();

  const handleCreate = async () => {
    try {
      const eventId = await addDocument("events", {
        name: "Team Dinner",
        amount: 500,
        userId: user?.uid,
        members: [user?.uid],
      });
      console.log("Event created:", eventId);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return <button onClick={handleCreate}>Create Event</button>;
}
```

### 3. Get Single Document

```tsx
import { getDocument } from "@/lib/firebase-db";

const event = await getDocument("events", "event-id-123");
console.log(event);
```

### 4. Get All Documents

```tsx
import { getDocuments } from "@/lib/firebase-db";

const allEvents = await getDocuments("events");
console.log(allEvents);
```

### 5. Query Documents (with WHERE clause)

```tsx
import { queryDocuments } from "@/lib/firebase-db";
import { where } from "firebase/firestore";

// Dapatkan semua event milik user tertentu
const userEvents = await queryDocuments("events", [
  where("userId", "==", "user-id-123"),
]);
console.log(userEvents);
```

### 6. Update Document

```tsx
import { updateDocument } from "@/lib/firebase-db";

await updateDocument("events", "event-id-123", {
  name: "Updated Event Name",
  amount: 750,
});
```

### 7. Delete Document

```tsx
import { deleteDocument } from "@/lib/firebase-db";

await deleteDocument("events", "event-id-123");
```

### 8. Logout

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
      console.error("Error logging out:", error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

## 📊 Firestore Schema Recommendation

### Collection: `users`
```
{
  uid: "user-id" // (document ID = Firebase Auth UID)
  email: "user@example.com"
  displayName: "John Doe"
  avatar: "https://..."
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Collection: `events`
```
{
  id: "event-id" // (document ID)
  name: "Team Dinner"
  description: "Monthly team dinner"
  userId: "creator-uid" // pembuat event
  members: ["uid1", "uid2", "uid3"] // array of user IDs
  totalAmount: 500
  currency: "IDR"
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Collection: `events/{eventId}/activities` (Subcollection)
```
{
  id: "activity-id"
  description: "Food"
  amount: 200
  paidBy: "uid-1" // siapa yang bayar
  splitAmong: ["uid-1", "uid-2", "uid-3"] // siapa yang sharing
  date: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Collection: `events/{eventId}/settlements` (Subcollection)
```
{
  id: "settlement-id"
  from: "uid-1" // yang hutang
  to: "uid-2" // yang dibayarin
  amount: 100
  status: "pending" | "completed"
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 🔐 Important Notes

- `AuthProvider` sudah di-wrap di root layout (`src/app/layout.tsx`)
- Gunakan `"use client"` directive untuk components yang `useAuth()`
- Environment variables dengan prefix `NEXT_PUBLIC_` aman di expose ke client
- Firestore security rules harus diatur di Firebase Console
- `createdAt` dan `updatedAt` otomatis di-set oleh fungsi-fungsi di `firebase-db.ts`

## 🚀 Next Steps

1. Set up Firestore security rules di Firebase Console
2. Configure Authentication (Email, Google, GitHub, etc) di Firebase Console
3. Create Firestore indexes jika butuh complex queries
4. Implement components menggunakan functions di atas
