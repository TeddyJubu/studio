# Restaurant Booking Chatbot - Quick Test Setup Guide

## 🚀 Quick Start (5 Minutes)

This guide will help you set up and test the restaurant booking chatbot quickly.

---

## Prerequisites

- Node.js 18+ installed
- Firebase project (we'll create if needed)
- Google AI API key (for Gemini)

---

## Step 1: Firebase Setup (2 minutes)

### Option A: Create New Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it: `restaurant-booking-test`
4. Disable Google Analytics (optional for testing)
5. Click "Create project"

### Option B: Use Existing Project

Skip to Step 2 if you already have a Firebase project.

### Get Firebase Configuration

1. In Firebase Console, click the gear icon → Project settings
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. Register app name: `restaurant-chatbot`
5. Copy the `firebaseConfig` object

---

## Step 2: Environment Configuration (1 minute)

Create `.env.local` in the `studio` directory:

```bash
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AI (REQUIRED for chatbot)
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here

# Medium Priority Features (OPTIONAL - Enable for testing)
ENABLE_MENU_QA=true
ENABLE_SENTIMENT_ANALYSIS=true
ENABLE_AB_TESTING=true
ENABLE_DYNAMIC_PRICING=true
ENABLE_LOYALTY=true

# Dynamic Pricing Configuration
BASE_DEPOSIT_AMOUNT=20
RESTAURANT_CAPACITY=100
HIGH_OCCUPANCY_THRESHOLD=80
LOW_OCCUPANCY_THRESHOLD=30

# Loyalty Configuration
LOYALTY_POINTS_PER_DOLLAR=1
LOYALTY_BRONZE_THRESHOLD=0
LOYALTY_SILVER_THRESHOLD=500
LOYALTY_GOLD_THRESHOLD=1500
LOYALTY_PLATINUM_THRESHOLD=3000
LOYALTY_DIAMOND_THRESHOLD=5000

# Social Media (DISABLED for testing)
ENABLE_WHATSAPP=false
ENABLE_FACEBOOK=false
ENABLE_INSTAGRAM=false
ENABLE_GOOGLE_BUSINESS=false

# Sentiment Analysis
SENTIMENT_ESCALATION_THRESHOLD=-0.7
AUTO_ESCALATE_ON_CRITICAL=true

# A/B Testing
DEFAULT_TRAFFIC_ALLOCATION=100
MIN_SAMPLE_SIZE=10
```

### Get Google AI API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and paste in `.env.local`

---

## Step 3: Install Dependencies (1 minute)

```bash
cd studio
npm install
```

---

## Step 4: Setup Firestore Database (2 minutes)

### Enable Firestore

1. Go to Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (us-central1 recommended)
5. Click "Enable"

### Seed Sample Data

Run the setup script:

```bash
npm run setup:medium
```

This creates:
- ✅ Sample menu items (Grilled Salmon, Vegetable Risotto, Caesar Salad, etc.)
- ✅ Pricing rules (Weekend Premium, Prime Time, etc.)
- ✅ Loyalty rewards (Free Appetizer, Dining Credits, etc.)
- ✅ A/B test experiment (Greeting Test)
- ✅ Social media channel configs

Expected output:
```
🚀 Setting up medium priority features...

📋 Creating menu items...
✓ Created: Grilled Salmon
✓ Created: Vegetable Risotto
✓ Created: Caesar Salad
...

💰 Creating pricing rules...
✓ Created: Weekend Premium

🎁 Creating loyalty rewards...
✓ Created: Free Appetizer

🧪 Creating A/B test experiment...
✓ Created: Greeting Test

✅ Setup complete! All collections created.
```

---

## Step 5: Verify Setup (1 minute)

```bash
npm run verify
```

Expected output:
```
🔍 Verifying setup...

✓ menu: 12 documents
✓ pricing_rules: 5 documents
✓ loyalty_rewards: 8 documents
✓ experiments: 1 documents
✓ social_channels: 4 documents

🧪 Testing services...
✓ Menu Service: Working
✓ A/B Testing Service: Working
✓ Dynamic Pricing Service: Working
✓ Loyalty Service: Working
✓ Social Media Service: Working

✅ All checks passed!
```

---

## Step 6: Run the Application

```bash
npm run dev
```

The app will start at: http://localhost:9002

---

## 🧪 Testing Scenarios

### Test 1: Basic Booking Flow

1. Open http://localhost:9002
2. Click "Chat with us" or similar
3. Try: "I want to make a reservation"
4. Follow the prompts:
   - Date: Choose a future date
   - Time: Choose a time slot
   - Party size: 2-4 people
   - Name: Test User
   - Phone: (555) 123-4567
   - Email: test@example.com

**Expected:** Booking created successfully with deposit amount calculated.

---

### Test 2: Menu Q&A

In the chat, try these queries:

```
"What vegetarian options do you have?"
"Do you have gluten-free dishes?"
"What are your most popular items?"
"Can you show me appetizers?"
"I'm allergic to shellfish, what can I eat?"
"Tell me about the salmon dish"
```

**Expected:** AI responds with relevant menu items, ingredients, and dietary info.

---

### Test 3: Sentiment Analysis

Try these messages to test sentiment detection:

**Negative (should escalate):**
```
"This is ridiculous! I've been waiting forever!"
"I demand to speak to a manager NOW"
"Your service is terrible and I want my money back"
```

**Positive (should not escalate):**
```
"Thank you so much! This was wonderful!"
"Great service, I love this place!"
"Perfect, exactly what I needed!"
```

**Expected:** 
- Negative messages trigger console warning: `⚠️ ESCALATION NEEDED`
- Positive messages process normally

---

### Test 4: Dynamic Pricing

Try booking for different scenarios:

**Weekend Booking (Should show +25% surcharge):**
- Date: Next Saturday
- Time: 7:00 PM
- Party Size: 2

**Weekday Booking (Should show base price):**
- Date: Next Tuesday
- Time: 6:00 PM
- Party Size: 2

**Large Party (Should show multiplier):**
- Date: Next Friday
- Time: 7:00 PM
- Party Size: 8

**Expected:** Different deposit amounts based on rules.

---

### Test 5: Loyalty Program

After completing a booking:

Try these queries:
```
"What's my loyalty status?"
"How many points do I have?"
"What rewards are available?"
"Can I redeem points?"
"Tell me about the loyalty program"
```

**Expected:** AI provides loyalty info, available rewards, points balance.

---

### Test 6: A/B Testing

1. Open chat in normal browser
2. Note the greeting message
3. Open chat in incognito/private window
4. Note if greeting is different (50% chance)

Variants:
- Control: "Welcome! How can I help you today?"
- Variant A: "Hey there! 👋 Ready to book an amazing dining experience?"

**Expected:** Different users see different greetings.

---

## 🐛 Troubleshooting

### Issue: Firebase connection error

**Solution:**
1. Check `.env.local` has all Firebase variables
2. Verify Firebase project is created
3. Ensure Firestore is enabled
4. Check Firebase rules allow read/write (test mode)

---

### Issue: "Cannot find module" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: Gemini API errors

**Solution:**
1. Verify `GOOGLE_GENAI_API_KEY` is set in `.env.local`
2. Check API key is valid at https://aistudio.google.com/app/apikey
3. Ensure you have API quota remaining

---

### Issue: Setup script fails

**Solution:**
1. Verify Firestore is enabled in Firebase Console
2. Check Firebase rules (should be in test mode for dev)
3. Run with verbose logging:
```bash
DEBUG=* npm run setup:medium
```

---

### Issue: Menu Q&A not working

**Solution:**
1. Verify menu collection has data:
   - Firebase Console → Firestore → menu collection
2. Re-run setup: `npm run setup:medium`
3. Check `ENABLE_MENU_QA=true` in `.env.local`

---

### Issue: TypeScript errors

**Solution:**
```bash
npm run typecheck
```

If errors persist, check that all dependencies are installed.

---

## 📊 Monitoring & Logs

### View Firebase Data

1. Go to Firebase Console
2. Click Firestore Database
3. Browse collections:
   - `bookings` - All reservations
   - `menu` - Menu items
   - `loyalty_profiles` - Customer loyalty data
   - `experiments` - A/B tests
   - `pricing_rules` - Dynamic pricing rules

### View Console Logs

Check terminal running `npm run dev` for:
- API calls
- Sentiment analysis results
- Pricing calculations
- Loyalty point awards
- Error messages

---

## 🎯 Success Criteria

You're ready for production when:

- ✅ All 6 test scenarios pass
- ✅ `npm run verify` shows all checks passed
- ✅ No TypeScript errors: `npm run typecheck`
- ✅ Firebase collections populated with data
- ✅ Chatbot responds to all test queries
- ✅ Bookings are saved to Firestore
- ✅ Dynamic pricing calculates correctly
- ✅ Loyalty points are awarded

---

## 🚀 Next Steps

After testing:

1. **Customize Menu:**
   - Add your actual menu items to Firestore
   - Update categories, prices, dietary info

2. **Configure Pricing:**
   - Adjust `BASE_DEPOSIT_AMOUNT`
   - Add custom pricing rules
   - Set restaurant capacity

3. **Design Experiments:**
   - Create A/B tests for conversion optimization
   - Test different chat flows

4. **Enable Social Media:**
   - Set up WhatsApp Business API
   - Configure Facebook Messenger
   - Add Instagram integration

5. **Production Deployment:**
   - Switch Firestore to production rules
   - Set up proper authentication
   - Configure domain and SSL
   - Enable monitoring and analytics

---

## 📚 Additional Resources

- **Full Features:** `docs/MEDIUM_PRIORITY_FEATURES.md`
- **Environment Config:** `docs/ENV_CONFIG_MEDIUM.md`
- **Quick Start:** `docs/QUICK_START_MEDIUM.md`
- **Implementation Status:** `docs/IMPLEMENTATION_STATUS.md`

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review the full documentation in `/docs`
3. Check Firebase Console for data issues
4. Verify all environment variables are set
5. Run `npm run verify` to diagnose issues

---

## 📞 Support

For issues or questions:
- Check documentation in `studio/docs/`
- Review implementation files in `studio/src/services/`
- Test individual services: `npm run test:menu`, `npm run test:pricing`, etc.

---

**Total Setup Time:** ~10-15 minutes  
**Prerequisites Time:** ~5 minutes (Firebase + API keys)

**You're ready to test! 🎉**

Last Updated: January 2025