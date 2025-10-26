/**
 * Loyalty Service
 *
 * Manages customer loyalty program with points, tiers, rewards, and special offers.
 * Integrates with booking system to track visits and provide personalized benefits.
 */

import { db } from '@/lib/firebase-config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  Timestamp,
  increment,
  orderBy,
  limit,
} from 'firebase/firestore';

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LoyaltyProfile {
  userId: string;
  points: number;
  tier: LoyaltyTier;
  lifetimePoints: number;
  lifetimeSpend: number;
  totalVisits: number;
  joinDate: Date;
  lastActivityDate: Date;
  tierExpiryDate?: Date;
  achievements: string[];
  preferences: {
    favoriteItems: string[];
    favoriteOccasions: string[];
    preferredTimes: string[];
  };
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
  points: number;
  balance: number;
  reason: string;
  bookingId?: string;
  rewardId?: string;
  timestamp: Date;
  expiryDate?: Date;
  metadata?: Record<string, any>;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'freeItem' | 'upgrade' | 'experience' | 'special';
  value: number; // Dollar value
  active: boolean;
  expiryDays?: number;
  minTier?: LoyaltyTier;
  maxRedemptionsPerUser?: number;
  totalAvailable?: number;
  imageUrl?: string;
  terms?: string;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  pointsRedeemed: number;
  redeemedAt: Date;
  expiresAt?: Date;
  usedAt?: Date;
  bookingId?: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  code: string;
}

export interface TierBenefit {
  tier: LoyaltyTier;
  pointsRequired: number;
  benefits: string[];
  pointsMultiplier: number;
  priorityBooking: boolean;
  specialOccasionBonus: number;
  birthdayReward?: string;
  exclusiveRewards: string[];
}

export interface SpecialOffer {
  id: string;
  name: string;
  description: string;
  type: 'bonus_points' | 'discount' | 'free_item' | 'upgrade';
  value: number;
  minTier?: LoyaltyTier;
  validFrom: Date;
  validUntil: Date;
  conditions?: {
    minSpend?: number;
    dayOfWeek?: number[];
    timeSlot?: string[];
    firstTimeOnly?: boolean;
  };
  active: boolean;
  maxRedemptions?: number;
  currentRedemptions: number;
}

class LoyaltyService {
  private loyaltyProfilesCollection = collection(db, 'loyalty_profiles');
  private transactionsCollection = collection(db, 'loyalty_transactions');
  private rewardsCollection = collection(db, 'loyalty_rewards');
  private redeemedRewardsCollection = collection(db, 'redeemed_rewards');
  private specialOffersCollection = collection(db, 'special_offers');

  // Tier configuration
  private tierBenefits: TierBenefit[] = [
    {
      tier: 'bronze',
      pointsRequired: 0,
      benefits: ['Earn 1 point per dollar', 'Birthday reward'],
      pointsMultiplier: 1,
      priorityBooking: false,
      specialOccasionBonus: 0,
      exclusiveRewards: [],
    },
    {
      tier: 'silver',
      pointsRequired: 500,
      benefits: ['Earn 1.25 points per dollar', 'Priority reservations', 'Birthday reward + dessert'],
      pointsMultiplier: 1.25,
      priorityBooking: true,
      specialOccasionBonus: 50,
      birthdayReward: 'free_dessert',
      exclusiveRewards: ['silver_exclusive_1'],
    },
    {
      tier: 'gold',
      pointsRequired: 1500,
      benefits: ['Earn 1.5 points per dollar', 'Free valet parking', 'Complimentary appetizer on birthday'],
      pointsMultiplier: 1.5,
      priorityBooking: true,
      specialOccasionBonus: 100,
      birthdayReward: 'free_appetizer',
      exclusiveRewards: ['silver_exclusive_1', 'gold_exclusive_1', 'gold_exclusive_2'],
    },
    {
      tier: 'platinum',
      pointsRequired: 3000,
      benefits: ['Earn 2 points per dollar', 'Chef\'s table access', 'Annual dining voucher'],
      pointsMultiplier: 2,
      priorityBooking: true,
      specialOccasionBonus: 200,
      birthdayReward: 'chefs_special',
      exclusiveRewards: ['silver_exclusive_1', 'gold_exclusive_1', 'gold_exclusive_2', 'platinum_exclusive_1'],
    },
    {
      tier: 'diamond',
      pointsRequired: 5000,
      benefits: ['Earn 2.5 points per dollar', 'Private dining room', 'Exclusive events', 'Personal concierge'],
      pointsMultiplier: 2.5,
      priorityBooking: true,
      specialOccasionBonus: 500,
      birthdayReward: 'premium_experience',
      exclusiveRewards: ['silver_exclusive_1', 'gold_exclusive_1', 'gold_exclusive_2', 'platinum_exclusive_1', 'diamond_exclusive_1'],
    },
  ];

