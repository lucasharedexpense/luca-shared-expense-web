# Firestore Debug Guide

Your events are being "created" but not appearing in Firebase. Here's how to diagnose:

## Step 1: Check Your Firebase Project ID
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Settings** (gear icon) → **Project Settings**
4. Copy your **Project ID**
5. Open your `.env.local` file and verify:
   ```
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   ```

## Step 2: Verify Firestore is Enabled
1. In Firebase Console, go to **Firestore Database**
2. If it says "Create Database" - **you need to enable Firestore!**
3. Click **Create Database**
4. Choose **Start in test mode** (for now, since you already have `allow read, write: if true;`)
5. Select **United States** as location (or your region)

## Step 3: Check Your Firestore Structure
1. In Firestore Database, look for the **`users`** collection
2. If it doesn't exist, it will be created automatically when you create an event
3. Expand a user document and check for **`events`** sub-collection
4. The events should appear there immediately (with your security rules)

## Step 4: Run a Diagnostic Check
Insert this code in your browser console (F12 → Console):

```javascript
// Import the diagnostic function
const { diagnosticCheckFirestore } = await import('file:///c:/Split%20Bill/luca-shared-expense-web/src/lib/firestore.ts');

// Run the diagnostic
diagnosticCheckFirestore().then(() => {
  console.log("Diagnostic complete!");
}).catch(error => {
  console.error("Diagnostic failed:", error);
});
```

Or, simpler approach - add this to your home page temporarily:

```tsx
import { diagnosticCheckFirestore } from "@/lib/firestore";

// In your useEffect:
useEffect(() => {
  diagnosticCheckFirestore();
}, []);
```

## Step 5: Common Issues

### Issue: "Firestore not initialized" or connection errors
- **Cause**: Firestore not enabled in Firebase project
- **Fix**: Enable Firestore in Firebase Console (see Step 2)

### Issue: Event appears in console logs but not in Firebase
- **Cause**: Wrong Project ID configuration
- **Fix**: Verify your Project ID matches (see Step 1)

### Issue: Events appear in real-time but not after refresh
- **Cause**: Security rules issue (though yours should be open)
- **Fix**: Check your Firestore Security Rules:
   ```
   match /users/{userId}/events/{eventId} {
     allow read, write: if true;
   }
   ```

## Step 6: Check Firestore Rules
1. In Firebase Console, go to **Firestore Database**
2. Click **Rules** tab
3. Ensure your rules include:
   ```firestore
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

## Debug Info Available
After you've done these steps, check your browser console (F12 → Console) for logs:
- `[Firebase] Initializing with config:` - Shows your Firebase config
- `[Firestore] Creating event for user:` - Shows event creation
- `[Firestore] ✅ Verification SUCCESS` - Event is in database
- `[Firestore] ❌ Verification FAILED` - Event was NOT saved

## Still Not Working?

Check the **Network Tab** (F12 → Network):
1. Create a new event
2. Look for `firestore.googleapis.com` requests
3. Check if they return **200 OK** or an error
4. If error, the error message will tell you the issue (usually permissions)
