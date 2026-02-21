/**
 * Example Usage of EventsListWithActivities component
 * 
 * This demonstrates how to use the Firestore nested sub-collection fetching
 * in your Next.js application with proper authentication
 */

"use client";

import React from "react";
import EventsListWithActivities from "@/components/features/EventsListWithActivities";
import { useAuth } from "@/lib/useAuth";
import { Loader2 } from "lucide-react";

export default function ExampleEventsPage() {
  // Get authenticated user ID
  const { userId, loading, isAuthenticated } = useAuth();

  // Loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-ui-accent-yellow" />
          <p className="text-sm text-ui-dark-grey font-medium">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !userId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-ui-black mb-2">
            Please Log In
          </h2>
          <p className="text-sm text-ui-dark-grey mb-4">
            You need to be logged in to view events
          </p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-2 bg-ui-accent-yellow text-ui-black font-semibold rounded-full hover:brightness-105"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Authenticated and userId available
  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ui-black mb-2">
          My Events
        </h1>
        <p className="text-sm text-ui-dark-grey">
          View all your events and activities from Firestore
        </p>
      </div>

      {/* 
        The component will automatically:
        1. Fetch all events from: users/{userId}/events
        2. For each event, fetch activities from: users/{userId}/events/{eventId}/activities
        3. Combine them using Promise.all for parallel fetching
        4. Display events with their nested activities
      */}
      <EventsListWithActivities userId={userId} />
    </div>
  );
}
