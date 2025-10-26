# Quick Start Guide - Medium Priority Features

## Overview

This guide helps you quickly integrate and test the medium priority features in your restaurant booking chatbot.

**Time to Complete:** 2-3 hours  
**Prerequisites:** Critical and High Priority features already implemented

---

## 🚀 Quick Start Steps

### Step 1: Install Dependencies (5 min)

All dependencies should already be installed. Verify:

```bash
cd studio
npm install
```

### Step 2: Configure Environment (10 min)

Create or update your `.env.local`:

```bash
# Menu Q&A
ENABLE_MENU_QA=true

# Sentiment Analysis
ENABLE_SENTIMENT_ANALYSIS=true
SENTIMENT_ESCALATION_THRESHOLD=-0.7

# A/B Testing
ENABLE_AB_TESTING=true
DEFAULT_TRAFFIC_ALLOCATION=100

# Dynamic Pricing
ENABLE_DYNAMIC_PRICING=true
BASE_DEPOSIT_AMOUNT=20
RESTAURANT_CAPACITY=100

# Loyalty Program
ENABLE_LOYALTY=true
LOYALTY_POINTS_PER_DOLLAR=1

# Social Media (optional - disable for now)
ENABLE_WHATSAPP=false
ENABLE_FACEBOOK=false
ENABLE_INSTAGRAM=false
```

### Step 3: Create Firestore Collections (15 min)

Run this script to create collections with sample data:

```typescript
// scripts/setup-medium-features.ts
import { db } from '@/lib/firebase-config';
import { collection, doc, setDoc } from 'firebase/firestore';

async function setupMediumFeatures() {
  console.log('Setting up medium priority features...');

  // 1. Create sample menu items
  const menuItems = [
    {
      name: 'Grilled Salmon',
      description: 'Fresh Atlantic salmon with lemon butter',
      category: 'entree',
      price: 28,
      ingredients: ['salmon', 'lemon', 'butter', 'herbs'],
      allergens: ['fish'],
      dietaryTags: ['gluten-free'],
      available: true,
      popularity: 85
    },
    {
      name: 'Vegetable Risotto',
      description: 'Creamy arborio rice with seasonal vegetables',
      category: 'entree',
      price: 22,
      ingredients: ['rice', 'vegetables', 'parmesan', 'white wine'],
      allergens: ['dairy'],
      dietaryTags: ['vegetarian', 'gluten-free'],
      available: true,
      popularity: 75
    },
    {
      name: 'Caesar Salad',
      description: 'Romaine lettuce with classic Caesar dressing',
      category: 'appetizer',
      price: 12,
      ingredients: ['romaine', 'parmesan', 'croutons', 'Caesar dressing'],
      allergens: ['dairy', 'gluten', 'eggs'],
      dietaryTags: ['vegetarian'],
      available: true,
      popularity: 90
    }
  ];

  for (const item of menuItems) {
    const docRef = doc(collection(db, 'menu'));
    await setDoc(docRef, item);
    console.log(`Created menu item: ${item.name}`);
  }

  // 2. Create sample pricing rule
  const pricingRule = {
    name: 'Weekend Premium',
    description: 'Weekend surcharge for high demand',
    active: true,
    priority: 10,
    conditions: [
      { type: 'day_of_week', operator: 'in', value: [5, 6] }
    ],
    adjustment: { type: 'percentage', value: 25 }
  };

  await setDoc(doc(collection(db, 'pricing_rules')), pricingRule);
  console.log('Created pricing rule: Weekend Premium');

  // 3. Create sample loyalty rewards
  const rewards = [
    {
      name: 'Free Appetizer',
      description: 'Any appetizer up to $15',
      pointsCost: 200,
      category: 'freeItem',
      value: 15,
      active: true,
      minTier: 'bronze'
    },
    {
      name: '$20 Dining Credit',
      description: 'Credit towards your next meal',
      pointsCost: 400,
      category: 'discount',
      value: 20,
      active: true,
      minTier: 'silver'
    }
  ];

  for (const reward of rewards) {
    await setDoc(doc(collection(db, 'loyalty_rewards')), reward);
    console.log(`Created reward: ${reward.name}`);
  }

  // 4. Create sample A/B test
  const experiment = {
    name: 'Greeting Test',
    description: 'Test different greeting messages',
    status: 'active',
    startDate: new Date(),
    variants: [
      {
        id: 'control',
        name: 'Control',
        description: 'Standard greeting',
        weight: 50,
        config: { greeting: 'Welcome! How can I help you today?' },
        metrics: {
          impressions: 0,
          conversions: 0,
          conversionRate: 0,
          bookings: 0,
          bookingRate: 0,
          revenue: 0,
          avgResponseTime: 0,
          satisfactionScore: 0,
          abandonmentRate: 0
        }
      },
      {
        id: 'variant_a',
        name: 'Friendly',
        description: 'Friendly greeting with emoji',
        weight: 50,
        config: { greeting: 'Hey there! 👋 Ready to book an amazing dining experience?' },
        metrics: {
          impressions: 0,
          conversions: 0,
          conversionRate: 0,
          bookings: 0,
          bookingRate: 0,
          revenue: 0,
          avgResponseTime: 0,
          satisfactionScore: 0,
          abandonmentRate: 0
        }
      }
    ],
    targetMetric: 'conversion_rate',
    trafficAllocation: 100
  };

  await setDoc(doc(collection(db, 'experiments')), experiment);
  console.log('Created A/B test: Greeting Test');

  console.log('✅ Setup complete!');
}

setupMediumFeatures().catch(console.error);
```

