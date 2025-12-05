# AIKEEDO Deployment Guide

Quick guide for deploying AIKEEDO for the Kiroween hackathon demo.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Neon/Supabase)
- Stripe account (test mode)
- At least one AI provider API key (OpenAI recommended)
- AWS S3 bucket (optional - falls back to local storage)

## Quick Deploy to Vercel (Recommended)

### 1. Fork/Clone Repository

```bash
git clone [your-repo-url]
cd aikeedo
```

### 2. Set Up Database

**Option A: Neon (Serverless PostgreSQL)**
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string

**Option B: Local PostgreSQL**
```bash
# Start PostgreSQL
npm run test-db:start

# Use this connection string:
# postgresql://postgres:postgres@localhost:5432/aikeedo_test
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."

# Stripe (test mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Get after setting up webhook

# Email (optional for demo)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@aikeedo.com"
```

### 4. Initialize Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Add environment variables from .env
# - Deploy
```

### 6. Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` in Vercel env vars
5. Redeploy: `vercel --prod`

### 7. Create Demo Account

Visit your deployed app and register:
- Email: `demo@aikeedo.com`
- Password: `Demo123!`

Or use the seed data accounts:
- Admin: `admin@aikeedo.com` / `Admin123!`
- User: `user@aikeedo.com` / `User123!`

## Alternative: Deploy to Railway

### 1. Set Up Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql
```

### 2. Configure Environment

```bash
# Link to Railway project
railway link

# Add environment variables
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set OPENAI_API_KEY=sk-...
railway variables set STRIPE_SECRET_KEY=sk_test_...
# ... add all other variables
```

### 3. Deploy

```bash
railway up
```

## Local Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Start test database
npm run test-db:start

# Initialize database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

## Testing the Deployment

### 1. Authentication Flow
- [ ] Register new account
- [ ] Verify email (check logs if SMTP not configured)
- [ ] Login
- [ ] Password reset

### 2. Workspace Management
- [ ] Create workspace
- [ ] Switch between workspaces
- [ ] Invite members (if implemented)

### 3. Credit System
- [ ] View credit balance
- [ ] Purchase credits (use Stripe test card: 4242 4242 4242 4242)
- [ ] Credits added to workspace

### 4. AI Services
- [ ] Generate text with OpenAI
- [ ] Generate image with DALL-E (if configured)
- [ ] Check credit deduction

### 5. Affiliate System
- [ ] Get referral link
- [ ] Register via referral link (use incognito)
- [ ] Check commission tracking

### 6. Admin Features
- [ ] Login as admin
- [ ] View admin dashboard
- [ ] Impersonate user (if implemented)

## Troubleshooting

### Database Connection Issues
```bash
# Check connection
npm run db:studio

# Reset database
npm run test-db:reset
npm run db:migrate
npm run db:seed
```

### Stripe Webhook Issues
- Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npm run db:generate

# Type check
npm run type-check

# Rebuild
npm run build
```

### Environment Variable Issues
- Ensure all required variables are set
- Check for typos in variable names
- Restart dev server after changes
- For Vercel: redeploy after adding variables

## Demo Data

The seed script creates:

**Users:**
- Admin: `admin@aikeedo.com` / `Admin123!`
- User: `user@aikeedo.com` / `User123!`
- Demo: `demo@aikeedo.com` / `Demo123!`

**Workspaces:**
- Each user has a default workspace with 1000 credits

**Documents:**
- Sample documents in each workspace

## Minimum Configuration for Demo

If you're short on time, you only need:

1. **Database**: PostgreSQL connection string
2. **NextAuth**: Secret and URL
3. **OpenAI**: API key (for AI features)
4. **Stripe**: Test keys (for billing demo)

Everything else is optional for a basic demo.

## Production Checklist

Before going live (post-hackathon):

- [ ] Use production Stripe keys
- [ ] Configure real SMTP server
- [ ] Set up AWS S3 for file storage
- [ ] Enable Redis for caching
- [ ] Configure proper domain
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable rate limiting
- [ ] Review security headers
- [ ] Set up backups
- [ ] Configure CDN

## Support

For issues during deployment:
1. Check logs: `vercel logs` or `railway logs`
2. Review environment variables
3. Test database connection
4. Verify API keys are valid
5. Check Stripe webhook configuration

## Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
- Stripe Dashboard: https://dashboard.stripe.com/test
- Neon Dashboard: https://console.neon.tech
- Prisma Studio: `npm run db:studio`

---

Built for Kiroween 2025 🎃
