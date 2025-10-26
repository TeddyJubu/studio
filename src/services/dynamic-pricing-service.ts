/**
 * Dynamic Pricing Service
 *
 * Implements dynamic pricing strategies for restaurant bookings.
 * Adjusts deposit amounts and pricing based on demand, time, party size, and other factors.
 */

import { db } from '@/lib/firebase-config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  priority: number; // Higher priority rules apply first
  conditions: PricingCondition[];
  adjustment: PriceAdjustment;
  validFrom?: Date;
  validUntil?: Date;
}

export interface PricingCondition {
  type: 'time_slot' | 'day_of_week' | 'party_size' | 'advance_booking' | 'occupancy' | 'special_date';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
}

export interface PriceAdjustment {
  type: 'percentage' | 'fixed_amount' | 'multiplier';
  value: number;
  minPrice?: number;
  maxPrice?: number;
  roundTo?: number; // Round to nearest X (e.g., 5 for $5 increments)
}

export interface PricingCalculation {
  basePrice: number;
  adjustments: AppliedAdjustment[];
  finalPrice: number;
  appliedRules: string[];
  breakdown: string;
}

export interface AppliedAdjustment {
  ruleName: string;
  ruleDescription: string;
  adjustmentAmount: number;
  reason: string;
}

export interface OccupancyData {
  date: string;
  timeSlot: string;
  totalCapacity: number;
  bookedSeats: number;
  occupancyRate: number;
}

export interface SpecialDate {
  date: string;
  name: string; // e.g., "Valentine's Day", "New Year's Eve"
  priceMultiplier: number;
  description: string;
}

class DynamicPricingService {
  private pricingRulesCollection = collection(db, 'pricing_rules');
  private occupancyCollection = collection(db, 'occupancy_data');
  private specialDatesCollection = collection(db, 'special_dates');
  private baseDepositAmount = 20; // Default base deposit
  private restaurantCapacity = 100; // Total seats

  /**
   * Calculate price for a booking
   */
  async calculatePrice(bookingDetails: {
    date: string;
    time: string;
    partySize: number;
    occasion?: string;
  }): Promise<PricingCalculation> {
    const basePrice = this.baseDepositAmount;
    const adjustments: AppliedAdjustment[] = [];
    const appliedRules: string[] = [];

    // Get active pricing rules
    const rules = await this.getActivePricingRules();

    // Sort by priority (highest first)
    rules.sort((a, b) => b.priority - a.priority);

    let currentPrice = basePrice;

    // Apply each matching rule
    for (const rule of rules) {
      if (await this.ruleMatches(rule, bookingDetails)) {
        const adjustmentAmount = this.calculateAdjustment(
          currentPrice,
          rule.adjustment
        );

        adjustments.push({
          ruleName: rule.name,
          ruleDescription: rule.description,
          adjustmentAmount,
          reason: this.getRuleReason(rule, bookingDetails),
        });

        currentPrice += adjustmentAmount;
        appliedRules.push(rule.name);

        // Apply min/max constraints
        if (rule.adjustment.minPrice && currentPrice < rule.adjustment.minPrice) {
          currentPrice = rule.adjustment.minPrice;
        }
        if (rule.adjustment.maxPrice && currentPrice > rule.adjustment.maxPrice) {
          currentPrice = rule.adjustment.maxPrice;
        }
      }
    }

    // Round to nearest increment if specified
    const finalPrice = this.roundPrice(currentPrice);

    // Generate breakdown
    const breakdown = this.generateBreakdown(basePrice, adjustments, finalPrice);

    return {
      basePrice,
      adjustments,
      finalPrice,
      appliedRules,
      breakdown,
    };
  }