Run it:

```bash
npx tsx scripts/setup-medium-features.ts
```

---

## 📝 Integration Examples

### 1. Menu Q&A (5 min)

Add to your chat action handler:

```typescript
// app/actions.ts
import { menuService } from '@/services/menu-service';

export async function handleMenuQuery(message: string, userId: string) {
  // Answer menu question
  const answer = await menuService.answerMenuQuestion(message);
  
  // Log for analytics
  await menuService.logMenuQuery(message, answer.items?.length || 0, userId);
  
  return {
    role: 'assistant',
    content: answer,
    context: {
      type: 'menu_query',
      query: message
    }
  };
}
```

Test it:

```typescript
// Try these queries:
await handleMenuQuery("What vegetarian options do you have?", "user123");
await handleMenuQuery("Do you have gluten-free dishes?", "user123");
await handleMenuQuery("What are your most popular items?", "user123");
```

### 2. Sentiment Analysis (5 min)

Add to message processing:

```typescript
// app/actions.ts
import { analyzeSentiment } from '@/ai/flows/analyze-sentiment';

export async function processMessageWithSentiment(
  message: string,
  conversationHistory: Array<{role: string, content: string}>
) {
  // Analyze sentiment
  const sentiment = await analyzeSentiment.run({
    message,
    conversationContext: conversationHistory
  });

  // Handle escalation
  if (sentiment.needsEscalation) {
    console.log(`⚠️ ESCALATION NEEDED: ${sentiment.escalationReason}`);
    // TODO: Notify manager
    return {
      needsEscalation: true,
      urgency: sentiment.urgency,
      reason: sentiment.escalationReason
    };
  }

  return { sentiment };
}
```

Test it:

```typescript
// Negative message - should trigger escalation
await processMessageWithSentiment(
  "I've been waiting 2 hours and nobody has helped me!",
  []
);

// Positive message - should not escalate
await processMessageWithSentiment(
  "Thank you so much! This was wonderful!",
  []
);
```

### 3. A/B Testing (10 min)

Add to your chat initialization:

```typescript
// components/chat/chat-layout.tsx
import { abTestingService } from '@/services/ab-testing-service';
import { useEffect, useState } from 'react';

export function ChatLayout() {
  const [greetingMessage, setGreetingMessage] = useState('Welcome!');

  useEffect(() => {
    const initExperiment = async () => {
      const userId = 'user123'; // Get from auth
      
      // Get active experiments
      const experiments = await abTestingService.getActiveExperiments();
      const greetingExperiment = experiments.find(e => e.name === 'Greeting Test');
      
      if (greetingExperiment) {
        // Assign variant
        const variantId = await abTestingService.assignVariant(
          userId,
          greetingExperiment.id
        );
        
        // Get variant config
        const config = await abTestingService.getVariantConfig(
          userId,
          greetingExperiment.id
        );
        
        if (config?.greeting) {
          setGreetingMessage(config.greeting);
        }
      }
    };

    initExperiment();
  }, []);

  return (
    <div>
      <h1>{greetingMessage}</h1>
      {/* Rest of chat UI */}
    </div>
  );
}
```

