# 🍽️ Restaurant Booking Chatbot - START HERE

Welcome! This guide will get your restaurant booking chatbot running in minutes.

---

## ⚡ Quick Start (Choose One)

### Option 1: Automated Setup (Recommended)

```bash
cd studio
chmod +x scripts/start-test.sh
bash scripts/start-test.sh
```

The script will:
- ✅ Check your environment
- ✅ Install dependencies
- ✅ Verify configuration
- ✅ Offer to seed sample data
- ✅ Start the development server

---

### Option 2: Manual Setup

```bash
cd studio

# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local
# Edit .env.local with your Firebase and Google AI credentials

# 3. Seed sample data
npm run setup:medium

# 4. Verify setup
npm run verify

# 5. Start the app
npm run dev
```

---

## 🔑 Required Configuration

Before you can run the app, you need:

### 1. Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it: `restaurant-booking-test`
4. Enable Firestore Database (Start in test mode)
5. Get your config from Project Settings → Web app

Add to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

### 2. Google AI API Key (1 minute)

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

Add to `.env.local`:
```env
GOOGLE_GENAI_API_KEY=your_gemini_key_here
```

---

## 🎯 Access Your App

Once running, open: **http://localhost:9002**

---

## 🧪 Test the Features

Try these in the chatbot:

### 1. Basic Booking
```
"I want to make a reservation for 4 people this Saturday at 7pm"
```

### 2. Menu Questions
```
"What vegetarian options do you have?"
"Do you have gluten-free dishes?"
"Tell me about your most popular items"
```

### 3. Sentiment Detection
```
"This is terrible!" (should trigger escalation)
"Thank you, this is great!" (positive sentiment)
```

### 4. Dynamic Pricing
- Book for Saturday 7pm (weekend premium)
- Book for Tuesday 6pm (base price)
- Book for 8+ people (large party multiplier)

### 5. Loyalty Program
```
"What's my loyalty status?"
"What rewards are available?"
```

---

## 📦 What's Included

### Critical Features (Phase 1)
- ✅ Conversational booking flow
- ✅ Time slot management
- ✅ Payment integration (Stripe)
- ✅ SMS/Email confirmations (Twilio)

### High Priority Features (Phase 2)
- ✅ Waitlist management
- ✅ Special occasions handling
- ✅ Multi-language support
- ✅ Cancellation & modifications

### Medium Priority Features (Phase 3) - NEW!
- ✅ **Menu Q&A** - Natural language menu queries
- ✅ **Sentiment Analysis** - Auto-escalate negative feedback
- ✅ **A/B Testing** - Optimize conversation flows
- ✅ **Dynamic Pricing** - Smart deposit calculations
- ✅ **Social Media** - Multi-channel support (WhatsApp, FB, Instagram)
- ✅ **Loyalty Program** - 5-tier rewards system

---

## 📊 Available Scripts

```bash
npm run dev              # Start development server
npm run setup:medium     # Seed sample data
npm run verify           # Verify setup
npm run typecheck        # Check TypeScript
npm run build            # Production build

# Test individual features
npm run test:menu        # Test menu service
npm run test:sentiment   # Test sentiment analysis
npm run test:pricing     # Test dynamic pricing
npm run test:loyalty     # Test loyalty program
```

---

## 🐛 Troubleshooting

### "Firebase connection error"
- Verify `.env.local` has all Firebase variables
- Check Firestore is enabled in Firebase Console
- Ensure Firebase rules are in test mode

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Gemini API error"
- Check `GOOGLE_GENAI_API_KEY` is set in `.env.local`
- Verify API key at https://aistudio.google.com/app/apikey

### Setup script fails
```bash
# Run with verbose output
DEBUG=* npm run setup:medium
```

---

## 📚 Documentation

Detailed guides available in `/docs`:

- **TEST_SETUP.md** - Comprehensive test setup guide
- **MEDIUM_PRIORITY_FEATURES.md** - Feature documentation
- **ENV_CONFIG_MEDIUM.md** - Environment configuration
- **QUICK_START_MEDIUM.md** - Integration examples
- **DEPLOYMENT_CHECKLIST.md** - Production deployment

---

## 🚀 Next Steps

After testing locally:

1. **Customize Your Menu**
   - Edit Firestore → `menu` collection
   - Add your actual dishes, prices, dietary info

2. **Configure Pricing Rules**
   - Adjust `BASE_DEPOSIT_AMOUNT` in `.env.local`
   - Create custom rules in Firestore → `pricing_rules`

3. **Setup Payment Processing**
   - Add Stripe keys to `.env.local`
   - Configure payment webhooks

4. **Enable Social Media**
   - Get WhatsApp Business API credentials
   - Configure Facebook Messenger
   - Set up webhooks

5. **Deploy to Production**
   - Use Vercel, Firebase Hosting, or your preferred platform
   - Switch Firestore to production rules
   - Configure proper authentication

---

## ✅ Success Checklist

You're ready when:

- ✅ App runs at http://localhost:9002
- ✅ Can create a test booking
- ✅ Menu Q&A responds correctly
- ✅ Dynamic pricing calculates deposits
- ✅ Loyalty program tracks points
- ✅ `npm run verify` passes all checks

---

## 🆘 Need Help?

1. Check **TEST_SETUP.md** for detailed instructions
2. Review troubleshooting section above
3. Run `npm run verify` to diagnose issues
4. Check Firebase Console for data
5. Review documentation in `/docs` folder

---

## 💡 Quick Tips

- Start with test mode Firestore rules (no auth required)
- Use sample data from `npm run setup:medium`
- Test all 6 features before customizing
- Monitor console logs for debugging
- Check Firebase Console to view stored data

---

**Total Setup Time:** 10-15 minutes  
**Ready to Deploy:** 1-2 days (with customization)

**Let's build something amazing! 🎉**

---

Last Updated: January 2025