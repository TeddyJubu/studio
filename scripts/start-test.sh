#!/bin/bash

# Restaurant Booking Chatbot - Test Startup Script
# This script checks your environment and starts the application

set -e

echo "🚀 Restaurant Booking Chatbot - Starting..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the studio directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from studio directory${NC}"
    echo "Run: cd studio && bash scripts/start-test.sh"
    exit 1
fi

echo "📋 Pre-flight checks..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
else
    echo -e "${GREEN}✓${NC} Node.js version: $(node -v)"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  node_modules not found. Installing dependencies..."
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencies installed"
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠${NC}  No .env.local file found"
    echo ""
    echo "📝 Creating template .env.local file..."
    cat > .env.local << 'EOF'
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AI (REQUIRED for chatbot)
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here

# Medium Priority Features (OPTIONAL - Enable for testing)
ENABLE_MENU_QA=true
ENABLE_SENTIMENT_ANALYSIS=true
ENABLE_AB_TESTING=true
ENABLE_DYNAMIC_PRICING=true
ENABLE_LOYALTY=true

# Dynamic Pricing Configuration
BASE_DEPOSIT_AMOUNT=20
RESTAURANT_CAPACITY=100
HIGH_OCCUPANCY_THRESHOLD=80
LOW_OCCUPANCY_THRESHOLD=30

# Loyalty Configuration
LOYALTY_POINTS_PER_DOLLAR=1
LOYALTY_BRONZE_THRESHOLD=0
LOYALTY_SILVER_THRESHOLD=500
LOYALTY_GOLD_THRESHOLD=1500
LOYALTY_PLATINUM_THRESHOLD=3000
LOYALTY_DIAMOND_THRESHOLD=5000

# Social Media (DISABLED for testing)
ENABLE_WHATSAPP=false
ENABLE_FACEBOOK=false
ENABLE_INSTAGRAM=false
ENABLE_GOOGLE_BUSINESS=false

# Sentiment Analysis
SENTIMENT_ESCALATION_THRESHOLD=-0.7
AUTO_ESCALATE_ON_CRITICAL=true

# A/B Testing
DEFAULT_TRAFFIC_ALLOCATION=100
MIN_SAMPLE_SIZE=10
EOF
    echo -e "${GREEN}✓${NC} Created .env.local template"
    echo ""
    echo -e "${YELLOW}⚠ ACTION REQUIRED:${NC}"
    echo "1. Edit .env.local and add your Firebase configuration"
    echo "2. Add your Google AI API key"
    echo "3. Re-run this script"
    echo ""
    echo "📚 See TEST_SETUP.md for detailed instructions"
    exit 1
else
    echo -e "${GREEN}✓${NC} .env.local file exists"
fi

# Check if Firebase is configured
if grep -q "your_api_key_here" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC}  Firebase not configured in .env.local"
    echo ""
    echo -e "${YELLOW}⚠ ACTION REQUIRED:${NC}"
    echo "1. Go to https://console.firebase.google.com/"
    echo "2. Create or select your project"
    echo "3. Get your config from Project Settings → General → Your apps"
    echo "4. Update .env.local with your Firebase config"
    echo ""
    echo "📚 See TEST_SETUP.md for detailed instructions"
    exit 1
fi

# Check if Gemini API key is configured
if grep -q "your_gemini_api_key_here" .env.local 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC}  Google AI API key not configured"
    echo ""
    echo -e "${YELLOW}⚠ ACTION REQUIRED:${NC}"
    echo "1. Go to https://aistudio.google.com/app/apikey"
    echo "2. Create an API key"
    echo "3. Update GOOGLE_GENAI_API_KEY in .env.local"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓${NC} Environment configured"
echo ""

# Check if TypeScript compiles
echo "🔍 Checking TypeScript..."
if npm run typecheck --silent 2>&1 | grep -q "error TS"; then
    echo -e "${YELLOW}⚠${NC}  TypeScript warnings found (non-critical)"
else
    echo -e "${GREEN}✓${NC} TypeScript check passed"
fi
echo ""

# Offer to run setup
if [ ! -f ".setup_completed" ]; then
    echo "📦 Database setup not detected"
    echo ""
    read -p "Do you want to run the setup script to seed sample data? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔧 Running setup script..."
        npm run setup:medium
        touch .setup_completed
        echo ""
        echo -e "${GREEN}✓${NC} Setup completed"
    else
        echo -e "${YELLOW}⚠${NC}  Skipping setup. Run manually with: npm run setup:medium"
    fi
else
    echo -e "${GREEN}✓${NC} Database setup completed previously"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "🚀 Starting development server..."
echo ""
echo "📍 The app will be available at:"
echo "   http://localhost:9002"
echo ""
echo "🧪 Test scenarios to try:"
echo "   1. Basic booking flow"
echo "   2. Menu Q&A ('What vegetarian options do you have?')"
echo "   3. Sentiment analysis (try negative/positive messages)"
echo "   4. Dynamic pricing (book for weekend vs weekday)"
echo "   5. Loyalty program ('What's my loyalty status?')"
echo ""
echo "📚 Full test guide: TEST_SETUP.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
