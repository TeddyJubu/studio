# MastraMind Setup Guide - Critical Features Implementation

This guide will help you set up and test the 5 critical features that have been implemented:

1. ✅ State Management (Zustand)
2. ✅ Customer Profiles (Firebase)
3. ✅ Booking Validation
4. ✅ Modification Flow (AI + UI)
5. ✅ Real Database (Firestore)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

The Zustand dependency has already been added. Verify it's installed:

```bash
cd studio
npm install
```

### Step 2: Set Up Firebase

1. **Create a Firebase Project**
   - Go to https://console.firebase.google.com/
   - Click "Add project" or select existing project
   - Follow the setup wizard

2. **Enable Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Start in **production mode** (we'll add security rules later)
   - Choose a location (select closest to your users)

3. **Enable Authentication (Optional but recommended)**
   - Go to "Authentication" in Firebase Console
   - Click "Get started"
   - Enable "Email/Password" provider

4. **Get Firebase Configuration**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click on "Web" app (or add one if none exists)
   - Copy the `firebaseConfig` object

5. **Create Environment File**

Copy the example file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Your existing Google AI key (already configured)
GOOGLE_GENAI_API_KEY=your_existing_key
```

### Step 3: Set Up Firestore Collections

The app will auto-create collections, but you can set up indexes for better performance:

1. Go to Firestore Console
2. Create these composite indexes (optional, Firestore will prompt you if needed):

**Bookings Collection Indexes:**
- Collection: `bookings`
- Fields: `date` (Ascending), `time` (Ascending)
- Fields: `customerId` (Ascending), `createdAt` (Descending)
- Fields: `status` (Ascending), `date` (Ascending)

**Customers Collection Indexes:**
- Collection: `customers`
- Fields: `email` (Ascending)
- Fields: `phone` (Ascending)

### Step 4: Run the Application

```bash
npm run dev
```

Open http://localhost:9002

---

## 🧪 Testing the Features

### Test 1: State Management ✅

**What to test:** Conversation state persists across page refreshes

**Steps:**
1. Start a booking conversation: "I need a table for 4"
2. Refresh the page (F5)
3. Your conversation should still be there!
4. Continue the conversation normally

**Expected Result:** Messages persist, booking context is maintained

---

### Test 2: Booking Validation ✅

**What to test:** Invalid bookings are caught and handled gracefully

**Test Cases:**

#### Test 2.1: Party Size Validation
```
User: "I need a table for 30 people"
Expected: Error message about max capacity (20 guests)
```

#### Test 2.2: Date Validation (Past Date)
```
User: "Book a table for 4"
AI: "For how many people?"
User: "4"
AI: "What day?"
User: "yesterday"
Expected: Error message about past dates
```

#### Test 2.3: Date Validation (Too Far)
```
User: "I want to book for December 31st 2025"
Expected: Error message about 90-day limit
```

#### Test 2.4: Time Validation
```
User: "Table for 2 tomorrow at 2pm"
Expected: Error about restaurant hours (5pm-10pm only)
```

---

### Test 3: Complete Booking Flow ✅

**What to test:** End-to-end booking with database storage

**Steps:**
1. Start fresh conversation: "Book a table"
2. Follow prompts:
   - Party size: "4"
   - Date: "tomorrow"
   - Time: "7pm"
3. Confirm: "yes"

**Expected Result:**
- Booking confirmation message
- Confirmation code displayed (e.g., "ABC12345")
- Check Firestore Console - you should see:
  - New document in `bookings` collection
  - Contains all booking details
  - Status is "confirmed"

---

### Test 4: Booking Lookup & Modification ✅

**What to test:** Find and modify existing bookings

**Steps:**

#### Test 4.1: Lookup by Confirmation Code
```
User: "Find my reservation ABC12345"
Expected: Shows booking details with modify/cancel options
```

#### Test 4.2: Modify Booking
1. After lookup, click "Modify Booking"
2. Change party size from 4 to 6
3. Change time from 7pm to 8pm
4. Click "Confirm Changes"

**Expected Result:**
- Success message
- Check Firestore - booking should be updated
- `updatedAt` timestamp should change

#### Test 4.3: Cancel Booking
1. Lookup your booking again
2. Click "Cancel Booking"
3. Optionally add reason: "Change of plans"
4. Confirm cancellation

**Expected Result:**
- Booking status changes to "cancelled"
- `cancelledAt` timestamp added
- Cancellation reason saved

---

### Test 5: Customer Profiles ✅

**What to test:** Customer data is tracked across bookings

**Steps:**

1. Make a booking (follow Test 3)
2. Check Firestore Console under `customers` collection
3. You should see a new customer document with:
   - Name, email, phone (if provided)
   - `bookingHistory` array with booking ID
   - `totalVisits: 0` (increments when they check in)
   - `tier: "bronze"`
   - `loyaltyPoints: 0`

**To test returning customer:**
1. Make another booking with same email/phone
2. Check customer document - `bookingHistory` should have 2 IDs
3. The AI should recognize them as returning customer (future enhancement)

---

## 🔍 Debugging Tips

### Issue: Firebase Connection Error

**Symptoms:** Console shows Firebase errors

**Solutions:**
1. Check `.env.local` has correct values
2. Ensure Firebase project has Firestore enabled
3. Check Firebase security rules (temporarily allow all for testing):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // TEMPORARY - CHANGE IN PRODUCTION
    }
  }
}
```

### Issue: Bookings Not Saving

**Symptoms:** Confirmation code shown but nothing in Firestore

**Solutions:**
1. Open browser console - check for errors
2. Verify Firestore rules allow writes
3. Check network tab - look for 403 errors
4. Try test write in Firestore Console

### Issue: State Not Persisting

**Symptoms:** Page refresh loses conversation

**Solutions:**
1. Check browser console for localStorage errors
2. Clear browser cache and try again
3. Check if browser is in incognito mode (some browsers limit storage)

### Issue: Validation Not Working

**Symptoms:** Invalid bookings are accepted

**Solutions:**
1. Check console for validation errors
2. Ensure validation functions are being called
3. Try booking with obvious invalid data (e.g., "party size: 100")

---

## 📊 Database Schema Reference

### Bookings Collection

```typescript
{
  id: "auto-generated",
  confirmationCode: "ABC12345", // 8-char alphanumeric
  
  // Booking details
  partySize: 4,
  date: "2024-02-15", // YYYY-MM-DD
  time: "19:00", // HH:MM 24-hour
  occasion?: "birthday",
  specialRequests?: "Window seat",
  
  // Customer info
  customerId?: "customer_doc_id",
  customerName?: "John Doe",
  customerEmail?: "john@example.com",
  customerPhone?: "+1234567890",
  
  // Status tracking
  status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show",
  source: "web" | "sms" | "phone" | "walkin",
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  cancelledAt?: Timestamp,
  cancellationReason?: "Change of plans",
  
  notes?: "Internal staff notes"
}
```

### Customers Collection

```typescript
{
  id: "auto-generated",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  createdAt: Timestamp,
  
  // Preferences
  preferences: {
    dietaryRestrictions: ["vegetarian"],
    allergens: ["peanuts"],
    favoriteTable?: "table_12",
    preferredTimeSlots: ["19:00", "19:30"],
    communicationPreferences: {
      email: true,
      sms: true,
      whatsapp: false
    }
  },
  
  // History
  bookingHistory: ["booking_id_1", "booking_id_2"],
  totalVisits: 5,
  totalSpent: 450.00,
  averagePartySize: 3,
  noShowCount: 0,
  cancellationCount: 1,
  
  // Loyalty
  loyaltyPoints: 250,
  tier: "bronze" | "silver" | "gold" | "platinum",
  specialOccasions: [
    {
      type: "birthday",
      date: "03-15", // MM-DD
      notification: true,
      notes?: "Loves chocolate cake"
    }
  ]
}
```

---

## 🔐 Security Rules (Production)

Before deploying to production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Bookings - authenticated users can read/write their own
    match /bookings/{bookingId} {
      allow read: if true; // Allow reading for lookup by confirmation code
      allow create: if true; // Allow anyone to create bookings
      allow update: if request.resource.data.confirmationCode == resource.data.confirmationCode;
      allow delete: if false; // Prevent deletion, use cancellation instead
    }
    
    // Customers - only readable/writable by the customer themselves
    match /customers/{customerId} {
      allow read: if request.auth != null && request.auth.uid == customerId;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == customerId;
      allow delete: if request.auth != null && request.auth.uid == customerId;
    }
  }
}
```

---

## 🎯 Next Steps

After confirming all 5 critical features work:

1. **Week 2 Features** (from IMPLEMENTATION_PRIORITY.md):
   - Context-aware greeting
   - Quick action buttons
   - Visual date/time pickers
   - Enhanced error handling

2. **Immediate Improvements:**
   - Add customer authentication (Firebase Auth)
   - Implement SMS notifications (Twilio)
   - Add email confirmations
   - Create admin dashboard for restaurant staff

3. **Production Readiness:**
   - Set up proper Firebase security rules
   - Add rate limiting
   - Implement error tracking (Sentry)
   - Set up monitoring and alerts

---

## 📞 Need Help?

**Common Issues:**
- Check the browser console for errors
- Verify Firebase configuration in `.env.local`
- Ensure Firestore security rules allow your operations
- Try clearing browser cache and localStorage

**Resources:**
- Firebase Docs: https://firebase.google.com/docs/firestore
- Zustand Docs: https://zustand-demo.pmnd.rs/
- Next.js Docs: https://nextjs.org/docs

**Testing Checklist:**
- [ ] State persists after page refresh
- [ ] Invalid party sizes are rejected
- [ ] Past dates are rejected
- [ ] Complete booking saves to Firestore
- [ ] Confirmation code is generated
- [ ] Can lookup booking by confirmation code
- [ ] Can modify existing booking
- [ ] Can cancel existing booking
- [ ] Customer profile is created/updated
- [ ] Validation messages are user-friendly

---

## 🎉 Success Criteria

You've successfully implemented the critical features if:

1. ✅ **State Management**: Conversations persist across refreshes
2. ✅ **Validation**: Invalid bookings are caught with helpful messages
3. ✅ **Database**: Bookings appear in Firestore Console
4. ✅ **Modification**: Can find and edit existing bookings
5. ✅ **Customer Profiles**: Customer data is tracked and stored

**Congratulations!** You've built a production-ready foundation for MastraMind. Now proceed to Week 2 quick wins for UX improvements!

---

*Last Updated: 2024*
*Implementation Time: 4-6 hours*
*Difficulty: Medium*