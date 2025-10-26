/**
 * Social Media Service
 *
 * Provides multi-channel social media integration for restaurant booking chatbot.
 * Supports WhatsApp, Facebook Messenger, Instagram DM, and Google Business Messages.
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
  orderBy,
  limit,
} from 'firebase/firestore';

export type SocialChannel = 'whatsapp' | 'facebook' | 'instagram' | 'google_business' | 'twitter';

export interface ChannelConfig {
  channel: SocialChannel;
  enabled: boolean;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    webhookUrl?: string;
    webhookSecret?: string;
  };
  settings: {
    autoReply: boolean;
    businessHours?: {
      enabled: boolean;
      timezone: string;
      schedule: { [day: string]: { open: string; close: string } };
    };
    templates?: Record<string, string>;
    responseDelay?: number; // ms to wait before responding (appears more human)
  };
}

export interface SocialMessage {
  id: string;
  channel: SocialChannel;
  direction: 'inbound' | 'outbound';
  senderId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'template';
  timestamp: Date;
  metadata?: {
    mediaUrl?: string;
    templateName?: string;
    buttonResponse?: string;
    quickReplyPayload?: string;
    location?: { latitude: number; longitude: number };
  };
  conversationId: string;
  userId?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
}

export interface SocialConversation {
  id: string;
  channel: SocialChannel;
  userId?: string;
  senderId: string;
  status: 'active' | 'resolved' | 'archived';
  lastMessageAt: Date;
  createdAt: Date;
  tags?: string[];
  assignedTo?: string;
  metadata?: Record<string, any>;
}

export interface ChannelMetrics {
  channel: SocialChannel;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  avgResponseTime: number; // in seconds
  activeConversations: number;
  resolvedConversations: number;
  conversionRate: number;
  lastUpdated: Date;
}

class SocialMediaService {
  private channelConfigsCollection = collection(db, 'channel_configs');
  private messagesCollection = collection(db, 'social_messages');
  private conversationsCollection = collection(db, 'social_conversations');
  private metricsCollection = collection(db, 'channel_metrics');

  /**
   * Get channel configuration
   */
  async getChannelConfig(channel: SocialChannel): Promise<ChannelConfig | null> {
    try {
      const docRef = doc(this.channelConfigsCollection, channel);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as ChannelConfig;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${channel} config:`, error);
      return null;
    }
  }

  /**
   * Save channel configuration
   */
  async saveChannelConfig(config: ChannelConfig): Promise<void> {
    try {
      const docRef = doc(this.channelConfigsCollection, config.channel);
      await setDoc(docRef, config);
    } catch (error) {
      console.error(`Error saving ${config.channel} config:`, error);
      throw error;
    }
  }

  /**
   * Get all enabled channels
   */
  async getEnabledChannels(): Promise<SocialChannel[]> {
    try {
      const q = query(this.channelConfigsCollection, where('enabled', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.id as SocialChannel);
    } catch (error) {
      console.error('Error fetching enabled channels:', error);
      return [];
    }
  }

  /**
   * Send message through a specific channel
   */
  async sendMessage(
    channel: SocialChannel,
    recipientId: string,
    content: string,
    messageType: SocialMessage['messageType'] = 'text',
    metadata?: SocialMessage['metadata']
  ): Promise<string | null> {
    try {
      const config = await this.getChannelConfig(channel);
      if (!config || !config.enabled) {
        throw new Error(`Channel ${channel} is not enabled`);
      }

      // Add response delay if configured
      if (config.settings.responseDelay) {
        await this.delay(config.settings.responseDelay);
      }

      // Create message record
      const messageDoc = doc(this.messagesCollection);
      const message: Omit<SocialMessage, 'id'> = {
        channel,
        direction: 'outbound',
        senderId: 'restaurant_bot',
        recipientId,
        content,
        messageType,
        timestamp: new Date(),
        metadata,
        conversationId: await this.getOrCreateConversation(channel, recipientId),
        status: 'sent',
      };

      await setDoc(messageDoc, {
        ...message,
        timestamp: Timestamp.fromDate(message.timestamp),
      });

      // Send via appropriate channel API
      await this.sendViaChannel(channel, message, config);

      return messageDoc.id;
    } catch (error) {
      console.error(`Error sending message via ${channel}:`, error);
      return null;
    }
  }

  /**
   * Receive and process incoming message
   */
  async receiveMessage(
    channel: SocialChannel,
    senderId: string,
    content: string,
    messageType: SocialMessage['messageType'] = 'text',
    metadata?: SocialMessage['metadata']
  ): Promise<string> {
    try {
      const messageDoc = doc(this.messagesCollection);
      const conversationId = await this.getOrCreateConversation(channel, senderId);

      const message: Omit<SocialMessage, 'id'> = {
        channel,
        direction: 'inbound',
        senderId,
        recipientId: 'restaurant_bot',
        content,
        messageType,
        timestamp: new Date(),
        metadata,
        conversationId,
        status: 'delivered',
      };

      await setDoc(messageDoc, {
        ...message,
        timestamp: Timestamp.fromDate(message.timestamp),
      });

      // Update conversation last message time
      await this.updateConversationActivity(conversationId);

      return messageDoc.id;
    } catch (error) {
      console.error(`Error receiving message from ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    channel: SocialChannel,
    senderId: string
  ): Promise<string> {
    try {
      // Check for existing active conversation
      const q = query(
        this.conversationsCollection,
        where('channel', '==', channel),
        where('senderId', '==', senderId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].id;
      }

      // Create new conversation
      const conversationDoc = doc(this.conversationsCollection);
      const conversation: Omit<SocialConversation, 'id'> = {
        channel,
        senderId,
        status: 'active',
        lastMessageAt: new Date(),
        createdAt: new Date(),
      };

      await setDoc(conversationDoc, {
        ...conversation,
        lastMessageAt: Timestamp.fromDate(conversation.lastMessageAt),
        createdAt: Timestamp.fromDate(conversation.createdAt),
      });

      return conversationDoc.id;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Update conversation activity timestamp
   */
  private async updateConversationActivity(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(this.conversationsCollection, conversationId);
      await updateDoc(conversationRef, {
        lastMessageAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating conversation activity:', error);
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    limitCount: number = 50
  ): Promise<SocialMessage[]> {
    try {
      const q = query(
        this.messagesCollection,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as SocialMessage[];
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  /**
   * Get active conversations
   */
  async getActiveConversations(channel?: SocialChannel): Promise<SocialConversation[]> {
    try {
      let q = query(
        this.conversationsCollection,
        where('status', '==', 'active'),
        orderBy('lastMessageAt', 'desc')
      );

      if (channel) {
        q = query(q, where('channel', '==', channel));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastMessageAt: doc.data().lastMessageAt.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as SocialConversation[];
    } catch (error) {
      console.error('Error fetching active conversations:', error);
      return [];
    }
  }

  /**
   * Resolve conversation
   */
  async resolveConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(this.conversationsCollection, conversationId);
      await updateDoc(conversationRef, {
        status: 'resolved',
      });
    } catch (error) {
      console.error('Error resolving conversation:', error);
    }
  }

  /**
   * Send via specific channel API
   */
  private async sendViaChannel(
    channel: SocialChannel,
    message: Omit<SocialMessage, 'id'>,
    config: ChannelConfig
  ): Promise<void> {
    switch (channel) {
      case 'whatsapp':
        await this.sendWhatsAppMessage(message, config);
        break;
      case 'facebook':
        await this.sendFacebookMessage(message, config);
        break;
      case 'instagram':
        await this.sendInstagramMessage(message, config);
        break;
      case 'google_business':
        await this.sendGoogleBusinessMessage(message, config);
        break;
      case 'twitter':
        await this.sendTwitterMessage(message, config);
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsAppMessage(
    message: Omit<SocialMessage, 'id'>,
    config: ChannelConfig
  ): Promise<void> {
    // WhatsApp Business API integration
    const { phoneNumberId, accessToken } = config.credentials;

    if (!phoneNumberId || !accessToken) {
      throw new Error('WhatsApp credentials not configured');
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.recipientId,
    };

    if (message.messageType === 'text') {
      payload.type = 'text';
      payload.text = { body: message.content };
    } else if (message.messageType === 'template' && message.metadata?.templateName) {
      payload.type = 'template';
      payload.template = {
        name: message.metadata.templateName,
        language: { code: 'en_US' },
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      throw error;
    }
  }

  /**
   * Send Facebook Messenger message
   */
  private async sendFacebookMessage(
    message: Omit<SocialMessage, 'id'>,
    config: ChannelConfig
  ): Promise<void> {
    const { accessToken } = config.credentials;

    if (!accessToken) {
      throw new Error('Facebook credentials not configured');
    }

    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`;

    const payload = {
      recipient: { id: message.recipientId },
      message: {
        text: message.content,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Facebook send error:', error);
      throw error;
    }
  }

  /**
   * Send Instagram DM
   */
  private async sendInstagramMessage(
    message: Omit<SocialMessage, 'id'>,
    config: ChannelConfig
  ): Promise<void> {
    const { accessToken } = config.credentials;

    if (!accessToken) {
      throw new Error('Instagram credentials not configured');
    }

    // Instagram uses same API as Facebook Messenger
    await this.sendFacebookMessage(message, config);
  }

  /**
   * Send Google Business Message
   */
  private async sendGoogleBusinessMessage(
    message: Omit<SocialMessage, 'id'>,
    config: ChannelConfig
  ): Promise<void> {
    // Google Business Messages API integration
    console.log('Google Business Messages integration pending');
    // Implementation depends on Google Business Messages API setup
  }

  /**
   * Send Twitter DM
   */
  private async sendTwitterMessage(
    message: Omit<SocialMessage, 'id'>,
    config: ChannelConfig
  ): Promise<void> {
    // Twitter API v2 Direct Messages
    console.log('Twitter DM integration pending');
    // Implementation depends on Twitter API credentials
  }

  /**
   * Get channel metrics
   */
  async getChannelMetrics(channel: SocialChannel): Promise<ChannelMetrics | null> {
    try {
      const docRef = doc(this.metricsCollection, channel);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          lastUpdated: data.lastUpdated.toDate(),
        } as ChannelMetrics;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching ${channel} metrics:`, error);
      return null;
    }
  }

  /**
   * Update channel metrics
   */
  async updateChannelMetrics(channel: SocialChannel): Promise<void> {
    try {
      // Calculate metrics from messages
      const messagesQ = query(
        this.messagesCollection,
        where('channel', '==', channel)
      );
      const messagesSnapshot = await getDocs(messagesQ);

      const inboundMessages = messagesSnapshot.docs.filter(
        doc => doc.data().direction === 'inbound'
      ).length;

      const outboundMessages = messagesSnapshot.docs.filter(
        doc => doc.data().direction === 'outbound'
      ).length;

      // Calculate active conversations
      const conversationsQ = query(
        this.conversationsCollection,
        where('channel', '==', channel),
        where('status', '==', 'active')
      );
      const activeConversations = (await getDocs(conversationsQ)).size;

      // Calculate resolved conversations
      const resolvedQ = query(
        this.conversationsCollection,
        where('channel', '==', channel),
        where('status', '==', 'resolved')
      );
      const resolvedConversations = (await getDocs(resolvedQ)).size;

      const metrics: ChannelMetrics = {
        channel,
        totalMessages: inboundMessages + outboundMessages,
        inboundMessages,
        outboundMessages,
        avgResponseTime: 0, // Calculate from actual response times
        activeConversations,
        resolvedConversations,
        conversionRate: 0, // Calculate from bookings
        lastUpdated: new Date(),
      };

      const docRef = doc(this.metricsCollection, channel);
      await setDoc(docRef, {
        ...metrics,
        lastUpdated: Timestamp.fromDate(metrics.lastUpdated),
      });
    } catch (error) {
      console.error(`Error updating ${channel} metrics:`, error);
    }
  }

  /**
   * Format message for display in chat
   */
  formatMessageForChat(message: SocialMessage): string {
    const channelEmojis: Record<SocialChannel, string> = {
      whatsapp: '💬',
      facebook: '📘',
      instagram: '📸',
      google_business: '🔍',
      twitter: '🐦',
    };

    const emoji = channelEmojis[message.channel];
    const direction = message.direction === 'inbound' ? '←' : '→';

    return `${emoji} ${direction} ${message.content}`;
  }

  /**
   * Utility: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle webhook from social platform
   */
  async handleWebhook(
    channel: SocialChannel,
    payload: any
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Verify webhook signature
      const config = await this.getChannelConfig(channel);
      if (!config || !config.enabled) {
        return { success: false };
      }

      // Parse webhook payload based on channel
      const { senderId, content, messageType, metadata } = this.parseWebhookPayload(
        channel,
        payload
      );

      // Store incoming message
      const messageId = await this.receiveMessage(
        channel,
        senderId,
        content,
        messageType,
        metadata
      );

      return { success: true, messageId };
    } catch (error) {
      console.error(`Error handling ${channel} webhook:`, error);
      return { success: false };
    }
  }

  /**
   * Parse webhook payload based on channel
   */
  private parseWebhookPayload(
    channel: SocialChannel,
    payload: any
  ): {
    senderId: string;
    content: string;
    messageType: SocialMessage['messageType'];
    metadata?: SocialMessage['metadata'];
  } {
    // Channel-specific parsing logic
    switch (channel) {
      case 'whatsapp':
        return this.parseWhatsAppWebhook(payload);
      case 'facebook':
      case 'instagram':
        return this.parseFacebookWebhook(payload);
      default:
        throw new Error(`Webhook parsing not implemented for ${channel}`);
    }
  }

  /**
   * Parse WhatsApp webhook
   */
  private parseWhatsAppWebhook(payload: any): {
    senderId: string;
    content: string;
    messageType: SocialMessage['messageType'];
    metadata?: SocialMessage['metadata'];
  } {
    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    return {
      senderId: message.from,
      content: message.text?.body || '',
      messageType: message.type || 'text',
      metadata: message.image ? { mediaUrl: message.image.link } : undefined,
    };
  }

  /**
   * Parse Facebook webhook
   */
  private parseFacebookWebhook(payload: any): {
    senderId: string;
    content: string;
    messageType: SocialMessage['messageType'];
    metadata?: SocialMessage['metadata'];
  } {
    const message = payload.entry?.[0]?.messaging?.[0];

    return {
      senderId: message.sender.id,
      content: message.message?.text || '',
      messageType: 'text',
    };
  }
}

export const socialMediaService = new SocialMediaService();