  /**
   * Get or create loyalty profile for user
   */
  async getOrCreateProfile(userId: string): Promise<LoyaltyProfile> {
    try {
      const docRef = doc(this.loyaltyProfilesCollection, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          joinDate: data.joinDate.toDate(),
          lastActivityDate: data.lastActivityDate.toDate(),
          tierExpiryDate: data.tierExpiryDate?.toDate(),
        } as LoyaltyProfile;
      }

      // Create new profile
      const newProfile: LoyaltyProfile = {
        userId,
        points: 0,
        tier: 'bronze',
        lifetimePoints: 0,
        lifetimeSpend: 0,
        totalVisits: 0,
        joinDate: new Date(),
        lastActivityDate: new Date(),
        achievements: [],
        preferences: {
          favoriteItems: [],
          favoriteOccasions: [],
          preferredTimes: [],
        },
      };

      await setDoc(docRef, {
        ...newProfile,
        joinDate: Timestamp.fromDate(newProfile.joinDate),
        lastActivityDate: Timestamp.fromDate(newProfile.lastActivityDate),
      });

      return newProfile;
    } catch (error) {
      console.error('Error getting/creating loyalty profile:', error);
      throw error;
    }
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const tierBenefit = this.getTierBenefit(profile.tier);
      const multipliedPoints = Math.floor(points * tierBenefit.pointsMultiplier);

      const profileRef = doc(this.loyaltyProfilesCollection, userId);
      await updateDoc(profileRef, {
        points: increment(multipliedPoints),
        lifetimePoints: increment(multipliedPoints),
        lastActivityDate: Timestamp.now(),
      });

      // Record transaction
      await this.recordTransaction({
        userId,
        type: 'earn',
        points: multipliedPoints,
        balance: profile.points + multipliedPoints,
        reason,
        timestamp: new Date(),
        expiryDate: this.calculatePointsExpiry(),
        metadata,
      });

      // Check for tier upgrade
      await this.checkTierUpgrade(userId);
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Award points for a booking
   */
  async awardPointsForBooking(
    userId: string,
    bookingId: string,
    totalSpend: number,
    isSpecialOccasion: boolean = false
  ): Promise<number> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const tierBenefit = this.getTierBenefit(profile.tier);

      // Base points (1 point per dollar before multiplier)
      let points = Math.floor(totalSpend);

      // Apply tier multiplier
      points = Math.floor(points * tierBenefit.pointsMultiplier);

      // Special occasion bonus
      if (isSpecialOccasion) {
        points += tierBenefit.specialOccasionBonus;
      }

      // Check for applicable special offers
      const offers = await this.getApplicableOffers(userId, totalSpend);
      let bonusPoints = 0;
      for (const offer of offers) {
        if (offer.type === 'bonus_points') {
          bonusPoints += offer.value;
        }
      }

      const totalPoints = points + bonusPoints;

      await this.awardPoints(
        userId,
        totalPoints,
        `Dining visit - $${totalSpend.toFixed(2)}`,
        { bookingId, totalSpend, isSpecialOccasion, bonusPoints }
      );

      // Update visit count and spend
      const profileRef = doc(this.loyaltyProfilesCollection, userId);
      await updateDoc(profileRef, {
        totalVisits: increment(1),
        lifetimeSpend: increment(totalSpend),
      });

