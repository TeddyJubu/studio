"use server";

// @ts-ignore - Twilio is optional dependency
import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSMessage {
  to: string;
  from: string;
  body: string;
  sid?: string;
  status?: string;
}

export interface SMSTemplate {
  type:
    | "booking_confirmation"
    | "booking_reminder"
    | "booking_modified"
    | "booking_cancelled"
    | "waitlist_available"
    | "verification_code";
  data: Record<string, any>;
}

// Check if SMS service is configured
export function isSMSConfigured(): boolean {
  return !!(accountSid && authToken && twilioPhoneNumber);
}

// Send SMS message
export async function sendSMS(
  to: string,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!client || !twilioPhoneNumber) {
    console.warn("Twilio not configured - SMS disabled");
    return {
      success: false,
      error: "SMS service not configured",
    };
  }

  // Validate phone number format
  const cleanPhone = cleanPhoneNumber(to);
  if (!cleanPhone) {
    return {
      success: false,
      error: "Invalid phone number format",
    };
  }

  try {
    const message_result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: cleanPhone,
    });

    return {
      success: true,
      messageId: message_result.sid,
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

// Send booking confirmation SMS
export async function sendBookingConfirmationSMS(
  phone: string,
  data: {
    confirmationCode: string;
    customerName: string;
    partySize: number;
    date: string;
    time: string;
    restaurantName?: string;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = formatDate(data.date);
  const formattedTime = formatTime(data.time);
  const restaurantName = data.restaurantName || "MastraMind Restaurant";

  const message = `Hi ${data.customerName}! Your reservation is confirmed at ${restaurantName}.

📅 ${formattedDate}
⏰ ${formattedTime}
👥 ${data.partySize} guests
🔖 Code: ${data.confirmationCode}

Need to modify? Reply with your confirmation code or visit our website.

See you soon! 🍽️`;

  return sendSMS(phone, message);
}

// Send booking reminder SMS (24 hours before)
export async function sendBookingReminderSMS(
  phone: string,
  data: {
    confirmationCode: string;
    customerName: string;
    partySize: number;
    date: string;
    time: string;
    restaurantName?: string;
    restaurantPhone?: string;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = formatDate(data.date);
  const formattedTime = formatTime(data.time);
  const restaurantName = data.restaurantName || "MastraMind Restaurant";
  const contactInfo = data.restaurantPhone
    ? ` or call ${data.restaurantPhone}`
    : "";

  const message = `Hi ${data.customerName}! Reminder: Your reservation at ${restaurantName} is tomorrow.

📅 ${formattedDate}
⏰ ${formattedTime}
👥 ${data.partySize} guests
🔖 ${data.confirmationCode}

Reply "CONFIRM" to reconfirm${contactInfo} to modify/cancel.

Looking forward to seeing you! 🍽️`;

  return sendSMS(phone, message);
}

// Send modification confirmation SMS
export async function sendModificationConfirmationSMS(
  phone: string,
  data: {
    confirmationCode: string;
    customerName: string;
    changes: string;
    newDate?: string;
    newTime?: string;
    newPartySize?: number;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let changesText = "";

  if (data.newDate) {
    changesText += `📅 New Date: ${formatDate(data.newDate)}\n`;
  }
  if (data.newTime) {
    changesText += `⏰ New Time: ${formatTime(data.newTime)}\n`;
  }
  if (data.newPartySize) {
    changesText += `👥 New Party Size: ${data.newPartySize} guests\n`;
  }

  const message = `Hi ${data.customerName}! Your reservation has been updated.

${changesText}
🔖 Confirmation: ${data.confirmationCode}

We look forward to seeing you! 🍽️`;

  return sendSMS(phone, message);
}

// Send cancellation confirmation SMS
export async function sendCancellationConfirmationSMS(
  phone: string,
  data: {
    confirmationCode: string;
    customerName: string;
    date: string;
    time: string;
    refundInfo?: string;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = formatDate(data.date);
  const formattedTime = formatTime(data.time);
  const refundText = data.refundInfo ? `\n\n💰 ${data.refundInfo}` : "";

  const message = `Hi ${data.customerName}, your reservation has been cancelled.

📅 ${formattedDate}
⏰ ${formattedTime}
🔖 ${data.confirmationCode}${refundText}

We hope to see you another time! 🍽️`;

  return sendSMS(phone, message);
}

// Send waitlist availability notification
export async function sendWaitlistAvailableSMS(
  phone: string,
  data: {
    customerName: string;
    date: string;
    availableTimes: string[];
    waitlistId: string;
    expiresInMinutes?: number;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = formatDate(data.date);
  const timesText = data.availableTimes.map((t) => formatTime(t)).join(", ");
  const expiryText = data.expiresInMinutes
    ? `\n\n⏱️ This offer expires in ${data.expiresInMinutes} minutes.`
    : "";

  const message = `Great news, ${data.customerName}! A table is now available! 🎉

📅 ${formattedDate}
⏰ Available times: ${timesText}

Reply "BOOK" to reserve or visit our website.${expiryText}

Don't miss out! 🍽️`;

  return sendSMS(phone, message);
}

// Send verification code SMS
export async function sendVerificationCodeSMS(
  phone: string,
  data: {
    code: string;
    expiresInMinutes?: number;
  },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const expiryText = data.expiresInMinutes
    ? ` It expires in ${data.expiresInMinutes} minutes.`
    : "";

  const message = `Your MastraMind verification code is: ${data.code}${expiryText}

Do not share this code with anyone.`;

  return sendSMS(phone, message);
}

// Send template-based SMS
export async function sendTemplateSMS(
  phone: string,
  template: SMSTemplate,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  switch (template.type) {
    case "booking_confirmation":
      return sendBookingConfirmationSMS(phone, template.data as any);

    case "booking_reminder":
      return sendBookingReminderSMS(phone, template.data as any);

    case "booking_modified":
      return sendModificationConfirmationSMS(phone, template.data as any);

    case "booking_cancelled":
      return sendCancellationConfirmationSMS(phone, template.data as any);

    case "waitlist_available":
      return sendWaitlistAvailableSMS(phone, template.data as any);

    case "verification_code":
      return sendVerificationCodeSMS(phone, template.data as any);

    default:
      return {
        success: false,
        error: "Unknown template type",
      };
  }
}

// Receive and process incoming SMS (webhook handler)
export async function processIncomingSMS(
  from: string,
  body: string,
): Promise<{ response?: string; action?: string }> {
  const normalizedBody = body.trim().toUpperCase();

  // Handle common responses
  if (normalizedBody === "CONFIRM") {
    return {
      response: "Thank you for confirming! We look forward to seeing you. 🍽️",
      action: "reconfirm_booking",
    };
  }

  if (normalizedBody === "CANCEL") {
    return {
      response:
        "To cancel your reservation, please reply with your confirmation code.",
      action: "request_confirmation_code",
    };
  }

  if (normalizedBody === "BOOK") {
    return {
      response:
        "Great! Please visit our website or reply with your details to complete the booking.",
      action: "initiate_booking",
    };
  }

  if (normalizedBody === "HELP") {
    return {
      response: `Commands:
CONFIRM - Reconfirm your booking
CANCEL - Cancel your booking
BOOK - Make a new booking
HELP - Show this message

Or reply with your confirmation code for assistance.`,
      action: "show_help",
    };
  }

  // Check if it's a confirmation code (8 characters, alphanumeric)
  if (/^[A-Z0-9]{8}$/.test(normalizedBody)) {
    return {
      response: "Looking up your booking...",
      action: "lookup_booking",
    };
  }

  // Default response
  return {
    response:
      "Thanks for your message! For assistance, reply HELP or visit our website. You can also call us at (555) 123-4567.",
    action: "general_inquiry",
  };
}

// Get message status
export async function getSMSStatus(messageSid: string): Promise<{
  status: string;
  to: string;
  from: string;
  dateCreated: Date;
  errorCode?: string;
  errorMessage?: string;
}> {
  if (!client) {
    throw new Error("Twilio not configured");
  }

  try {
    const message = await client.messages(messageSid).fetch();

    return {
      status: message.status,
      to: message.to,
      from: message.from,
      dateCreated: message.dateCreated,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage || undefined,
    };
  } catch (error) {
    console.error("Error getting SMS status:", error);
    throw new Error("Failed to get SMS status");
  }
}

// Batch send SMS messages
export async function sendBatchSMS(
  messages: Array<{ to: string; body: string }>,
): Promise<{
  success: number;
  failed: number;
  results: Array<{
    to: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}> {
  const results = [];
  let success = 0;
  let failed = 0;

  for (const msg of messages) {
    const result = await sendSMS(msg.to, msg.body);
    results.push({
      to: msg.to,
      ...result,
    });

    if (result.success) {
      success++;
    } else {
      failed++;
    }

    // Add delay to respect rate limits (adjust as needed)
    await delay(100);
  }

  return { success, failed, results };
}

// Helper: Clean phone number to E.164 format
function cleanPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // US numbers: add +1 if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // Already has country code
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  // Has + already
  if (phone.startsWith("+")) {
    return phone;
  }

  // Invalid format
  return null;
}

// Helper: Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Helper: Format time
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Helper: Delay utility
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Schedule reminder SMS (to be called by a cron job)
export async function scheduleReminderSMS(
  bookingId: string,
  sendAt: Date,
): Promise<{ scheduled: boolean; jobId?: string }> {
  // TODO: Integrate with a job queue like Bull or implement with Cloud Functions
  console.log(`Scheduling reminder SMS for booking ${bookingId} at ${sendAt}`);

  return {
    scheduled: true,
    jobId: `reminder_${bookingId}_${sendAt.getTime()}`,
  };
}

// Unsubscribe from SMS notifications
export async function unsubscribeFromSMS(
  phone: string,
): Promise<{ success: boolean }> {
  // TODO: Store unsubscribe preference in database
  console.log(`Unsubscribing ${phone} from SMS notifications`);

  return {
    success: true,
  };
}

// Check if phone number is unsubscribed
export async function isUnsubscribed(phone: string): Promise<boolean> {
  // TODO: Check database for unsubscribe status
  return false;
}
