import { z } from 'zod';
import type { BookingDetails } from '@/lib/types';

// Zod schemas for validation
export const BookingDetailsSchema = z.object({
  partySize: z
    .number()
    .min(1, 'Party size must be at least 1')
    .max(20, 'Party size cannot exceed 20. Please contact us for larger groups.')
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format')
    .optional(),
  occasion: z.string().max(100, 'Occasion description is too long').optional(),
  specialRequests: z.string().max(500, 'Special requests are too long').optional(),
  availableSlots: z.array(z.string()).optional(),
});

export const CustomerInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').optional(),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number is too short')
    .optional(),
});

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: keyof BookingDetails | 'customer';
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: keyof BookingDetails | 'customer';
  message: string;
  suggestion?: string;
}

// Business rules validation
export function validateBookingDetails(
  details: Partial<BookingDetails>,
  strictMode = false
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  // Validate party size
  if (details.partySize !== undefined) {
    if (details.partySize < 1) {
      errors.push({
        field: 'partySize',
        message: 'Party size must be at least 1',
        severity: 'error',
      });
    } else if (details.partySize > 20) {
      errors.push({
        field: 'partySize',
        message: 'Party size exceeds maximum capacity',
        severity: 'error',
      });
      suggestions.push(
        'For parties larger than 20 guests, please contact our events coordinator at (555) 123-4567'
      );
    } else if (details.partySize >= 12) {
      warnings.push({
        field: 'partySize',
        message: 'Large party (12+ guests) may require special arrangements',
        suggestion: 'Consider adding special requests or calling ahead',
      });
    } else if (details.partySize >= 8) {
      suggestions.push(
        'For parties of 8 or more, we recommend our chef\'s tasting menu'
      );
    }
  } else if (strictMode) {
    errors.push({
      field: 'partySize',
      message: 'Party size is required',
      severity: 'error',
    });
  }

  // Validate date
  if (details.date) {
    const bookingDate = new Date(details.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntil = Math.floor(
      (bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (bookingDate < today) {
      errors.push({
        field: 'date',
        message: 'Cannot book a date in the past',
        severity: 'error',
      });
    } else if (daysUntil > 90) {
      errors.push({
        field: 'date',
        message: 'Bookings are only available up to 90 days in advance',
        severity: 'error',
      });
      suggestions.push('Please select a date within the next 90 days');
    } else if (daysUntil === 0) {
      warnings.push({
        field: 'date',
        message: 'Same-day booking - availability may be limited',
        suggestion: 'We recommend calling ahead for same-day reservations',
      });
    } else if (daysUntil === 1) {
      suggestions.push(
        'Booking for tomorrow - limited availability. Please check available time slots'
      );
    } else if (daysUntil < 7) {
      suggestions.push('Booking within a week - some time slots may be unavailable');
    }

    // Check if date is a weekend
    const dayOfWeek = bookingDate.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      suggestions.push(
        'Weekend booking - our busiest time! Book early for best availability'
      );
    }
  } else if (strictMode) {
    errors.push({
      field: 'date',
      message: 'Date is required',
      severity: 'error',
    });
  }

  // Validate time
  if (details.time) {
    const [hours, minutes] = details.time.split(':').map(Number);

    // Restaurant hours: 5:00 PM (17:00) to 10:00 PM (22:00)
    if (hours < 17 || hours >= 22) {
      errors.push({
        field: 'time',
        message: 'Time is outside restaurant hours (5:00 PM - 10:00 PM)',
        severity: 'error',
      });
      suggestions.push('Please select a time between 5:00 PM and 10:00 PM');
    }

    // Check for popular times
    if (hours === 19 || hours === 20) {
      suggestions.push(
        'This is a popular time slot and may fill up quickly. Consider booking earlier or later for more availability.'
      );
    }

    // Check if time is in 30-minute increments
    if (minutes !== 0 && minutes !== 30) {
      warnings.push({
        field: 'time',
        message: 'We recommend booking in 30-minute increments',
        suggestion: 'Try selecting a time on the hour or half-hour',
      });
    }
  } else if (strictMode) {
    errors.push({
      field: 'time',
      message: 'Time is required',
      severity: 'error',
    });
  }

  // Validate occasion
  if (details.occasion && details.occasion.length > 100) {
    warnings.push({
      field: 'occasion',
      message: 'Occasion description is very long',
      suggestion: 'Please keep occasion details brief',
    });
  }

  // Validate special requests
  if (details.specialRequests && details.specialRequests.length > 500) {
    errors.push({
      field: 'specialRequests',
      message: 'Special requests are too long (max 500 characters)',
      severity: 'error',
    });
  }

  // Business logic validations
  if (details.date && details.time) {
    const bookingDateTime = new Date(`${details.date}T${details.time}:00`);
    const now = new Date();
    const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 0) {
      errors.push({
        field: 'time',
        message: 'Booking time has already passed',
        severity: 'error',
      });
    } else if (hoursUntil < 2) {
      warnings.push({
        field: 'time',
        message: 'Booking is less than 2 hours away',
        suggestion:
          'We may not be able to accommodate last-minute bookings. Please call us to confirm.',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// Validate complete booking before submission
export function validateCompleteBooking(
  details: Partial<BookingDetails>
): ValidationResult {
  return validateBookingDetails(details, true);
}

// Check if booking can be modified
export function canModifyBooking(
  bookingDate: string,
  bookingTime: string,
  bookingStatus: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
): { canModify: boolean; reason?: string } {
  // Cannot modify cancelled or completed bookings
  if (bookingStatus === 'cancelled' || bookingStatus === 'completed' || bookingStatus === 'no_show') {
    return {
      canModify: false,
      reason: `Cannot modify ${bookingStatus} bookings`,
    };
  }

  // Cannot modify if already seated
  if (bookingStatus === 'seated') {
    return {
      canModify: false,
      reason: 'Cannot modify a booking that is currently in progress',
    };
  }

  // Check if booking is too close (less than 2 hours)
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
  const now = new Date();
  const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 2) {
    return {
      canModify: false,
      reason: 'Cannot modify bookings less than 2 hours before the reservation time. Please call us at (555) 123-4567.',
    };
  }

  return { canModify: true };
}

// Check if booking can be cancelled
export function canCancelBooking(
  bookingDate: string,
  bookingTime: string,
  bookingStatus: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
): { canCancel: boolean; reason?: string; willCharge?: boolean } {
  // Already cancelled
  if (bookingStatus === 'cancelled') {
    return {
      canCancel: false,
      reason: 'This booking is already cancelled',
    };
  }

  // Cannot cancel completed bookings
  if (bookingStatus === 'completed' || bookingStatus === 'no_show') {
    return {
      canCancel: false,
      reason: `Cannot cancel ${bookingStatus} bookings`,
    };
  }

  // Cannot cancel if already seated
  if (bookingStatus === 'seated') {
    return {
      canCancel: false,
      reason: 'Cannot cancel a booking that is currently in progress. Please speak with your server.',
    };
  }

  // Check cancellation policy (24 hours)
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
  const now = new Date();
  const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 0) {
    return {
      canCancel: false,
      reason: 'Cannot cancel a past booking',
    };
  }

  if (hoursUntil < 24) {
    return {
      canCancel: true,
      reason: 'Cancelling with less than 24 hours notice',
      willCharge: true, // Cancellation fee may apply
    };
  }

  return { canCancel: true, willCharge: false };
}

// Validate customer information
export function validateCustomerInfo(info: {
  name?: string;
  email?: string;
  phone?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: string[] = [];

  if (!info.name || info.name.length < 2) {
    errors.push({
      field: 'customer',
      message: 'Name is required and must be at least 2 characters',
      severity: 'error',
    });
  }

  if (!info.email && !info.phone) {
    errors.push({
      field: 'customer',
      message: 'Either email or phone number is required',
      severity: 'error',
    });
    suggestions.push('We need a way to contact you about your reservation');
  }

  if (info.email && !z.string().email().safeParse(info.email).success) {
    errors.push({
      field: 'customer',
      message: 'Invalid email address',
      severity: 'error',
    });
  }

  if (info.phone && info.phone.length < 10) {
    errors.push({
      field: 'customer',
      message: 'Phone number is too short',
      severity: 'error',
    });
  }

  if (!info.email && info.phone) {
    suggestions.push('Add your email to receive booking confirmations and updates');
  }

  if (!info.phone && info.email) {
    suggestions.push('Add your phone number for SMS reminders (optional)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// Helper to get user-friendly error messages
export function getErrorMessage(result: ValidationResult): string {
  if (result.isValid) return '';

  const criticalErrors = result.errors.filter((e) => e.severity === 'critical');
  if (criticalErrors.length > 0) {
    return criticalErrors[0].message;
  }

  if (result.errors.length > 0) {
    return result.errors[0].message;
  }

  return 'Please check your booking details';
}

// Helper to check if a field has errors
export function hasFieldError(
  result: ValidationResult,
  field: keyof BookingDetails | 'customer'
): boolean {
  return result.errors.some((e) => e.field === field);
}

// Helper to get field-specific errors
export function getFieldErrors(
  result: ValidationResult,
  field: keyof BookingDetails | 'customer'
): string[] {
  return result.errors.filter((e) => e.field === field).map((e) => e.message);
}