      return totalPoints;
    } catch (error) {
      console.error('Error awarding points for booking:', error);
      throw error;
    }
  }

  /**
   * Redeem points for a reward
   */
  async redeemReward(userId: string, rewardId: string): Promise<RedeemedReward | null> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const reward = await this.getReward(rewardId);

      if (!reward || !reward.active) {
        throw new Error('Reward not available');
      }

      // Check if user has enough points
      if (profile.points < reward.pointsCost) {
        throw new Error('Insufficient points');
      }

      // Check tier requirement
      if (reward.minTier && !this.meetsMinTier(profile.tier, reward.minTier)) {
        throw new Error('Tier requirement not met');
      }

      // Check redemption limits
      if (reward.maxRedemptionsPerUser) {
        const userRedemptions = await this.getUserRedemptionCount(userId, rewardId);
        if (userRedemptions >= reward.maxRedemptionsPerUser) {
          throw new Error('Maximum redemptions reached');
        }
      }

      // Deduct points
      const profileRef = doc(this.loyaltyProfilesCollection, userId);
      await updateDoc(profileRef, {
        points: increment(-reward.pointsCost),
        lastActivityDate: Timestamp.now(),
      });

      // Create redeemed reward
      const redeemedDoc = doc(this.redeemedRewardsCollection);
      const redeemed: Omit<RedeemedReward, 'id'> = {
        userId,
        rewardId,
        rewardName: reward.name,
        pointsRedeemed: reward.pointsCost,
        redeemedAt: new Date(),
        expiresAt: reward.expiryDays
          ? new Date(Date.now() + reward.expiryDays * 24 * 60 * 60 * 1000)
          : undefined,
        status: 'active',
        code: this.generateRedemptionCode(),
      };

      await setDoc(redeemedDoc, {
        ...redeemed,
        redeemedAt: Timestamp.fromDate(redeemed.redeemedAt),
        expiresAt: redeemed.expiresAt ? Timestamp.fromDate(redeemed.expiresAt) : null,
      });

      // Record transaction
      await this.recordTransaction({
        userId,
        type: 'redeem',
        points: -reward.pointsCost,
        balance: profile.points - reward.pointsCost,
        reason: `Redeemed: ${reward.name}`,
        timestamp: new Date(),
        rewardId,
      });

      return {
        id: redeemedDoc.id,
        ...redeemed,
      };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  /**
   * Get available rewards for user
   */
  async getAvailableRewards(userId: string): Promise<Reward[]> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const q = query(this.rewardsCollection, where('active', '==', true));
      const snapshot = await getDocs(q);

      const rewards = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Reward[];

      // Filter by tier and affordability
      return rewards.filter(reward => {
        // Check tier requirement
        if (reward.minTier && !this.meetsMinTier(profile.tier, reward.minTier)) {
          return false;
        }

        // Include if affordable or close to affordable (within 20% of points)
        return profile.points >= reward.pointsCost * 0.8;
      });
    } catch (error) {
      console.error('Error fetching available rewards:', error);
      return [];
    }
  }

  /**
   * Get user's redeemed rewards
   */
  async getRedeemedRewards(userId: string, status?: RedeemedReward['status']): Promise<RedeemedReward[]> {
    try {
      let q = query(
        this.redeemedRewardsCollection,
        where('userId', '==', userId),
        orderBy('redeemedAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        redeemedAt: doc.data().redeemedAt.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        usedAt: doc.data().usedAt?.toDate(),
      })) as RedeemedReward[];
    } catch (error) {
      console.error('Error fetching redeemed rewards:', error);
      return [];
    }
  }

  /**
   * Use a redeemed reward
   */
  async useRedeemedReward(rewardId: string, bookingId: string): Promise<void> {
    try {
      const rewardRef = doc(this.redeemedRewardsCollection, rewardId);
      await updateDoc(rewardRef, {
        status: 'used',
        usedAt: Timestamp.now(),
        bookingId,
      });
    } catch (error) {
      console.error('Error using redeemed reward:', error);
      throw error;
    }
  }

  /**
   * Get loyalty transaction history
   */
  async getTransactionHistory(userId: string, limitCount: number = 50): Promise<LoyaltyTransaction[]> {
    try {
      const q = query(
        this.transactionsCollection,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
      })) as LoyaltyTransaction[];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Check and upgrade user tier
   */
  private async checkTierUpgrade(userId: string): Promise<void> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const currentTierIndex = this.tierBenefits.findIndex(t => t.tier === profile.tier);

      // Check if eligible for next tier
      for (let i = currentTierIndex + 1; i < this.tierBenefits.length; i++) {
        const nextTier = this.tierBenefits[i];
        if (profile.lifetimePoints >= nextTier.pointsRequired) {
          // Upgrade tier
          const profileRef = doc(this.loyaltyProfilesCollection, userId);
          await updateDoc(profileRef, {
            tier: nextTier.tier,
            tierExpiryDate: this.calculateTierExpiry(),
          });

          // Award bonus points for tier upgrade
          await this.awardPoints(
            userId,
            nextTier.pointsRequired * 0.1,
            `Tier upgrade to ${nextTier.tier}`,
            { previousTier: profile.tier, newTier: nextTier.tier }
          );
        }
      }
    } catch (error) {
      console.error('Error checking tier upgrade:', error);
    }
  }

  /**
   * Get applicable special offers
   */
  private async getApplicableOffers(userId: string, totalSpend: number): Promise<SpecialOffer[]> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const now = new Date();

      const q = query(
        this.specialOffersCollection,
        where('active', '==', true)
      );

      const snapshot = await getDocs(q);
      const offers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom.toDate(),
        validUntil: doc.data().validUntil.toDate(),
      })) as SpecialOffer[];

      return offers.filter(offer => {
        // Check validity period
        if (now < offer.validFrom || now > offer.validUntil) return false;

        // Check tier requirement
        if (offer.minTier && !this.meetsMinTier(profile.tier, offer.minTier)) return false;

        // Check conditions
        if (offer.conditions?.minSpend && totalSpend < offer.conditions.minSpend) return false;
        if (offer.conditions?.firstTimeOnly && profile.totalVisits > 0) return false;

        // Check max redemptions
        if (offer.maxRedemptions && offer.currentRedemptions >= offer.maxRedemptions) return false;

        return true;
      });
    } catch (error) {
      console.error('Error getting applicable offers:', error);
      return [];
    }
  }

  /**
   * Record loyalty transaction
   */
  private async recordTransaction(transaction: Omit<LoyaltyTransaction, 'id'>): Promise<void> {
    try {
      const transactionDoc = doc(this.transactionsCollection);
      await setDoc(transactionDoc, {
        ...transaction,
        timestamp: Timestamp.fromDate(transaction.timestamp),
        expiryDate: transaction.expiryDate ? Timestamp.fromDate(transaction.expiryDate) : null,
      });
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  /**
   * Get tier benefit configuration
   */
  private getTierBenefit(tier: LoyaltyTier): TierBenefit {
    return this.tierBenefits.find(t => t.tier === tier) || this.tierBenefits[0];
  }

  /**
   * Check if user meets minimum tier requirement
   */
  private meetsMinTier(userTier: LoyaltyTier, minTier: LoyaltyTier): boolean {
    const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const userIndex = tierOrder.indexOf(userTier);
    const minIndex = tierOrder.indexOf(minTier);
    return userIndex >= minIndex;
  }

  /**
   * Get reward by ID
   */
  private async getReward(rewardId: string): Promise<Reward | null> {
    try {
      const docRef = doc(this.rewardsCollection, rewardId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Reward;
      }
      return null;
    } catch (error) {
      console.error('Error fetching reward:', error);
      return null;
    }
  }

  /**
   * Get user's redemption count for a specific reward
   */
  private async getUserRedemptionCount(userId: string, rewardId: string): Promise<number> {
    try {
      const q = query(
        this.redeemedRewardsCollection,
        where('userId', '==', userId),
        where('rewardId', '==', rewardId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting redemption count:', error);
      return 0;
    }
  }

  /**
   * Calculate points expiry date (1 year from now)
   */
  private calculatePointsExpiry(): Date {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  /**
   * Calculate tier expiry date (1 year from now)
   */
  private calculateTierExpiry(): Date {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  /**
   * Generate unique redemption code
   */
  private generateRedemptionCode(): string {
    return `RWD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  /**
   * Get loyalty status summary for user
   */
  async getLoyaltyStatus(userId: string): Promise<{
    profile: LoyaltyProfile;
    tierBenefit: TierBenefit;
    pointsToNextTier: number;
    nextTier?: LoyaltyTier;
    activeRewards: RedeemedReward[];
    recommendedRewards: Reward[];
  }> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const tierBenefit = this.getTierBenefit(profile.tier);

      // Find next tier
      const currentTierIndex = this.tierBenefits.findIndex(t => t.tier === profile.tier);
      const nextTierBenefit = this.tierBenefits[currentTierIndex + 1];
      const pointsToNextTier = nextTierBenefit
        ? nextTierBenefit.pointsRequired - profile.lifetimePoints
        : 0;

      // Get active redeemed rewards
      const activeRewards = await this.getRedeemedRewards(userId, 'active');

      // Get recommended rewards (top 3 affordable)
      const availableRewards = await this.getAvailableRewards(userId);
      const recommendedRewards = availableRewards
        .filter(r => profile.points >= r.pointsCost)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      return {
        profile,
        tierBenefit,
        pointsToNextTier,
        nextTier: nextTierBenefit?.tier,
        activeRewards,
        recommendedRewards,
      };
    } catch (error) {
      console.error('Error getting loyalty status:', error);
      throw error;
    }
  }

  /**
   * Format loyalty status for chat display
   */
  formatLoyaltyStatus(status: {
    profile: LoyaltyProfile;
    tierBenefit: TierBenefit;
    pointsToNextTier: number;
    nextTier?: LoyaltyTier;
  }): string {
    const tierEmojis: Record<LoyaltyTier, string> = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
      diamond: '👑',
    };

    let message = `**Your Loyalty Status** ${tierEmojis[status.profile.tier]}\n\n`;
    message += `**Tier:** ${status.profile.tier.toUpperCase()}\n`;
    message += `**Points:** ${status.profile.points}\n`;
    message += `**Total Visits:** ${status.profile.totalVisits}\n\n`;

    if (status.nextTier) {
      message += `**Next Tier:** ${status.nextTier.toUpperCase()} ${tierEmojis[status.nextTier]}\n`;
      message += `**Points Needed:** ${status.pointsToNextTier}\n\n`;
    } else {
      message += `**Status:** Maximum tier achieved! 🎉\n\n`;
    }

    message += `**Benefits:**\n`;
    status.tierBenefit.benefits.forEach(benefit => {
      message += `• ${benefit}\n`;
    });

    return message;
  }
}

export const loyaltyService = new LoyaltyService();
