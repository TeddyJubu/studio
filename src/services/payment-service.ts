"use server";

// @ts-ignore - Stripe is optional dependency
import { Stripe } from "stripe";

// Initialize Stripe (requires STRIPE_SECRET_KEY environment variable)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    })
  : null;

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface DepositConfig {
  partySize: number;
  depositAmount: number; // In cents
  depositPerPerson: number; // In cents
  isRequired: boolean;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  timeSlot?: string; // e.g., "19:00"
  minimumPartySize?: number;
}

// Default deposit configuration
const DEFAULT_DEPOSIT_CONFIG: DepositConfig[] = [
  {
    partySize: 8,
    depositAmount: 2000, // $20 per person
    depositPerPerson: 2000,
    isRequired: true,
    minimumPartySize: 8,
  },
  {
    partySize: 6,
    depositAmount: 2500, // $25 per person for weekend prime time
    depositPerPerson: 2500,
    isRequired: true,
    dayOfWeek: 5, // Friday
    timeSlot: "19:00",
  },
  {
    partySize: 6,
    depositAmount: 2500,
    depositPerPerson: 2500,
    isRequired: true,
    dayOfWeek: 6, // Saturday
    timeSlot: "19:00",
  },
];

// Check if deposit is required for a booking
export function isDepositRequired(
  partySize: number,
  date: string,
  time: string,
): { required: boolean; amount?: number; reason?: string } {
  if (!stripe) {
    console.warn("Stripe not configured - deposits disabled");
    return { required: false };
  }

  const bookingDate = new Date(date + "T00:00:00");
  const dayOfWeek = bookingDate.getDay();

  // Check against configuration
  for (const config of DEFAULT_DEPOSIT_CONFIG) {
    // Check party size requirement
    if (config.minimumPartySize && partySize >= config.minimumPartySize) {
      const amount = partySize * config.depositPerPerson;
      return {
        required: true,
        amount,
        reason: `Large party deposit: $${(amount / 100).toFixed(2)} ($${(config.depositPerPerson / 100).toFixed(2)} per person)`,
      };
    }

    // Check day/time specific requirements
    if (
      config.dayOfWeek !== undefined &&
      config.timeSlot &&
      dayOfWeek === config.dayOfWeek &&
      time === config.timeSlot &&
      partySize >= config.partySize
    ) {
      const amount = partySize * config.depositPerPerson;
      return {
        required: true,
        amount,
        reason: `Peak time deposit: $${(amount / 100).toFixed(2)} for ${getDayName(dayOfWeek)} at ${formatTime(time)}`,
      };
    }
  }

  return { required: false };
}

// Create a payment intent for deposit
export async function createDepositPaymentIntent(
  bookingId: string,
  amount: number, // In cents
  customerEmail?: string,
  metadata?: Record<string, string>,
): Promise<PaymentIntent> {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.",
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Booking deposit for reservation ${bookingId}`,
      receipt_email: customerEmail,
      metadata: {
        bookingId,
        type: "deposit",
        ...metadata,
      },
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret || "",
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error("Failed to create payment intent");
  }
}

// Confirm a payment
export async function confirmPayment(
  paymentIntentId: string,
): Promise<{ success: boolean; status: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: paymentIntent.status === "succeeded",
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error("Error confirming payment:", error);
    throw new Error("Failed to confirm payment");
  }
}

// Refund a deposit
export async function refundDeposit(
  paymentIntentId: string,
  amount?: number, // Optional partial refund amount in cents
  reason?: string,
): Promise<{ success: boolean; refundId: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // If undefined, full refund
      reason: reason as any,
    });

    return {
      success: refund.status === "succeeded",
      refundId: refund.id,
    };
  } catch (error) {
    console.error("Error creating refund:", error);
    throw new Error("Failed to refund deposit");
  }
}

// Calculate refund amount based on cancellation policy
export function calculateRefund(
  depositAmount: number,
  bookingDate: string,
  bookingTime: string,
  cancellationDate: Date = new Date(),
): { refundAmount: number; refundPercentage: number; reason: string } {
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
  const hoursUntilBooking =
    (bookingDateTime.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);

  // Cancellation policy:
  // - More than 48 hours: 100% refund
  // - 24-48 hours: 50% refund
  // - Less than 24 hours: No refund

  if (hoursUntilBooking >= 48) {
    return {
      refundAmount: depositAmount,
      refundPercentage: 100,
      reason: "Cancelled more than 48 hours in advance",
    };
  } else if (hoursUntilBooking >= 24) {
    return {
      refundAmount: Math.floor(depositAmount * 0.5),
      refundPercentage: 50,
      reason: "Cancelled 24-48 hours in advance",
    };
  } else if (hoursUntilBooking >= 0) {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      reason: "Cancelled less than 24 hours in advance (no refund per policy)",
    };
  } else {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      reason: "Cancelled after booking time",
    };
  }
}

// Get payment status
export async function getPaymentStatus(paymentIntentId: string): Promise<{
  status: string;
  amount: number;
  paid: boolean;
  refunded: boolean;
}> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      paid: paymentIntent.status === "succeeded",
      refunded: paymentIntent.amount_received < paymentIntent.amount,
    };
  } catch (error) {
    console.error("Error getting payment status:", error);
    throw new Error("Failed to get payment status");
  }
}

// Create a setup intent for saving payment methods
export async function createSetupIntent(
  customerId?: string,
): Promise<{ clientSecret: string; setupIntentId: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ["card"],
      customer: customerId,
    });

    return {
      clientSecret: setupIntent.client_secret || "",
      setupIntentId: setupIntent.id,
    };
  } catch (error) {
    console.error("Error creating setup intent:", error);
    throw new Error("Failed to create setup intent");
  }
}

// Charge a saved payment method
export async function chargeNoShowFee(
  paymentMethodId: string,
  amount: number,
  bookingId: string,
  customerEmail?: string,
): Promise<{ success: boolean; chargeId: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      description: `No-show fee for booking ${bookingId}`,
      receipt_email: customerEmail,
      metadata: {
        bookingId,
        type: "no_show_fee",
      },
    });

    return {
      success: paymentIntent.status === "succeeded",
      chargeId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Error charging no-show fee:", error);
    throw new Error("Failed to charge no-show fee");
  }
}

// Helper: Get day name
function getDayName(dayOfWeek: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayOfWeek];
}

// Helper: Format time
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(
  event: any,
): Promise<{ processed: boolean; message: string }> {
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);
        // TODO: Update booking status to confirmed
        // TODO: Send confirmation email/SMS
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("Payment failed:", failedPayment.id);
        // TODO: Notify customer and restaurant
        break;

      case "charge.refunded":
        const refund = event.data.object;
        console.log("Refund processed:", refund.id);
        // TODO: Update booking status
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return {
      processed: true,
      message: `Event ${event.type} processed successfully`,
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      processed: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
