/**
 * Authentication Hook Example
 * Use this to get the current user's ID for Firestore queries
 */

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return {
    user,
    userId: user?.uid || null,
    isAuthenticated: !!user,
    loading,
  };
}

/**
 * Usage in your component:
 * 
 * ```tsx
 * import { useAuth } from "@/lib/useAuth";
 * import EventsListWithActivities from "@/components/features/EventsListWithActivities";
 * 
 * export default function MyPage() {
 *   const { userId, loading } = useAuth();
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (!userId) return <div>Please login</div>;
 * 
 *   return <EventsListWithActivities userId={userId} />;
 * }
 * ```
 */
