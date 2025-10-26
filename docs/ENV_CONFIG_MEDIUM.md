# Environment Configuration Guide - Medium Priority Features

## Overview

This document provides the environment variable configuration needed for medium priority features.

---

## Menu Q&A Configuration

```bash
# Enable/disable menu Q&A features
ENABLE_MENU_QA=true

# Menu search configuration
MENU_SEARCH_LIMIT=50
MENU_CACHE_TTL=3600  # Cache menu items for 1 hour

# Popular items threshold
MENU_POPULARITY_THRESHOLD=50
```

---

## Sentiment Analysis Configuration

```bash
# Enable/disable sentiment analysis
ENABLE_SENTIMENT_ANALYSIS=true

# Sentiment thresholds
SENTIMENT_ESCALATION_THRESHOLD=-0.7  # Escalate if score below this
SENTIMENT_CONFIDENCE_THRESHOLD=0.8    # Minimum confidence to act

# Escalation settings
AUTO_ESCALATE_ON_CRITICAL=true
ESCALATION_NOTIFY_EMAIL=manager@restaurant.com
ESCALATION_NOTIFY_SMS=+1234567890
```

---

## A/B Testing Configuration

```bash
# Enable/disable A/B testing
ENABLE_AB_TESTING=true

# Default experiment settings
DEFAULT_TRAFFIC_ALLOCATION=100  # Percentage of users in experiments
MIN_SAMPLE_SIZE=100             # Minimum impressions before analysis
SIGNIFICANCE_LEVEL=0.95         # Statistical significance threshold

# Experiment tracking
AB_TEST_COOKIE_DURATION=30      # Days to persist assignment
```

---

## Dynamic Pricing Configuration

```bash
# Enable/disable dynamic pricing
ENABLE_DYNAMIC_PRICING=true

# Base pricing
BASE_DEPOSIT_AMOUNT=20
RESTAURANT_CAPACITY=100

# Pricing constraints
MIN_DEPOSIT_AMOUNT=10
MAX_DEPOSIT_AMOUNT=200
PRICE_ROUNDING_INCREMENT=5

# Occupancy tracking
HIGH_OCCUPANCY_THRESHOLD=80     # Percentage
LOW_OCCUPANCY_THRESHOLD=30      # Percentage

# Special pricing
WEEKEND_PREMIUM_PERCENT=25
PRIME_TIME_SURCHARGE=10
LARGE_PARTY_THRESHOLD=6
LARGE_PARTY_MULTIPLIER=1.5
```

---

## Social Media Integration

### WhatsApp Business API

```bash
# Enable WhatsApp
ENABLE_WHATSAPP=false

# WhatsApp Business API credentials (from Meta)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_business_api_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# WhatsApp webhook
WHATSAPP_WEBHOOK_SECRET=your_webhook_verify_token
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/webhooks/whatsapp

# WhatsApp settings
WHATSAPP_AUTO_REPLY=true
WHATSAPP_RESPONSE_DELAY=1000    # Milliseconds (appear human)
```

**Setup Instructions:**
1. Create Facebook Business Account: https://business.facebook.com
2. Create WhatsApp Business Account
3. Get API credentials from Meta Business Suite
4. Verify webhook URL
5. Test with WhatsApp Business API sandbox

---

### Facebook Messenger

```bash
# Enable Facebook Messenger
ENABLE_FACEBOOK=false

# Facebook Page credentials
FACEBOOK_PAGE_ID=your_facebook_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Facebook webhook
FACEBOOK_WEBHOOK_SECRET=your_webhook_verify_token
FACEBOOK_WEBHOOK_URL=https://yourdomain.com/api/webhooks/facebook

# Facebook settings
FACEBOOK_AUTO_REPLY=true
FACEBOOK_RESPONSE_DELAY=800
```

**Setup Instructions:**
1. Create Facebook App: https://developers.facebook.com
2. Add Messenger product to your app
3. Connect your Facebook Page
4. Subscribe to webhook events
5. Get Page Access Token (never expires)

---

### Instagram Direct Messages

```bash
# Enable Instagram
ENABLE_INSTAGRAM=false

# Instagram credentials (uses Facebook Graph API)
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_id
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

# Instagram webhook (shared with Facebook)
INSTAGRAM_WEBHOOK_SECRET=your_webhook_verify_token
INSTAGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/instagram

# Instagram settings
INSTAGRAM_AUTO_REPLY=true
INSTAGRAM_RESPONSE_DELAY=1000
```

**Setup Instructions:**
1. Convert Instagram to Business Account
2. Connect to Facebook Page
3. Use same Facebook App as Messenger
4. Enable Instagram Messaging in app settings
5. Subscribe to Instagram webhooks

---

### Google Business Messages

