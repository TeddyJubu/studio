# 🚀 Quick Commands Reference

## First Time Setup

```bash
# 1. Edit your credentials
nano .env.local
# or
code .env.local

# 2. Install dependencies
npm install

# 3. Seed sample data
npm run setup:medium

# 4. Verify setup
npm run verify

# 5. Start the app
npm run dev
```

## Or Use Automated Script

```bash
bash scripts/start-test.sh
```

## Daily Development

```bash
# Start dev server
npm run dev

# Check for errors
npm run typecheck

# Re-seed database
npm run setup:medium

# Verify everything works
npm run verify
```

## Testing Individual Features

```bash
# Test menu service
npm run test:menu

# Test sentiment analysis
npm run test:sentiment

# Test dynamic pricing
npm run test:pricing

# Test loyalty program
npm run test:loyalty
```

## Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Troubleshooting

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Check logs
npm run dev 2>&1 | tee app.log

# Verify Firebase connection
npm run verify
```

## Useful Links

- **Local App:** http://localhost:9002
- **Firebase Console:** https://console.firebase.google.com/
- **Google AI Studio:** https://aistudio.google.com/app/apikey
- **Documentation:** See `docs/` folder

---

**Quick help:** `cat START_HERE.md` or `cat TEST_SETUP.md`
