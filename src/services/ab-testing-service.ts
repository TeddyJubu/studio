/**
 * A/B Testing Service
 *
 * Provides A/B testing framework for chatbot conversation flows.
 * Tracks experiments, assigns variants, and measures conversion metrics.
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
} from 'firebase/firestore';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  variants: Variant[];
  targetMetric: 'conversion_rate' | 'booking_rate' | 'revenue' | 'satisfaction' | 'response_time';
  trafficAllocation: number; // Percentage of users in experiment (0-100)
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage allocation (0-100)
  config: Record<string, any>; // Configuration for this variant
  metrics: VariantMetrics;
}

export interface VariantMetrics {
  impressions: number;
  conversions: number;
  conversionRate: number;
  bookings: number;
  bookingRate: number;
  revenue: number;
  avgResponseTime: number;
  satisfactionScore: number;
  abandonmentRate: number;
}

export interface UserAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  converted: boolean;
  convertedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ExperimentEvent {
  userId: string;
  sessionId: string;
  experimentId: string;
  variantId: string;
  eventType: 'impression' | 'interaction' | 'conversion' | 'booking' | 'abandonment';
  eventData?: Record<string, any>;
  timestamp: Date;
}

class ABTestingService {
  private experimentsCollection = collection(db, 'experiments');
  private assignmentsCollection = collection(db, 'experiment_assignments');
  private eventsCollection = collection(db, 'experiment_events');

  /**
   * Create a new experiment
   */
  async createExperiment(experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const experimentDoc = doc(this.experimentsCollection);
      const now = Timestamp.now();

      await setDoc(experimentDoc, {
        ...experiment,
        startDate: Timestamp.fromDate(experiment.startDate),
        endDate: experiment.endDate ? Timestamp.fromDate(experiment.endDate) : null,
        createdAt: now,
        updatedAt: now,
      });

      return experimentDoc.id;
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw error;
    }
  }

  /**
   * Get active experiments
   */
  async getActiveExperiments(): Promise<Experiment[]> {
    try {
      const q = query(
        this.experimentsCollection,
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as Experiment[];
    } catch (error) {
      console.error('Error fetching active experiments:', error);
      return [];
    }
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId: string): Promise<Experiment | null> {
    try {
      const docRef = doc(this.experimentsCollection, experimentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Experiment;
      }
      return null;
    } catch (error) {
      console.error('Error fetching experiment:', error);
      return null;
    }
  }

  /**
   * Assign user to variant using weighted distribution
   */
  async assignVariant(userId: string, experimentId: string): Promise<string | null> {
    try {
      // Check if user already has assignment
      const existingAssignment = await this.getUserAssignment(userId, experimentId);
      if (existingAssignment) {
        return existingAssignment.variantId;
      }

      const experiment = await this.getExperiment(experimentId);
      if (!experiment || experiment.status !== 'active') {
        return null;
      }

      // Check if user should be included in experiment (traffic allocation)
      const random = Math.random() * 100;
      if (random > experiment.trafficAllocation) {
        return null; // User not in experiment
      }

      // Select variant based on weights
      const variantId = this.selectVariant(experiment.variants);

      // Create assignment
      const assignmentDoc = doc(this.assignmentsCollection);
      await setDoc(assignmentDoc, {
        userId,
        experimentId,
        variantId,
        assignedAt: Timestamp.now(),
        converted: false,
      });

      // Track impression
      await this.trackEvent({
        userId,
        sessionId: userId, // Use userId as session for now
        experimentId,
        variantId,
        eventType: 'impression',
        timestamp: new Date(),
      });

      return variantId;
    } catch (error) {
      console.error('Error assigning variant:', error);
      return null;
    }
  }

  /**
   * Select variant based on weighted distribution
   */
  private selectVariant(variants: Variant[]): string {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant.id;
      }
    }

    // Fallback to first variant
    return variants[0].id;
  }

  /**
   * Get user's assignment for an experiment
   */
  async getUserAssignment(userId: string, experimentId: string): Promise<UserAssignment | null> {
    try {
      const q = query(
        this.assignmentsCollection,
        where('userId', '==', userId),
        where('experimentId', '==', experimentId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
          ...data,
          assignedAt: data.assignedAt.toDate(),
          convertedAt: data.convertedAt?.toDate(),
        } as UserAssignment;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user assignment:', error);
      return null;
    }
  }

  /**
   * Track experiment event
   */
  async trackEvent(event: ExperimentEvent): Promise<void> {
    try {
      const eventDoc = doc(this.eventsCollection);
      await setDoc(eventDoc, {
        ...event,
        timestamp: Timestamp.fromDate(event.timestamp),
      });

      // Update variant metrics
      await this.updateVariantMetrics(event.experimentId, event.variantId, event.eventType);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Update variant metrics based on event
   */
  private async updateVariantMetrics(
    experimentId: string,
    variantId: string,
    eventType: ExperimentEvent['eventType']
  ): Promise<void> {
    try {
      const experimentRef = doc(this.experimentsCollection, experimentId);
      const experiment = await this.getExperiment(experimentId);

      if (!experiment) return;

      const variantIndex = experiment.variants.findIndex(v => v.id === variantId);
      if (variantIndex === -1) return;

      const updatePath = `variants.${variantIndex}.metrics`;

      switch (eventType) {
        case 'impression':
          await updateDoc(experimentRef, {
            [`${updatePath}.impressions`]: increment(1),
          });
          break;
        case 'conversion':
          await updateDoc(experimentRef, {
            [`${updatePath}.conversions`]: increment(1),
          });
          break;
        case 'booking':
          await updateDoc(experimentRef, {
            [`${updatePath}.bookings`]: increment(1),
          });
          break;
        case 'abandonment':
          await updateDoc(experimentRef, {
            [`${updatePath}.abandonmentRate`]: increment(1),
          });
          break;
      }

      // Recalculate rates
      await this.recalculateMetrics(experimentId, variantId);
    } catch (error) {
      console.error('Error updating variant metrics:', error);
    }
  }

  /**
   * Recalculate conversion and booking rates
   */
  private async recalculateMetrics(experimentId: string, variantId: string): Promise<void> {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) return;

      const variant = experiment.variants.find(v => v.id === variantId);
      if (!variant) return;

      const metrics = variant.metrics;
      const conversionRate = metrics.impressions > 0
        ? (metrics.conversions / metrics.impressions) * 100
        : 0;
      const bookingRate = metrics.impressions > 0
        ? (metrics.bookings / metrics.impressions) * 100
        : 0;

      const variantIndex = experiment.variants.findIndex(v => v.id === variantId);
      const experimentRef = doc(this.experimentsCollection, experimentId);

      await updateDoc(experimentRef, {
        [`variants.${variantIndex}.metrics.conversionRate`]: conversionRate,
        [`variants.${variantIndex}.metrics.bookingRate`]: bookingRate,
      });
    } catch (error) {
      console.error('Error recalculating metrics:', error);
    }
  }

  /**
   * Mark user as converted
   */
  async trackConversion(userId: string, experimentId: string): Promise<void> {
    try {
      const assignment = await this.getUserAssignment(userId, experimentId);
      if (!assignment || assignment.converted) return;

      const q = query(
        this.assignmentsCollection,
        where('userId', '==', userId),
        where('experimentId', '==', experimentId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const assignmentRef = snapshot.docs[0].ref;
        await updateDoc(assignmentRef, {
          converted: true,
          convertedAt: Timestamp.now(),
        });

        // Track conversion event
        await this.trackEvent({
          userId,
          sessionId: userId,
          experimentId,
          variantId: assignment.variantId,
          eventType: 'conversion',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  /**
   * Get experiment results and statistics
   */
  async getExperimentResults(experimentId: string): Promise<{
    experiment: Experiment;
    winner?: string;
    statisticalSignificance: boolean;
    recommendations: string[];
  } | null> {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) return null;

      // Calculate winner based on target metric
      const variants = experiment.variants;
      let winner: string | undefined;
      let maxValue = -Infinity;

      variants.forEach(variant => {
        const value = this.getMetricValue(variant.metrics, experiment.targetMetric);
        if (value > maxValue) {
          maxValue = value;
          winner = variant.id;
        }
      });

      // Simple statistical significance check (needs more robust implementation)
      const statisticalSignificance = this.checkSignificance(variants);

      // Generate recommendations
      const recommendations = this.generateRecommendations(experiment, variants);

      return {
        experiment,
        winner,
        statisticalSignificance,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting experiment results:', error);
      return null;
    }
  }

  /**
   * Get metric value based on target metric type
   */
  private getMetricValue(metrics: VariantMetrics, targetMetric: Experiment['targetMetric']): number {
    switch (targetMetric) {
      case 'conversion_rate':
        return metrics.conversionRate;
      case 'booking_rate':
        return metrics.bookingRate;
      case 'revenue':
        return metrics.revenue;
      case 'satisfaction':
        return metrics.satisfactionScore;
      case 'response_time':
        return -metrics.avgResponseTime; // Negative because lower is better
      default:
        return 0;
    }
  }

  /**
   * Check statistical significance (simplified)
   */
  private checkSignificance(variants: Variant[]): boolean {
    // Simplified check: need at least 100 impressions per variant
    const minImpressions = 100;
    return variants.every(v => v.metrics.impressions >= minImpressions);
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(experiment: Experiment, variants: Variant[]): string[] {
    const recommendations: string[] = [];

    // Check sample size
    const totalImpressions = variants.reduce((sum, v) => sum + v.metrics.impressions, 0);
    if (totalImpressions < 1000) {
      recommendations.push('Collect more data before making decisions (target: 1000+ total impressions)');
    }

    // Check for clear winner
    const sortedVariants = [...variants].sort((a, b) => {
      const aValue = this.getMetricValue(a.metrics, experiment.targetMetric);
      const bValue = this.getMetricValue(b.metrics, experiment.targetMetric);
      return bValue - aValue;
    });

    if (sortedVariants.length >= 2) {
      const winner = sortedVariants[0];
      const runnerUp = sortedVariants[1];
      const winnerValue = this.getMetricValue(winner.metrics, experiment.targetMetric);
      const runnerUpValue = this.getMetricValue(runnerUp.metrics, experiment.targetMetric);

      const improvement = ((winnerValue - runnerUpValue) / runnerUpValue) * 100;

      if (improvement > 20) {
        recommendations.push(`Strong winner detected: ${winner.name} performs ${improvement.toFixed(1)}% better`);
      } else if (improvement > 10) {
        recommendations.push(`Moderate improvement: ${winner.name} performs ${improvement.toFixed(1)}% better`);
      } else {
        recommendations.push('No clear winner - variants perform similarly');
      }
    }

    return recommendations;
  }

  /**
   * Update experiment status
   */
  async updateExperimentStatus(
    experimentId: string,
    status: Experiment['status']
  ): Promise<void> {
    try {
      const experimentRef = doc(this.experimentsCollection, experimentId);
      await updateDoc(experimentRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating experiment status:', error);
    }
  }

  /**
   * Get variant configuration for user
   */
  async getVariantConfig(userId: string, experimentId: string): Promise<Record<string, any> | null> {
    try {
      const assignment = await this.getUserAssignment(userId, experimentId);
      if (!assignment) return null;

      const experiment = await this.getExperiment(experimentId);
      if (!experiment) return null;

      const variant = experiment.variants.find(v => v.id === assignment.variantId);
      return variant?.config || null;
    } catch (error) {
      console.error('Error getting variant config:', error);
      return null;
    }
  }
}

export const abTestingService = new ABTestingService();