Track conversions:

```typescript
// When booking is completed
await abTestingService.trackConversion(userId, experimentId);
```

### 4. Dynamic Pricing (10 min)

Add to booking confirmation:

```typescript
// app/actions.ts
import { dynamicPricingService } from '@/services/dynamic-pricing-service';

export async function calculateBookingPrice(bookingDetails: {
  date: string;
  time: string;
  partySize: number;
  occasion?: string;
}) {
  // Calculate dynamic price
  const pricing = await dynamicPricingService.calculatePrice(bookingDetails);
  
  return {
    basePrice: pricing.basePrice,
    finalPrice: pricing.finalPrice,
    breakdown: pricing.breakdown,
    appliedRules: pricing.appliedRules,
    message: `
**Deposit Amount: $${pricing.finalPrice.toFixed(2)}**

${pricing.breakdown}

This deposit will be applied to your final bill.
    `
  };
}
```

Test it:

```typescript
// Weekend booking - should have premium
const weekendPrice = await calculateBookingPrice({
  date: '2024-02-03', // Saturday
  time: '7:00 PM',
  partySize: 4
});
console.log(weekendPrice);

// Weekday booking - should be base price
const weekdayPrice = await calculateBookingPrice({
  date: '2024-02-01', // Thursday
  time: '6:00 PM',
  partySize: 2
});
console.log(weekdayPrice);
```

### 5. Loyalty Integration (10 min)

Add to booking completion:

```typescript
// app/actions.ts
import { loyaltyService } from '@/services/loyalty-service';

export async function processLoyaltyForBooking(
  userId: string,
  bookingId: string,
  totalSpend: number,
  isSpecialOccasion: boolean = false
) {
  // Award points
  const pointsEarned = await loyaltyService.awardPointsForBooking(
    userId,
    bookingId,
    totalSpend,
    isSpecialOccasion
  );

  // Get updated status
  const status = await loyaltyService.getLoyaltyStatus(userId);

  return {
    pointsEarned,
    totalPoints: status.profile.points,
    tier: status.profile.tier,
    message: `
🎉 You earned ${pointsEarned} points!

**Your Loyalty Status**
- Points: ${status.profile.points}
- Tier: ${status.profile.tier.toUpperCase()}
${status.nextTier ? `- Next Tier: ${status.nextTier.toUpperCase()} (${status.pointsToNextTier} points away)` : '- Status: Maximum tier achieved!'}
    `
  };
}
```

Show available rewards:

```typescript
export async function showLoyaltyRewards(userId: string) {
  const rewards = await loyaltyService.getAvailableRewards(userId);
  const status = await loyaltyService.getLoyaltyStatus(userId);

  let message = `**Available Rewards** (You have ${status.profile.points} points)\n\n`;

  rewards.forEach(reward => {
    const canAfford = status.profile.points >= reward.pointsCost;
    const emoji = canAfford ? '✅' : '🔒';
    message += `${emoji} **${reward.name}** - ${reward.pointsCost} points\n`;
    message += `   ${reward.description}\n\n`;
  });

  return message;
}
```

---

## 🧪 Testing Guide

### Test Menu Q&A

```bash
# Open chat and try:
"What vegetarian options do you have?"
"Do you have gluten-free dishes?"
"What's your most popular item?"
"Can you show me appetizers?"
"I'm allergic to shellfish, what can I eat?"
```

### Test Sentiment Analysis

```bash
# Negative (should escalate):
"This is ridiculous! I've been waiting forever!"
"I demand to speak to a manager NOW"
"Your service is terrible"

# Positive (should not escalate):
"Thank you so much!"
"This looks wonderful!"
"Great service!"
```

### Test A/B Testing

```bash
# Open chat in 2 different browsers/incognito windows
# Should see different greeting messages
# Complete booking in one to track conversion
```

