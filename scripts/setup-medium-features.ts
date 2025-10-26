/**
 * Setup Script for Medium Priority Features
 *
 * This script initializes Firestore collections with sample data for:
 * - Menu items
 * - Pricing rules
 * - Loyalty rewards
 * - A/B test experiments
 * - Special dates
 *
 * Run with: npx tsx scripts/setup-medium-features.ts
 */

import { db } from '../src/lib/firebase-config';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

async function setupMediumFeatures() {
  console.log('🚀 Setting up medium priority features...\n');

  try {
    // 1. Create sample menu items
    console.log('📋 Creating menu items...');
    const menuItems = [
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables',
        category: 'entree',
        price: 28,
        ingredients: ['salmon', 'lemon', 'butter', 'herbs', 'vegetables'],
        allergens: ['fish'],
        dietaryTags: ['gluten-free'],
        available: true,
        calories: 450,
        prepTime: 25,
        popularity: 85,
        spiceLevel: 'none'
      },
      {
        name: 'Vegetable Risotto',
        description: 'Creamy arborio rice with seasonal vegetables and parmesan',
        category: 'entree',
        price: 22,
        ingredients: ['arborio rice', 'vegetables', 'parmesan', 'white wine', 'vegetable stock'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian', 'gluten-free'],
        available: true,
        calories: 380,
        prepTime: 30,
        popularity: 75,
        spiceLevel: 'none'
      },
      {
        name: 'Caesar Salad',
        description: 'Romaine lettuce with classic Caesar dressing and parmesan',
        category: 'appetizer',
        price: 12,
        ingredients: ['romaine lettuce', 'parmesan', 'croutons', 'Caesar dressing'],
        allergens: ['dairy', 'gluten', 'eggs'],
        dietaryTags: ['vegetarian'],
        available: true,
        calories: 250,
        prepTime: 10,
        popularity: 90,
        spiceLevel: 'none'
      },
      {
        name: 'Spicy Thai Curry',
        description: 'Red curry with vegetables, tofu, and jasmine rice',
        category: 'entree',
        price: 24,
        ingredients: ['tofu', 'vegetables', 'red curry paste', 'coconut milk', 'jasmine rice'],
        allergens: [],
        dietaryTags: ['vegan', 'gluten-free'],
        available: true,
        calories: 420,
        prepTime: 20,
        popularity: 80,
        spiceLevel: 'hot'
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        category: 'dessert',
        price: 10,
        ingredients: ['chocolate', 'flour', 'eggs', 'butter', 'sugar', 'vanilla ice cream'],
        allergens: ['dairy', 'gluten', 'eggs'],
        dietaryTags: ['vegetarian'],
        available: true,
        calories: 520,
        prepTime: 15,
        popularity: 95,
        spiceLevel: 'none'
      },
      {
        name: 'Quinoa Buddha Bowl',
        description: 'Quinoa with roasted vegetables, avocado, and tahini dressing',
        category: 'entree',
        price: 20,
        ingredients: ['quinoa', 'roasted vegetables', 'avocado', 'tahini', 'chickpeas'],
        allergens: ['sesame'],
        dietaryTags: ['vegan', 'gluten-free'],
        available: true,
        calories: 380,
        prepTime: 15,
        popularity: 70,
        spiceLevel: 'none'
      },
      {
        name: 'New York Strip Steak',
        description: '12oz USDA Prime strip steak with garlic butter',
        category: 'entree',
        price: 38,
        ingredients: ['beef', 'garlic', 'butter', 'herbs'],
        allergens: ['dairy'],
        dietaryTags: ['gluten-free'],
        available: true,
        calories: 650,
        prepTime: 20,
        popularity: 88,
        spiceLevel: 'none'
      },
      {
        name: 'Caprese Salad',
        description: 'Fresh mozzarella, tomatoes, and basil with balsamic glaze',
        category: 'appetizer',
        price: 14,
        ingredients: ['mozzarella', 'tomatoes', 'basil', 'olive oil', 'balsamic vinegar'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian', 'gluten-free'],
        available: true,
        calories: 280,
        prepTime: 8,
        popularity: 85,
        spiceLevel: 'none'
      }
    ];

    for (const item of menuItems) {
      const docRef = doc(collection(db, 'menu'));
      await setDoc(docRef, item);
      console.log(`  ✓ Created: ${item.name}`);
    }
    console.log(`✅ ${menuItems.length} menu items created\n`);

    // 2. Create pricing rules
    console.log('💰 Creating pricing rules...');
    const pricingRules = [
      {
        name: 'Weekend Premium',
        description: 'Weekend surcharge for high demand',
        active: true,
        priority: 10,
        conditions: [
          { type: 'day_of_week', operator: 'in', value: [5, 6] }
        ],
        adjustment: { type: 'percentage', value: 25, minPrice: 10, maxPrice: 100 }
      },
      {
        name: 'Prime Time Surcharge',
        description: 'Peak hours surcharge (7-8 PM)',
        active: true,
        priority: 20,
        conditions: [
          { type: 'time_slot', operator: 'between', value: ['7:00 PM', '8:00 PM'] }
        ],
        adjustment: { type: 'fixed_amount', value: 10 }
      },
      {
        name: 'Large Party Fee',
        description: 'Additional fee for parties of 6 or more',
        active: true,
        priority: 15,
        conditions: [
          { type: 'party_size', operator: 'greater_than', value: 6 }
        ],
        adjustment: { type: 'multiplier', value: 1.5, minPrice: 20, maxPrice: 150 }
      },
      {
        name: 'Early Bird Discount',
        description: 'Discount for bookings 14+ days in advance',
        active: true,
        priority: 5,
        conditions: [
          { type: 'advance_booking', operator: 'greater_than', value: 14 }
        ],
        adjustment: { type: 'percentage', value: -15 }
      },
      {
        name: 'High Occupancy Surge',
        description: 'Surge pricing when occupancy exceeds 80%',
        active: true,
        priority: 30,
        conditions: [
          { type: 'occupancy', operator: 'greater_than', value: 80 }
        ],
        adjustment: { type: 'percentage', value: 50, maxPrice: 200 }
      }
    ];

    for (const rule of pricingRules) {
      const docRef = doc(collection(db, 'pricing_rules'));
      await setDoc(docRef, rule);
      console.log(`  ✓ Created: ${rule.name}`);
    }
    console.log(`✅ ${pricingRules.length} pricing rules created\n`);

    // 3. Create special dates
    console.log('📅 Creating special dates...');
    const specialDates = [
      {
        date: '2024-02-14',
        name: "Valentine's Day",
        priceMultiplier: 2.0,
        description: "Valentine's Day premium pricing"
      },
      {
        date: '2024-12-31',
        name: "New Year's Eve",
        priceMultiplier: 2.5,
        description: "New Year's Eve special pricing"
      },
      {
        date: '2024-05-12',
        name: "Mother's Day",
        priceMultiplier: 1.5,
        description: "Mother's Day pricing"
      },
      {
        date: '2024-06-16',
        name: "Father's Day",
        priceMultiplier: 1.5,
        description: "Father's Day pricing"
      }
    ];

    for (const specialDate of specialDates) {
      const docRef = doc(collection(db, 'special_dates'));
      await setDoc(docRef, specialDate);
      console.log(`  ✓ Created: ${specialDate.name}`);
    }
    console.log(`✅ ${specialDates.length} special dates created\n`);

    // 4. Create loyalty rewards
    console.log('🎁 Creating loyalty rewards...');
    const rewards = [
      {
        name: 'Free Appetizer',
        description: 'Any appetizer up to $15',
        pointsCost: 200,
        category: 'freeItem',
        value: 15,
        active: true,
        expiryDays: 90,
        minTier: 'bronze',
        maxRedemptionsPerUser: 4,
        terms: 'Valid for appetizers up to $15. Cannot be combined with other offers.'
      },
      {
        name: '$20 Dining Credit',
        description: 'Credit towards your next meal',
        pointsCost: 400,
        category: 'discount',
        value: 20,
        active: true,
        expiryDays: 60,
        minTier: 'silver',
        maxRedemptionsPerUser: 6,
        terms: 'Can be applied to any menu item. Minimum purchase of $40.'
      },
      {
        name: 'Complimentary Wine Pairing',
        description: 'Wine pairing for two',
        pointsCost: 600,
        category: 'upgrade',
        value: 35,
        active: true,
        expiryDays: 90,
        minTier: 'gold',
        maxRedemptionsPerUser: 4,
        terms: 'Sommelier-selected wine pairing for two guests.'
      },
      {
        name: "Chef's Table Experience",
        description: 'Exclusive chef table dining for two',
        pointsCost: 1500,
        category: 'experience',
        value: 150,
        active: true,
        expiryDays: 180,
        minTier: 'platinum',
        maxRedemptionsPerUser: 2,
        terms: 'Must be redeemed with 14 days advance notice. Subject to availability.'
      },
      {
        name: 'Private Dining Room',
        description: 'Private room for up to 8 guests',
        pointsCost: 3000,
        category: 'special',
        value: 500,
        active: true,
        expiryDays: 180,
        minTier: 'diamond',
        maxRedemptionsPerUser: 1,
        terms: 'Includes private room, dedicated server, and custom menu options.'
      },
      {
        name: 'Free Dessert',
        description: 'Any dessert from our menu',
        pointsCost: 150,
        category: 'freeItem',
        value: 12,
        active: true,
        expiryDays: 90,
        minTier: 'bronze',
        terms: 'Valid for any dessert. One per booking.'
      }
    ];

    for (const reward of rewards) {
      const docRef = doc(collection(db, 'loyalty_rewards'));
      await setDoc(docRef, reward);
      console.log(`  ✓ Created: ${reward.name}`);
    }
    console.log(`✅ ${rewards.length} loyalty rewards created\n`);

    // 5. Create sample A/B test
    console.log('🧪 Creating A/B test experiment...');
    const experiment = {
      name: 'Greeting Message Test',
      description: 'Test different greeting messages for conversion optimization',
      status: 'active',
      startDate: Timestamp.now(),
      endDate: null,
      variants: [
        {
          id: 'control',
          name: 'Control',
          description: 'Standard professional greeting',
          weight: 50,
          config: {
            greeting: 'Welcome! How can I help you today?',
            tone: 'professional'
          },
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
          config: {
            greeting: 'Hey there! 👋 Ready to book an amazing dining experience?',
            tone: 'friendly'
          },
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
      trafficAllocation: 100,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const experimentRef = doc(collection(db, 'experiments'));
    await setDoc(experimentRef, experiment);
    console.log(`  ✓ Created: ${experiment.name}`);
    console.log(`✅ A/B test experiment created\n`);

    // 6. Create sample channel configurations
    console.log('📱 Creating social media channel configs...');
    const channelConfigs = [
      {
        channel: 'whatsapp',
        enabled: false,
        credentials: {
          phoneNumberId: '',
          accessToken: '',
          webhookSecret: ''
        },
        settings: {
          autoReply: true,
          responseDelay: 1000,
          businessHours: {
            enabled: true,
            timezone: 'America/New_York',
            schedule: {
              monday: { open: '09:00', close: '22:00' },
              tuesday: { open: '09:00', close: '22:00' },
              wednesday: { open: '09:00', close: '22:00' },
              thursday: { open: '09:00', close: '22:00' },
              friday: { open: '09:00', close: '23:00' },
              saturday: { open: '10:00', close: '23:00' },
              sunday: { open: '10:00', close: '21:00' }
            }
          }
        }
      },
      {
        channel: 'facebook',
        enabled: false,
        credentials: {
          accessToken: '',
          webhookSecret: ''
        },
        settings: {
          autoReply: true,
          responseDelay: 800
        }
      },
      {
        channel: 'instagram',
        enabled: false,
        credentials: {
          accessToken: '',
          webhookSecret: ''
        },
        settings: {
          autoReply: true,
          responseDelay: 1000
        }
      }
    ];

    for (const config of channelConfigs) {
      const docRef = doc(db, 'channel_configs', config.channel);
      await setDoc(docRef, config);
      console.log(`  ✓ Created: ${config.channel} config`);
    }
    console.log(`✅ ${channelConfigs.length} channel configs created\n`);

    console.log('✨ Setup complete! All medium priority features initialized.\n');
    console.log('Next steps:');
    console.log('1. Update environment variables with API keys');
    console.log('2. Enable desired features via feature flags');
    console.log('3. Run tests: npm run test');
    console.log('4. Start development server: npm run dev\n');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    throw error;
  }
}

// Run the setup
setupMediumFeatures()
  .then(() => {
    console.log('🎉 Setup script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup script failed:', error);
    process.exit(1);
  });
