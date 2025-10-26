/**
 * Menu Service
 *
 * Provides menu item management and Q&A capabilities for the restaurant.
 * Supports natural language queries about menu items, ingredients, dietary info, etc.
 */

import { db } from '@/lib/firebase-config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: 'appetizer' | 'entree' | 'dessert' | 'beverage' | 'special';
  price: number;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[]; // e.g., ['vegetarian', 'gluten-free', 'vegan']
  available: boolean;
  imageUrl?: string;
  calories?: number;
  prepTime?: number; // in minutes
  popularity?: number; // 0-100 score
  seasonal?: boolean;
  spiceLevel?: 'none' | 'mild' | 'medium' | 'hot' | 'extra-hot';
}

export interface MenuQuery {
  query: string;
  filters?: {
    category?: MenuItem['category'];
    dietaryTags?: string[];
    maxPrice?: number;
    allergenFree?: string[];
  };
}

export interface MenuQueryResult {
  items: MenuItem[];
  answer: string;
  confidence: number;
  suggestions?: string[];
}

class MenuService {
  private menuCollection = collection(db, 'menu');
  private menuQueriesCollection = collection(db, 'menu_queries');

  /**
   * Get all menu items with optional filters
   */
  async getMenuItems(filters?: {
    category?: string;
    available?: boolean;
    dietaryTags?: string[];
  }): Promise<MenuItem[]> {
    try {
      let q = query(this.menuCollection);

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters?.available !== undefined) {
        q = query(q, where('available', '==', filters.available));
      }

      if (filters?.dietaryTags && filters.dietaryTags.length > 0) {
        q = query(q, where('dietaryTags', 'array-contains-any', filters.dietaryTags));
      }

      q = query(q, orderBy('popularity', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  }

  /**
   * Get a specific menu item by ID
   */
  async getMenuItem(itemId: string): Promise<MenuItem | null> {
    try {
      const docRef = doc(this.menuCollection, itemId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as MenuItem;
      }
      return null;
    } catch (error) {
      console.error('Error fetching menu item:', error);
      return null;
    }
  }

  /**
   * Search menu items by name or description
   */
  async searchMenuItems(searchTerm: string): Promise<MenuItem[]> {
    try {
      const allItems = await this.getMenuItems({ available: true });
      const lowerSearch = searchTerm.toLowerCase();

      return allItems.filter(item =>
        item.name.toLowerCase().includes(lowerSearch) ||
        item.description.toLowerCase().includes(lowerSearch) ||
        item.ingredients.some(ing => ing.toLowerCase().includes(lowerSearch))
      );
    } catch (error) {
      console.error('Error searching menu items:', error);
      return [];
    }
  }

  /**
   * Find menu items by dietary requirements
   */
  async findByDietaryRequirements(requirements: {
    dietaryTags?: string[];
    allergenFree?: string[];
  }): Promise<MenuItem[]> {
    try {
      let items = await this.getMenuItems({ available: true });

      if (requirements.dietaryTags && requirements.dietaryTags.length > 0) {
        items = items.filter(item =>
          requirements.dietaryTags!.every(tag => item.dietaryTags.includes(tag))
        );
      }

      if (requirements.allergenFree && requirements.allergenFree.length > 0) {
        items = items.filter(item =>
          !requirements.allergenFree!.some(allergen => item.allergens.includes(allergen))
        );
      }

      return items;
    } catch (error) {
      console.error('Error finding items by dietary requirements:', error);
      return [];
    }
  }

  /**
   * Get menu items by price range
   */
  async getItemsByPriceRange(minPrice: number, maxPrice: number): Promise<MenuItem[]> {
    try {
      const items = await this.getMenuItems({ available: true });
      return items.filter(item => item.price >= minPrice && item.price <= maxPrice);
    } catch (error) {
      console.error('Error fetching items by price range:', error);
      return [];
    }
  }

  /**
   * Get popular menu items
   */
  async getPopularItems(limitCount: number = 10): Promise<MenuItem[]> {
    try {
      const q = query(
        this.menuCollection,
        where('available', '==', true),
        orderBy('popularity', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
    } catch (error) {
      console.error('Error fetching popular items:', error);
      return [];
    }
  }

  /**
   * Get items by category
   */
  async getItemsByCategory(category: MenuItem['category']): Promise<MenuItem[]> {
    return this.getMenuItems({ category, available: true });
  }

  /**
   * Check if item contains specific allergens
   */
  async checkAllergens(itemId: string, allergens: string[]): Promise<{
    containsAllergens: boolean;
    foundAllergens: string[];
  }> {
    try {
      const item = await this.getMenuItem(itemId);
      if (!item) {
        return { containsAllergens: false, foundAllergens: [] };
      }

      const foundAllergens = allergens.filter(allergen =>
        item.allergens.some(a => a.toLowerCase() === allergen.toLowerCase())
      );

      return {
        containsAllergens: foundAllergens.length > 0,
        foundAllergens,
      };
    } catch (error) {
      console.error('Error checking allergens:', error);
      return { containsAllergens: false, foundAllergens: [] };
    }
  }

  /**
   * Get ingredient information for an item
   */
  async getIngredients(itemId: string): Promise<string[]> {
    try {
      const item = await this.getMenuItem(itemId);
      return item?.ingredients || [];
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      return [];
    }
  }

  /**
   * Log menu query for analytics
   */
  async logMenuQuery(query: string, results: number, userId?: string): Promise<void> {
    try {
      const queryDoc = doc(this.menuQueriesCollection);
      await setDoc(queryDoc, {
        query,
        results,
        userId: userId || 'anonymous',
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error logging menu query:', error);
    }
  }

  /**
   * Get menu recommendations based on dietary preferences
   */
  async getRecommendations(preferences: {
    dietaryRestrictions?: string[];
    allergenFree?: string[];
    favoriteCategories?: string[];
    priceRange?: { min: number; max: number };
  }): Promise<MenuItem[]> {
    try {
      let items = await this.getMenuItems({ available: true });

      // Filter by dietary restrictions
      if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
        items = items.filter(item =>
          preferences.dietaryRestrictions!.some(restriction =>
            item.dietaryTags.includes(restriction)
          )
        );
      }

      // Filter out allergens
      if (preferences.allergenFree && preferences.allergenFree.length > 0) {
        items = items.filter(item =>
          !preferences.allergenFree!.some(allergen =>
            item.allergens.includes(allergen)
          )
        );
      }

      // Filter by price range
      if (preferences.priceRange) {
        items = items.filter(item =>
          item.price >= preferences.priceRange!.min &&
          item.price <= preferences.priceRange!.max
        );
      }

      // Prioritize favorite categories
      if (preferences.favoriteCategories && preferences.favoriteCategories.length > 0) {
        items.sort((a, b) => {
          const aInFavorites = preferences.favoriteCategories!.includes(a.category);
          const bInFavorites = preferences.favoriteCategories!.includes(b.category);

          if (aInFavorites && !bInFavorites) return -1;
          if (!aInFavorites && bInFavorites) return 1;

          // Both in favorites or both not, sort by popularity
          return (b.popularity || 0) - (a.popularity || 0);
        });
      }

      return items.slice(0, 10); // Return top 10 recommendations
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Update menu item popularity score
   */
  async updatePopularity(itemId: string, increment: number = 1): Promise<void> {
    try {
      const itemRef = doc(this.menuCollection, itemId);
      const item = await this.getMenuItem(itemId);

      if (item) {
        const newPopularity = Math.min(100, (item.popularity || 0) + increment);
        await updateDoc(itemRef, {
          popularity: newPopularity,
        });
      }
    } catch (error) {
      console.error('Error updating popularity:', error);
    }
  }

  /**
   * Format menu items for display
   */
  formatMenuItemsForChat(items: MenuItem[]): string {
    if (items.length === 0) {
      return "I couldn't find any items matching your criteria.";
    }

    let response = `I found ${items.length} item${items.length > 1 ? 's' : ''} for you:\n\n`;

    items.forEach((item, index) => {
      response += `${index + 1}. **${item.name}** - $${item.price.toFixed(2)}\n`;
      response += `   ${item.description}\n`;

      if (item.dietaryTags.length > 0) {
        response += `   🏷️ ${item.dietaryTags.join(', ')}\n`;
      }

      if (item.spiceLevel && item.spiceLevel !== 'none') {
        response += `   🌶️ ${item.spiceLevel}\n`;
      }

      response += '\n';
    });

    return response.trim();
  }

  /**
   * Generate answer for common menu questions
   */
  async answerMenuQuestion(question: string): Promise<string> {
    const lowerQuestion = question.toLowerCase();

    // Vegetarian options
    if (lowerQuestion.includes('vegetarian')) {
      const items = await this.findByDietaryRequirements({
        dietaryTags: ['vegetarian'],
      });
      return this.formatMenuItemsForChat(items);
    }

    // Vegan options
    if (lowerQuestion.includes('vegan')) {
      const items = await this.findByDietaryRequirements({
        dietaryTags: ['vegan'],
      });
      return this.formatMenuItemsForChat(items);
    }

    // Gluten-free options
    if (lowerQuestion.includes('gluten')) {
      const items = await this.findByDietaryRequirements({
        dietaryTags: ['gluten-free'],
      });
      return this.formatMenuItemsForChat(items);
    }

    // Popular items
    if (lowerQuestion.includes('popular') || lowerQuestion.includes('recommend')) {
      const items = await this.getPopularItems(5);
      return this.formatMenuItemsForChat(items);
    }

    // Price-related queries
    if (lowerQuestion.includes('cheap') || lowerQuestion.includes('affordable')) {
      const items = await this.getItemsByPriceRange(0, 20);
      return this.formatMenuItemsForChat(items);
    }

    // Default search
    const items = await this.searchMenuItems(question);
    return this.formatMenuItemsForChat(items);
  }
}

export const menuService = new MenuService();