```bash
# Enable Google Business Messages
ENABLE_GOOGLE_BUSINESS=false

# Google Business credentials
GOOGLE_BUSINESS_AGENT_ID=your_agent_id
GOOGLE_BUSINESS_PARTNER_KEY=your_partner_key
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json

# Google Business settings
GOOGLE_BUSINESS_AUTO_REPLY=true
GOOGLE_BUSINESS_RESPONSE_DELAY=1200
```

**Setup Instructions:**
1. Set up Google Business Profile
2. Apply for Google Business Messages
3. Create service account in Google Cloud
4. Download service account key JSON
5. Configure agent settings

---

### Twitter Direct Messages

```bash
# Enable Twitter DMs (future)
ENABLE_TWITTER=false

# Twitter API v2 credentials
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Twitter settings
TWITTER_AUTO_REPLY=true
TWITTER_RESPONSE_DELAY=1500
```

---

### Social Media General Settings

```bash
# Business hours (applies to all channels)
ENABLE_BUSINESS_HOURS=true
BUSINESS_HOURS_TIMEZONE=America/New_York

# Business hours schedule (JSON format)
BUSINESS_HOURS_SCHEDULE='{"monday":{"open":"09:00","close":"22:00"},"tuesday":{"open":"09:00","close":"22:00"},"wednesday":{"open":"09:00","close":"22:00"},"thursday":{"open":"09:00","close":"22:00"},"friday":{"open":"09:00","close":"23:00"},"saturday":{"open":"10:00","close":"23:00"},"sunday":{"open":"10:00","close":"21:00"}}'

# Out of hours message
OUT_OF_HOURS_MESSAGE="Thanks for your message! We're currently closed but will respond when we open at {open_time}. For urgent matters, call us at (555) 123-4567."

# Response settings
MAX_RESPONSE_TIME_SECONDS=120
SLOW_RESPONSE_WARNING_THRESHOLD=60
```

---

## Loyalty Program Configuration

```bash
# Enable/disable loyalty program
ENABLE_LOYALTY=true

# Points configuration
LOYALTY_POINTS_PER_DOLLAR=1
LOYALTY_POINTS_EXPIRY_DAYS=365
LOYALTY_TIER_EXPIRY_DAYS=365

# Tier thresholds (lifetime points)
LOYALTY_BRONZE_THRESHOLD=0
LOYALTY_SILVER_THRESHOLD=500
LOYALTY_GOLD_THRESHOLD=1500
LOYALTY_PLATINUM_THRESHOLD=3000
LOYALTY_DIAMOND_THRESHOLD=5000

# Tier multipliers
LOYALTY_BRONZE_MULTIPLIER=1.0
LOYALTY_SILVER_MULTIPLIER=1.25
LOYALTY_GOLD_MULTIPLIER=1.5
LOYALTY_PLATINUM_MULTIPLIER=2.0
LOYALTY_DIAMOND_MULTIPLIER=2.5

# Special occasion bonuses (points)
LOYALTY_SILVER_OCCASION_BONUS=50
LOYALTY_GOLD_OCCASION_BONUS=100
LOYALTY_PLATINUM_OCCASION_BONUS=200
LOYALTY_DIAMOND_OCCASION_BONUS=500

# Birthday rewards
LOYALTY_BIRTHDAY_REWARD_ENABLED=true
LOYALTY_BIRTHDAY_REMINDER_DAYS=7  # Days before birthday to remind

# Referral program
LOYALTY_REFERRAL_ENABLED=true
LOYALTY_REFERRAL_BONUS=100        # Points for referrer
LOYALTY_REFERRAL_REWARD=100       # Points for referred friend

# Redemption settings
LOYALTY_MIN_POINTS_REDEMPTION=100
LOYALTY_MAX_POINTS_PER_BOOKING=1000
```

---

## Feature Flags

```bash
# Global feature toggles
FEATURE_MENU_QA=true
FEATURE_SENTIMENT_ANALYSIS=true
FEATURE_AB_TESTING=true
FEATURE_DYNAMIC_PRICING=true
FEATURE_SOCIAL_MEDIA=false  # Enable per channel
FEATURE_LOYALTY_PROGRAM=true

# Beta features (staging only)
BETA_MENU_RECOMMENDATIONS=true
BETA_PREDICTIVE_PRICING=false
BETA_GAMIFICATION=false
```

---

## Analytics and Monitoring

