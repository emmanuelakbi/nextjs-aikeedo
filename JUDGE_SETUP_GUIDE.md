# Judge Setup Guide - AIKEEDO Platform

This guide will help you quickly set up and test the AIKEEDO platform for evaluation.

## ⏱️ Estimated Setup Time: 5-10 minutes

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 18 or higher installed (`node --version`)
- [ ] Docker installed and running (`docker --version`)
- [ ] Git installed (`git --version`)
- [ ] Terminal/command line access

## Quick Setup Steps

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/emmanuelakbi/nextjs-aikeedo.git
cd nextjs-aikeedo

# Install dependencies
npm install
```

### 2. Configure Environment (1 minute)

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` and set these **3 REQUIRED** variables:

```bash
# 1. Database (use this exact value)
DATABASE_URL="postgresql://aikeedo:password@localhost:5433/aikeedo_dev"

# 2. Auth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="paste-generated-secret-here"

# 3. OpenRouter API Key (FREE - get from https://openrouter.ai/keys)
OPENROUTER_API_KEY="paste-your-key-here"
```

**To get OpenRouter API key (FREE, no credit card):**
1. Visit https://openrouter.ai/keys
2. Sign up with email or GitHub
3. Copy your API key
4. Paste into `.env` file

### 3. Start Database (1 minute)

```bash
# Start PostgreSQL in Docker
docker-compose -f docker-compose.test.yml up -d

# Verify it's running
docker ps | grep aikeedo-nextjs-test-db
```

You should see a container named `aikeedo-nextjs-test-db` running.

### 4. Setup Database Schema (1 minute)

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with test data (includes users with credits)
npm run db:seed
```

### 5. Start Application (1 minute)

```bash
# Start development server
npm run dev
```

Wait for the message: `✓ Ready on http://localhost:3000`

### 6. Test the Application (2-3 minutes)

Open your browser to http://localhost:3000

**Login with test account:**
- Email: `admin@aikeedo.com`
- Password: `password123`

**Test the AI Chat:**
1. Click "Chat" in the sidebar
2. Ensure "Amazon Nova 2 Lite" is selected (it's FREE)
3. Type a message: "Hello, tell me about yourself"
4. You should see a streaming AI response

**Verify Credits:**
- Check the top-right corner shows your credit balance (1,000 credits)
- After sending a message, credits should decrease slightly

## ✅ Verification Checklist

Confirm these features work:

- [ ] User authentication (login/logout)
- [ ] Dashboard loads successfully
- [ ] Chat interface displays
- [ ] AI responds to messages with streaming
- [ ] Credit balance updates after AI usage
- [ ] Multiple free AI models available in dropdown
- [ ] Workspace selection works
- [ ] Navigation between pages works

## 🎯 Key Features to Evaluate

### 1. Multi-AI Provider Integration
- Navigate to Chat page
- Try different models from the dropdown:
  - Amazon Nova 2 Lite (default)
  - Arcee Trinity Mini
  - TNG R1T Chimera
  - Allen AI OLMo 3 32B Think
- All models are FREE via OpenRouter

### 2. Credit System
- Watch credit balance in top-right corner
- Send messages and see credits decrease
- Credits are calculated based on token usage

### 3. Workspace Management
- Click workspace dropdown (top-right)
- See "Personal" workspace
- Credits are workspace-specific

### 4. Clean Architecture
- Check `src/` folder structure:
  - `domain/` - Business logic
  - `application/` - Use cases
  - `infrastructure/` - External services
  - `lib/` - Shared utilities

### 5. Enterprise Features
- Billing system (Stripe integration)
- Affiliate program
- Admin dashboard
- Audit logging
- Rate limiting
- Security features

## 🐛 Troubleshooting

### Database won't start
```bash
# Check Docker is running
docker ps

# Restart database
docker-compose -f docker-compose.test.yml restart
```

### "No workspace selected" error
```bash
# Fix workspace assignment
npm run credits:add -- --all 10000

# Then log out and log back in
```

### "Insufficient credits" error
```bash
# Add more credits
npm run credits:add -- --all 10000

# Then log out and log back in
```

### OpenRouter API errors
- Verify `OPENROUTER_API_KEY` is set in `.env`
- Check you copied the key correctly (no extra spaces)
- Ensure you have internet connection

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

## 📚 Additional Documentation

For deeper evaluation:

- **Architecture**: See `docs/ARCHITECTURE.md`
- **API Reference**: See `docs/API.md`
- **Configuration**: See `docs/CONFIGURATION.md`
- **Full Setup**: See `QUICK_START.md`
- **Hackathon Submission**: See `KIROWEEN_SUBMISSION.md`

## 🎬 Demo Script

For a guided tour of features, see `DEMO_SCRIPT.md` (if available).

## 💡 Test Scenarios

### Scenario 1: Basic Chat
1. Login as admin
2. Go to Chat
3. Send: "Write a haiku about coding"
4. Verify streaming response works

### Scenario 2: Model Switching
1. In Chat, change model to "Arcee Trinity Mini"
2. Send same message
3. Compare response style

### Scenario 3: Credit Tracking
1. Note starting credit balance
2. Send several messages
3. Verify credits decrease appropriately
4. Check usage history (if implemented)

### Scenario 4: Multi-Workspace
1. Create new workspace (if feature enabled)
2. Switch between workspaces
3. Verify credits are workspace-specific

## 🏆 Evaluation Criteria

This project demonstrates:

1. **Technical Excellence**
   - Clean Architecture with DDD
   - TypeScript strict mode
   - Comprehensive error handling
   - Security best practices

2. **AI Integration**
   - Multiple AI providers
   - Unified interface
   - Streaming support
   - Circuit breaker pattern

3. **Enterprise Features**
   - Multi-tenancy
   - Billing system
   - Affiliate program
   - Admin tools
   - Audit logging

4. **Code Quality**
   - Well-documented
   - Tested (unit, integration, E2E)
   - Follows best practices
   - Maintainable structure

5. **Kiro Usage**
   - Built with Kiro AI assistance
   - Leveraged specs and steering
   - Rapid development
   - High-quality output

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review `QUICK_START.md` for detailed steps
3. Check GitHub issues
4. Review terminal output for error messages

## ⏰ Quick Commands Reference

```bash
# Start everything
docker-compose -f docker-compose.test.yml up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev

# Stop everything
# Ctrl+C to stop dev server
docker-compose -f docker-compose.test.yml down

# Reset database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
npm run db:migrate
npm run db:seed

# Add credits
npm run credits:add -- --all 10000

# View database
npm run db:studio
```

---

**Thank you for evaluating AIKEEDO!** 🚀

This platform showcases modern web development with Next.js 14, clean architecture, and enterprise-grade features, all built with the assistance of Kiro AI.
