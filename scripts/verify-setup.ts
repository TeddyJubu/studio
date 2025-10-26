/**
 * Verification Script for Medium Priority Features
 *
 * This script verifies that all collections exist and contain data,
 * and tests basic functionality of each service.
 *
 * Run with: npx tsx scripts/verify-setup.ts
 */

import { db } from "../src/lib/firebase-config";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { menuService } from "../src/services/menu-service";
import { abTestingService } from "../src/services/ab-testing-service";
import { dynamicPricingService } from "../src/services/dynamic-pricing-service";
import { loyaltyService } from "../src/services/loyalty-service";

interface VerificationResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

function logResult(result: VerificationResult) {
  const icons = {
    pass: "✅",
    fail: "❌",
    warning: "⚠️",
  };
  console.log(`${icons[result.status]} ${result.name}: ${result.message}`);
  if (result.details) {
    console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
  }
  results.push(result);
}

async function verifyCollections() {
  console.log("\n📦 Verifying Firestore Collections...\n");

  const collections = [
    { name: "menu", required: true, minDocs: 5 },
    { name: "pricing_rules", required: true, minDocs: 3 },
    { name: "special_dates", required: false, minDocs: 1 },
    { name: "loyalty_rewards", required: true, minDocs: 3 },
    { name: "experiments", required: true, minDocs: 1 },
    { name: "channel_configs", required: false, minDocs: 1 },
    { name: "bookings", required: false, minDocs: 0 },
    { name: "customers", required: false, minDocs: 0 },
  ];

  for (const col of collections) {
    try {
      const snapshot = await getDocs(collection(db, col.name));
      const docCount = snapshot.size;

      if (docCount === 0 && col.required) {
        logResult({
          name: `Collection: ${col.name}`,
          status: "fail",
          message: `Collection is empty but required (expected at least ${col.minDocs} documents)`,
          details: { found: 0, expected: col.minDocs },
        });
      } else if (docCount < col.minDocs && col.required) {
        logResult({
          name: `Collection: ${col.name}`,
          status: "warning",
          message: `Has ${docCount} documents, expected at least ${col.minDocs}`,
          details: { found: docCount, expected: col.minDocs },
        });
      } else {
        logResult({
          name: `Collection: ${col.name}`,
          status: "pass",
          message: `${docCount} documents found`,
          details: { count: docCount },
        });
      }
    } catch (error) {
      logResult({
        name: `Collection: ${col.name}`,
        status: "fail",
        message: `Error accessing collection: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
}

async function verifyMenuService() {
  console.log("\n🍽️ Verifying Menu Service...\n");

  try {
    // Test 1: Get all menu items
    const allItems = await menuService.getMenuItems();
    if (allItems.length > 0) {
      logResult({
        name: "Menu Service: Get All Items",
        status: "pass",
        message: `Retrieved ${allItems.length} menu items`,
      });
    } else {
      logResult({
        name: "Menu Service: Get All Items",
        status: "fail",
        message: "No menu items found",
      });
    }

    // Test 2: Search for vegetarian items
    const vegetarianItems = await menuService.findByDietaryRequirements({
      dietaryTags: ["vegetarian"],
    });
    logResult({
      name: "Menu Service: Dietary Filter",
      status: vegetarianItems.length > 0 ? "pass" : "warning",
      message: `Found ${vegetarianItems.length} vegetarian items`,
      details: { items: vegetarianItems.map((i) => i.name) },
    });

    // Test 3: Natural language query
    const answer = await menuService.answerMenuQuestion(
      "What vegetarian options do you have?",
    );
    logResult({
      name: "Menu Service: Natural Language Q&A",
      status: answer.length > 0 ? "pass" : "fail",
      message: "Query processed successfully",
      details: { answerLength: answer.length },
    });

    // Test 4: Get popular items
    const popularItems = await menuService.getPopularItems(5);
    logResult({
      name: "Menu Service: Popular Items",
      status: popularItems.length > 0 ? "pass" : "warning",
      message: `Retrieved ${popularItems.length} popular items`,
    });
  } catch (error) {
    logResult({
      name: "Menu Service",
      status: "fail",
      message: `Error testing menu service: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function verifyABTestingService() {
  console.log("\n🧪 Verifying A/B Testing Service...\n");

  try {
    // Test 1: Get active experiments
    const experiments = await abTestingService.getActiveExperiments();
    if (experiments.length > 0) {
      logResult({
        name: "A/B Testing: Get Active Experiments",
        status: "pass",
        message: `Found ${experiments.length} active experiment(s)`,
        details: { experiments: experiments.map((e) => e.name) },
      });

      // Test 2: Assign variant
      const testUserId = "test-user-" + Date.now();
      const variantId = await abTestingService.assignVariant(
        testUserId,
        experiments[0].id,
      );

      if (variantId) {
        logResult({
          name: "A/B Testing: Assign Variant",
          status: "pass",
          message: `User assigned to variant: ${variantId}`,
        });

        // Test 3: Get variant config
        const config = await abTestingService.getVariantConfig(
          testUserId,
          experiments[0].id,
        );
        logResult({
          name: "A/B Testing: Get Variant Config",
          status: config ? "pass" : "fail",
          message: config
            ? "Config retrieved successfully"
            : "Failed to get config",
          details: { config },
        });
      } else {
        logResult({
          name: "A/B Testing: Assign Variant",
          status: "warning",
          message: "User not assigned to experiment (traffic allocation)",
        });
      }
    } else {
      logResult({
        name: "A/B Testing: Get Active Experiments",
        status: "warning",
        message: "No active experiments found",
      });
    }
  } catch (error) {
    logResult({
      name: "A/B Testing Service",
      status: "fail",
      message: `Error testing A/B service: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function verifyDynamicPricing() {
  console.log("\n💰 Verifying Dynamic Pricing Service...\n");

  try {
    // Test 1: Calculate price for weekday
    const weekdayPrice = await dynamicPricingService.calculatePrice({
      date: "2024-02-01", // Thursday
      time: "6:00 PM",
      partySize: 2,
    });
    logResult({
      name: "Dynamic Pricing: Weekday Calculation",
      status: "pass",
      message: `Base: $${weekdayPrice.basePrice}, Final: $${weekdayPrice.finalPrice}`,
      details: {
        appliedRules: weekdayPrice.appliedRules,
        breakdown: weekdayPrice.breakdown,
      },
    });

    // Test 2: Calculate price for weekend
    const weekendPrice = await dynamicPricingService.calculatePrice({
      date: "2024-02-03", // Saturday
      time: "7:00 PM",
      partySize: 2,
    });

    const hasWeekendPremium = weekendPrice.finalPrice > weekdayPrice.finalPrice;
    logResult({
      name: "Dynamic Pricing: Weekend Premium",
      status: hasWeekendPremium ? "pass" : "warning",
      message: `Weekend price: $${weekendPrice.finalPrice} (vs weekday: $${weekdayPrice.finalPrice})`,
      details: {
        premium: weekendPrice.finalPrice - weekdayPrice.finalPrice,
        appliedRules: weekendPrice.appliedRules,
      },
    });

    // Test 3: Get pricing rules
    const rules = await dynamicPricingService.getActivePricingRules();
    logResult({
      name: "Dynamic Pricing: Active Rules",
      status: rules.length > 0 ? "pass" : "warning",
      message: `Found ${rules.length} active pricing rule(s)`,
      details: { rules: rules.map((r) => r.name) },
    });
  } catch (error) {
    logResult({
      name: "Dynamic Pricing Service",
      status: "fail",
      message: `Error testing pricing service: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function verifyLoyaltyService() {
  console.log("\n🎁 Verifying Loyalty Service...\n");

  try {
    // Test 1: Create test profile
    const testUserId = "test-loyalty-user-" + Date.now();
    const profile = await loyaltyService.getOrCreateProfile(testUserId);

    logResult({
      name: "Loyalty Service: Create Profile",
      status: "pass",
      message: `Profile created with tier: ${profile.tier}`,
      details: { tier: profile.tier, points: profile.points },
    });

    // Test 2: Get available rewards
    const rewards = await loyaltyService.getAvailableRewards(testUserId);
    logResult({
      name: "Loyalty Service: Get Rewards",
      status: rewards.length > 0 ? "pass" : "warning",
      message: `Found ${rewards.length} available reward(s)`,
      details: {
        rewards: rewards.map((r) => ({ name: r.name, cost: r.pointsCost })),
      },
    });

    // Test 3: Award points
    await loyaltyService.awardPoints(testUserId, 100, "Test points award");
    const updatedProfile = await loyaltyService.getOrCreateProfile(testUserId);

    logResult({
      name: "Loyalty Service: Award Points",
      status: updatedProfile.points >= 100 ? "pass" : "fail",
      message: `Points awarded successfully: ${updatedProfile.points} total`,
      details: { points: updatedProfile.points },
    });

    // Test 4: Get loyalty status
    const status = await loyaltyService.getLoyaltyStatus(testUserId);
    logResult({
      name: "Loyalty Service: Get Status",
      status: "pass",
      message: `Status retrieved: ${status.profile.tier} tier`,
      details: {
        tier: status.profile.tier,
        points: status.profile.points,
        nextTier: status.nextTier,
        pointsToNext: status.pointsToNextTier,
      },
    });
  } catch (error) {
    logResult({
      name: "Loyalty Service",
      status: "fail",
      message: `Error testing loyalty service: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

async function verifyEnvironment() {
  console.log("\n🔧 Verifying Environment Configuration...\n");

  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "GOOGLE_GENAI_API_KEY",
  ];

  const optionalVars = [
    "STRIPE_SECRET_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "WHATSAPP_ACCESS_TOKEN",
    "FACEBOOK_PAGE_ACCESS_TOKEN",
  ];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    logResult({
      name: `Environment: ${varName}`,
      status: value ? "pass" : "fail",
      message: value ? "Set" : "Missing (required)",
    });
  }

  // Check optional variables
  for (const varName of optionalVars) {
    const value = process.env[varName];
    logResult({
      name: `Environment: ${varName}`,
      status: value ? "pass" : "warning",
      message: value ? "Set" : "Not set (optional)",
    });
  }
}

async function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION REPORT");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const total = results.length;

  console.log(`Total Checks: ${total}`);
  console.log(`✅ Passed: ${passed} (${Math.round((passed / total) * 100)}%)`);
  console.log(`❌ Failed: ${failed} (${Math.round((failed / total) * 100)}%)`);
  console.log(
    `⚠️  Warnings: ${warnings} (${Math.round((warnings / total) * 100)}%)`,
  );
  console.log("");

  if (failed > 0) {
    console.log("❌ VERIFICATION FAILED");
    console.log("\nFailed checks:");
    results
      .filter((r) => r.status === "fail")
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`));
    console.log(
      "\nPlease fix the issues above before proceeding to deployment.\n",
    );
    return false;
  } else if (warnings > 0) {
    console.log("⚠️  VERIFICATION PASSED WITH WARNINGS");
    console.log("\nWarnings:");
    results
      .filter((r) => r.status === "warning")
      .forEach((r) => console.log(`  - ${r.name}: ${r.message}`));
    console.log("\nYou can proceed, but consider addressing the warnings.\n");
    return true;
  } else {
    console.log("✅ ALL CHECKS PASSED!");
    console.log("\nYour system is ready for deployment.\n");
    return true;
  }
}

async function main() {
  console.log("🔍 MastraMind Medium Priority Features Verification");
  console.log("=".repeat(60));

  try {
    await verifyEnvironment();
    await verifyCollections();
    await verifyMenuService();
    await verifyABTestingService();
    await verifyDynamicPricing();
    await verifyLoyaltyService();

    const success = await generateReport();

    if (success) {
      console.log("Next steps:");
      console.log("1. Review any warnings above");
      console.log("2. Run type check: npm run typecheck");
      console.log("3. Run tests: npm run test");
      console.log("4. Start dev server: npm run dev");
      console.log("5. Deploy to staging\n");
      process.exit(0);
    } else {
      console.log("Please fix the failed checks and run verification again.\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Verification script crashed:", error);
    process.exit(1);
  }
}

// Run verification
main();