```bash
# Enable analytics for medium priority features
ENABLE_MENU_ANALYTICS=true
ENABLE_SENTIMENT_TRACKING=true
ENABLE_PRICING_ANALYTICS=true
ENABLE_CHANNEL_ANALYTICS=true
ENABLE_LOYALTY_ANALYTICS=true

# Data retention
ANALYTICS_RETENTION_DAYS=90
EXPERIMENT_DATA_RETENTION_DAYS=180

# Monitoring
ENABLE_ERROR_TRACKING=true
ERROR_TRACKING_SAMPLE_RATE=1.0

# Performance monitoring
ENABLE_PERFORMANCE_MONITORING=true
SLOW_QUERY_THRESHOLD_MS=1000
```

---

## Security Settings

```bash
# API rate limiting
RATE_LIMIT_MENU_QUERIES=100      # Per hour per user
RATE_LIMIT_SENTIMENT_ANALYSIS=1000  # Per hour
RATE_LIMIT_SOCIAL_MESSAGES=50    # Per hour per channel

# Webhook security
WEBHOOK_SIGNATURE_ALGORITHM=sha256
WEBHOOK_REQUEST_TIMEOUT_MS=5000

# Data encryption
ENCRYPT_CUSTOMER_DATA=true
ENCRYPTION_ALGORITHM=AES-256-GCM
```

---

## Development vs Production

### Development (.env.local)

```bash
# Development settings
NODE_ENV=development

# Use test/sandbox credentials
WHATSAPP_ACCESS_TOKEN=test_token_from_sandbox
FACEBOOK_PAGE_ACCESS_TOKEN=test_token

# Lower thresholds for testing
MIN_SAMPLE_SIZE=10
HIGH_OCCUPANCY_THRESHOLD=50

# Enable all features for testing
ENABLE_AB_TESTING=true
ENABLE_DYNAMIC_PRICING=true
ENABLE_LOYALTY=true

# Verbose logging
LOG_LEVEL=debug
ENABLE_QUERY_LOGGING=true
```

### Production (.env.production)

```bash
# Production settings
NODE_ENV=production

# Real credentials (from secure vault)
WHATSAPP_ACCESS_TOKEN=${VAULT_WHATSAPP_TOKEN}
FACEBOOK_PAGE_ACCESS_TOKEN=${VAULT_FACEBOOK_TOKEN}

# Production thresholds
MIN_SAMPLE_SIZE=100
HIGH_OCCUPANCY_THRESHOLD=80

# Staged rollout
ENABLE_AB_TESTING=true
ENABLE_DYNAMIC_PRICING=true
ENABLE_LOYALTY=true
ENABLE_WHATSAPP=false  # Enable after testing

# Production logging
LOG_LEVEL=info
ENABLE_QUERY_LOGGING=false
```

---

## Validation and Testing

### Test Configuration Validity

```bash
# Run configuration validator
npm run validate:config

# Test individual features
npm run test:menu
npm run test:sentiment
npm run test:pricing
npm run test:social
npm run test:loyalty
```

### Configuration Checklist

- [ ] All required variables set
- [ ] API credentials valid and tested
- [ ] Webhook URLs accessible
- [ ] Feature flags configured
- [ ] Rate limits appropriate
- [ ] Business hours correct
- [ ] Pricing thresholds reasonable
- [ ] Security settings enabled
- [ ] Analytics tracking configured
- [ ] Error monitoring active

---

## Troubleshooting

### Menu Q&A Issues
- Verify Firestore `menu` collection exists
- Check menu items have required fields
- Ensure allergen/dietary data is complete

### Sentiment Analysis Issues
- Verify Gemini API key is valid
- Check rate limits not exceeded
- Review escalation threshold settings

### A/B Testing Issues
- Verify experiments collection exists
- Check user assignment persistence
- Ensure variant weights sum to 100

### Dynamic Pricing Issues
- Verify pricing rules are active
- Check occupancy data is being tracked
- Ensure min/max constraints are set

### Social Media Issues
- Verify webhook URLs are accessible (https required)
- Check API tokens are not expired
- Ensure webhook secrets match
- Test with platform's test tools

### Loyalty Issues
- Verify loyalty collections exist
- Check tier thresholds are ascending
- Ensure points calculations are correct

---

## Security Best Practices

1. **Never commit real credentials to git**
2. **Use environment-specific files** (.env.local, .env.production)
3. **Store production secrets in vault** (AWS Secrets Manager, etc.)
4. **Rotate API tokens regularly** (quarterly recommended)
5. **Use webhook signature verification** (always enabled in production)
6. **Enable rate limiting** (prevent abuse)
7. **Encrypt sensitive customer data** (PII, payment info)
8. **Monitor for suspicious activity** (unusual patterns)
9. **Log security events** (failed auth, rate limit hits)
10. **Regular security audits** (quarterly)

---

## Additional Resources

- [Firebase Environment Variables](https://firebase.google.com/docs/functions/config-env)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Last Updated:** January 2025  
**For questions:** Refer to `docs/MEDIUM_PRIORITY_FEATURES.md`