### Test Dynamic Pricing

```bash
# Try booking for:
- Weekend (Friday/Saturday) - should see +25% surcharge
- Weekday - should see base price
- Large party (6+) - should see multiplier
- Prime time (7-8 PM) - should see surcharge
```

### Test Loyalty

```bash
# Complete a booking, then check:
"What's my loyalty status?"
"How many points do I have?"
"What rewards are available?"
"Can I redeem points?"
```

---

## 📊 Verify Implementation

Run these checks:

### 1. Database Check

```typescript
// scripts/verify-setup.ts
import { db } from '@/lib/firebase-config';
import { collection, getDocs } from 'firebase/firestore';

async function verifySetup() {
  const checks = [
    'menu',
    'pricing_rules',
    'loyalty_rewards',
    'experiments'
  ];

  for (const collectionName of checks) {
    const snapshot = await getDocs(collection(db, collectionName));
    console.log(`✓ ${collectionName}: ${snapshot.size} documents`);
  }
}

verifySetup();
```

### 2. Service Check

```typescript
// Test each service
import { menuService } from '@/services/menu-service';
import { abTestingService } from '@/services/ab-testing-service';
import { dynamicPricingService } from '@/services/dynamic-pricing-service';
import { loyaltyService } from '@/services/loyalty-service';

async function testServices() {
  // Menu
  const menuItems = await menuService.getMenuItems();
  console.log(`✓ Menu service: ${menuItems.length} items`);

  // A/B Testing
  const experiments = await abTestingService.getActiveExperiments();
  console.log(`✓ A/B Testing: ${experiments.length} active experiments`);

  // Dynamic Pricing
  const pricing = await dynamicPricingService.calculatePrice({
    date: '2024-02-03',
    time: '7:00 PM',
    partySize: 2
  });
  console.log(`✓ Dynamic Pricing: $${pricing.finalPrice}`);

  // Loyalty
  const profile = await loyaltyService.getOrCreateProfile('test-user');
  console.log(`✓ Loyalty: Tier ${profile.tier}`);
}

testServices();
```

### 3. Type Check

```bash
npm run typecheck
```

Should pass without errors.

---

## 🐛 Common Issues

### Menu Q&A not working
- Check Firestore `menu` collection exists
- Verify menu items have all required fields
- Check Firebase permissions

### Sentiment Analysis errors
- Verify Gemini API key is set
- Check `GOOGLE_GENAI_API_KEY` in environment
- Test with simple messages first

### A/B Testing not assigning variants
- Check experiment status is 'active'
- Verify variant weights sum to 100
- Clear cookies and try again

### Dynamic Pricing shows base price
- Check pricing rules are active
- Verify conditions match your test case
- Check rule priority order

### Loyalty points not awarding
- Verify user ID is consistent
- Check loyalty profile exists
- Ensure totalSpend is a number

---

## 🚀 Next Steps

1. **Customize configurations** - Adjust thresholds, rules, and settings
2. **Add more menu items** - Populate your full menu
3. **Create more pricing rules** - Add special dates, promotions
4. **Design experiments** - Plan A/B tests for your flows
5. **Build reward catalog** - Define your loyalty rewards
6. **Enable social media** - Set up WhatsApp/Facebook when ready

---

## 📚 Resources

- **Full Documentation:** `docs/MEDIUM_PRIORITY_FEATURES.md`
- **Environment Config:** `docs/ENV_CONFIG_MEDIUM.md`
- **Implementation Summary:** `docs/MEDIUM_PRIORITY_COMPLETE.md`
- **Main Recommendations:** `docs/RECOMMENDATIONS.md`

---

## 💡 Pro Tips

1. **Start small** - Enable features one at a time
2. **Test thoroughly** - Use test data before production
3. **Monitor metrics** - Watch for unexpected behavior
4. **Iterate quickly** - Adjust based on real usage
5. **Document changes** - Keep track of custom configurations

---

**Estimated Time to Production:**
- Development/Testing: 1-2 days
- Staging Deployment: 1 day
- Production Rollout: 1 week (staged)

**Need Help?** Check the troubleshooting section in the full documentation.

---

*Last Updated: January 2025*