  /**
   * Check if a pricing rule matches the booking
   */
  private async ruleMatches(
    rule: PricingRule,
    bookingDetails: {
      date: string;
      time: string;
      partySize: number;
      occasion?: string;
    }
  ): Promise<boolean> {
    // Check validity period
    const now = new Date();
    if (rule.validFrom && now < rule.validFrom) return false;
    if (rule.validUntil && now > rule.validUntil) return false;

    // Check all conditions
    for (const condition of rule.conditions) {
      if (!(await this.conditionMatches(condition, bookingDetails))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a single condition matches
   */
  private async conditionMatches(
    condition: PricingCondition,
    bookingDetails: {
      date: string;
      time: string;
      partySize: number;
      occasion?: string;
    }
  ): Promise<boolean> {
    switch (condition.type) {
      case 'time_slot': {
        const bookingTime = this.parseTime(bookingDetails.time);
        const conditionTime = this.parseTime(condition.value);
        return this.compareValues(bookingTime, conditionTime, condition.operator);
      }

      case 'day_of_week': {
        const bookingDate = new Date(bookingDetails.date);
        const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 6 = Saturday
        return this.compareValues(dayOfWeek, condition.value, condition.operator);
      }

      case 'party_size': {
        return this.compareValues(bookingDetails.partySize, condition.value, condition.operator);
      }

      case 'advance_booking': {
        const bookingDate = new Date(bookingDetails.date);
        const today = new Date();
        const daysInAdvance = Math.ceil(
          (bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return this.compareValues(daysInAdvance, condition.value, condition.operator);
      }

      case 'occupancy': {
        const occupancy = await this.getOccupancyRate(bookingDetails.date, bookingDetails.time);
        return this.compareValues(occupancy, condition.value, condition.operator);
      }

      case 'special_date': {
        const isSpecial = await this.isSpecialDate(bookingDetails.date);
        return condition.operator === 'equals' ? isSpecial === condition.value : !isSpecial;
      }

      default:
        return false;
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(actual: any, expected: any, operator: PricingCondition['operator']): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'between':
        return actual >= expected[0] && actual <= expected[1];
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      default:
        return false;
    }
  }

  /**
   * Calculate adjustment amount
   */
  private calculateAdjustment(currentPrice: number, adjustment: PriceAdjustment): number {
    switch (adjustment.type) {
      case 'percentage':
        return currentPrice * (adjustment.value / 100);
      case 'fixed_amount':
        return adjustment.value;
      case 'multiplier':
        return currentPrice * adjustment.value - currentPrice;
      default:
        return 0;
    }
  }

  /**
   * Get active pricing rules
   */
  async getActivePricingRules(): Promise<PricingRule[]> {
    try {
      const q = query(this.pricingRulesCollection, where('active', '==', true));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          validFrom: data.validFrom?.toDate(),
          validUntil: data.validUntil?.toDate(),
        } as PricingRule;
      });
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      return [];
    }
  }

  /**
   * Get occupancy rate for a specific date and time
   */
  async getOccupancyRate(date: string, time: string): Promise<number> {
    try {
      const q = query(
        this.occupancyCollection,
        where('date', '==', date),
        where('timeSlot', '==', time)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as OccupancyData;
        return data.occupancyRate;
      }

      // Default to 0 if no data
      return 0;
    } catch (error) {
      console.error('Error fetching occupancy:', error);
      return 0;
    }
  }

  /**
   * Check if a date is a special date
   */
  async isSpecialDate(date: string): Promise<boolean> {
    try {
      const q = query(this.specialDatesCollection, where('date', '==', date));
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking special date:', error);
      return false;
    }
  }

  /**
   * Get special date information
   */
  async getSpecialDate(date: string): Promise<SpecialDate | null> {
    try {
      const q = query(this.specialDatesCollection, where('date', '==', date));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return data as SpecialDate;
      }
      return null;
    } catch (error) {
      console.error('Error fetching special date:', error);
      return null;
    }
  }

  /**
   * Update occupancy data
   */
  async updateOccupancy(date: string, time: string, bookedSeats: number): Promise<void> {
    try {
      const occupancyRate = (bookedSeats / this.restaurantCapacity) * 100;

      const q = query(
        this.occupancyCollection,
        where('date', '==', date),
        where('timeSlot', '==', time)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          bookedSeats,
          occupancyRate,
        });
      } else {
        const docRef = doc(this.occupancyCollection);
        await setDoc(docRef, {
          date,
          timeSlot: time,
          totalCapacity: this.restaurantCapacity,
          bookedSeats,
          occupancyRate,
        });
      }
    } catch (error) {
      console.error('Error updating occupancy:', error);
    }
  }

  /**
   * Create a new pricing rule
   */
  async createPricingRule(rule: Omit<PricingRule, 'id'>): Promise<string> {
    try {
      const ruleDoc = doc(this.pricingRulesCollection);
      await setDoc(ruleDoc, {
        ...rule,
        validFrom: rule.validFrom ? Timestamp.fromDate(rule.validFrom) : null,
        validUntil: rule.validUntil ? Timestamp.fromDate(rule.validUntil) : null,
      });

      return ruleDoc.id;
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      throw error;
    }
  }

  /**
   * Get pricing rule by ID
   */
  async getPricingRule(ruleId: string): Promise<PricingRule | null> {
    try {
      const docRef = doc(this.pricingRulesCollection, ruleId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          validFrom: data.validFrom?.toDate(),
          validUntil: data.validUntil?.toDate(),
        } as PricingRule;
      }
      return null;
    } catch (error) {
      console.error('Error fetching pricing rule:', error);
      return null;
    }
  }

  /**
   * Update pricing rule
   */
  async updatePricingRule(ruleId: string, updates: Partial<PricingRule>): Promise<void> {
    try {
      const ruleRef = doc(this.pricingRulesCollection, ruleId);
      const updateData: any = { ...updates };

      if (updates.validFrom) {
        updateData.validFrom = Timestamp.fromDate(updates.validFrom);
      }
      if (updates.validUntil) {
        updateData.validUntil = Timestamp.fromDate(updates.validUntil);
      }

      await updateDoc(ruleRef, updateData);
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      throw error;
    }
  }

  /**
   * Parse time string to minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    let totalHours = hours;
    if (period === 'PM' && hours !== 12) {
      totalHours += 12;
    } else if (period === 'AM' && hours === 12) {
      totalHours = 0;
    }

    return totalHours * 60 + minutes;
  }

  /**
   * Round price to nearest increment
   */
  private roundPrice(price: number, roundTo: number = 5): number {
    return Math.round(price / roundTo) * roundTo;
  }

  /**
   * Generate pricing breakdown text
   */
  private generateBreakdown(
    basePrice: number,
    adjustments: AppliedAdjustment[],
    finalPrice: number
  ): string {
    let breakdown = `Base deposit: $${basePrice.toFixed(2)}\n`;

    adjustments.forEach(adj => {
      const sign = adj.adjustmentAmount >= 0 ? '+' : '';
      breakdown += `${adj.ruleName}: ${sign}$${adj.adjustmentAmount.toFixed(2)} (${adj.reason})\n`;
    });

    breakdown += `\nFinal deposit: $${finalPrice.toFixed(2)}`;
    return breakdown;
  }

  /**
   * Get human-readable reason for rule application
   */
  private getRuleReason(
    rule: PricingRule,
    bookingDetails: { date: string; time: string; partySize: number }
  ): string {
    // Generate a human-readable reason based on conditions
    const reasons: string[] = [];

    rule.conditions.forEach(condition => {
      switch (condition.type) {
        case 'time_slot':
          reasons.push('prime time slot');
          break;
        case 'day_of_week':
          reasons.push('weekend/holiday');
          break;
        case 'party_size':
          reasons.push(`large party (${bookingDetails.partySize} guests)`);
          break;
        case 'advance_booking':
          reasons.push('early bird booking');
          break;
        case 'occupancy':
          reasons.push('high demand');
          break;
        case 'special_date':
          reasons.push('special occasion');
          break;
      }
    });

    return reasons.join(', ') || rule.description;
  }

  /**
   * Get pricing forecast for a date range
   */
  async getPricingForecast(
    startDate: string,
    endDate: string,
    partySize: number = 2
  ): Promise<{ date: string; time: string; price: number }[]> {
    const forecast: { date: string; time: string; price: number }[] = [];
    const timeSlots = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      for (const time of timeSlots) {
        const pricing = await this.calculatePrice({
          date: dateStr,
          time,
          partySize,
        });

        forecast.push({
          date: dateStr,
          time,
          price: pricing.finalPrice,
        });
      }
    }

    return forecast;
  }

  /**
   * Get demand-based recommendations
   */
  async getRecommendations(date: string): Promise<{
    bestValue: { time: string; price: number; savings: number };
    peakTimes: string[];
    offPeakTimes: string[];
  }> {
    const timeSlots = ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'];
    const prices: { time: string; price: number }[] = [];

    for (const time of timeSlots) {
      const pricing = await this.calculatePrice({
        date,
        time,
        partySize: 2,
      });
      prices.push({ time, price: pricing.finalPrice });
    }

    prices.sort((a, b) => a.price - b.price);

    const bestValue = prices[0];
    const maxPrice = prices[prices.length - 1].price;
    const savings = maxPrice - bestValue.price;

    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const peakTimes = prices.filter(p => p.price > avgPrice).map(p => p.time);
    const offPeakTimes = prices.filter(p => p.price <= avgPrice).map(p => p.time);

    return {
      bestValue: { ...bestValue, savings },
      peakTimes,
      offPeakTimes,
    };
  }
}

export const dynamicPricingService = new DynamicPricingService();
