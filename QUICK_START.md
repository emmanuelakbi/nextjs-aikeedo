# Quick Start Guide

Get the AIKEEDO platform running in minutes!

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL database)
- Git

## 1. Clone the Repository

```bash
git clone https://github.com/emmanuelakbi/nextjs-aikeedo.git
cd nextjs-aikeedo
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure these **REQUIRED** variables:

```bash
# Database (use this exact value for Docker setup)
DATABASE_URL="postgresql://aikeedo:password@localhost:5433/aikeedo_dev"

# Auth (generate a secure secret)
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OpenRouter API (FREE - get your key from https://openrouter.ai/keys)
OPENROUTER_API_KEY="your-openrouter-key-here"
```

**Optional (for full features):**

- SMTP settings for email verification
- Stripe keys for payment processing
- AWS S3 for file storage

## 4. Start PostgreSQL Database

```bash
# Start the database
docker-compose -f docker-compose.test.yml up -d

# Verify it's running
docker ps | grep aikeedo-nextjs-test-db
```

The database will be available at `localhost:5433` with credentials `aikeedo:password`

## 5. Set Up Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

## 6. Seed Database (RECOMMENDED)

**Option A: Use seed script (includes test users with credits)**

```bash
npm run db:seed
```

This creates:

- Admin user: `admin@aikeedo.com` / `password123` (1,000 credits)
- Test user: `user@example.com` / `password123` (100 credits)
- Sample billing plans

**Option B: Register your own account**

If you register a new account, you'll need to manually add credits:

```bash
# Add 10,000 credits to all workspaces
npm run credits:add -- --all 10000

# Or add to a specific workspace
npm run credits:list  # List workspace IDs
npm run credits:add -- <workspace-id> 10000
```

## 7. Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## 8. Login and Start Using

**If you used the seed script:**

1. Login with `admin@aikeedo.com` / `password123`
2. Go to the Chat page
3. Select a FREE model (Amazon Nova 2 Lite is default)
4. Start chatting!

**If you registered your own account:**

1. Login with your credentials
2. Add credits using the command in step 6
3. Log out and log back in (to refresh session)
4. Go to the Chat page and start chatting!

## Free AI Models Available

All these models are **100% FREE** via OpenRouter (no credit card required):

- **Amazon Nova 2 Lite** (300K context) - Default, best for general chat
- **Arcee Trinity Mini** - Fast and efficient
- **TNG R1T Chimera** - Experimental model
- **Allen AI OLMo 3 32B Think** - Advanced reasoning

## Quick Test

To verify everything works:

1. Login with test account: `admin@aikeedo.com` / `password123`
2. Navigate to Chat page
3. Type a message like "Hello, how are you?"
4. You should see a streaming response from the AI

## Troubleshooting

### Database Connection Issues

```bash
# Check if database is running
docker ps | grep aikeedo-nextjs-test-db

# Restart database
docker-compose -f docker-compose.test.yml restart

# View logs
docker-compose -f docker-compose.test.yml logs
```

### "No workspace selected" Error

This happens if the user's workspace isn't set. Fix:

```bash
# Fix workspace assignment
docker exec aikeedo-nextjs-test-db psql -U aikeedo -d aikeedo_dev -c "
UPDATE users u
SET \"currentWorkspaceId\" = w.id
FROM workspaces w
WHERE w.\"ownerId\" = u.id
  AND u.\"currentWorkspaceId\" IS NULL;
"
```

Then **log out and log back in** to refresh your session.

### "Insufficient credits" Error

```bash
# Add 10,000 credits to all workspaces
npm run credits:add -- --all 10000

# Or use Docker directly
docker exec aikeedo-nextjs-test-db psql -U aikeedo -d aikeedo_dev -c "UPDATE workspaces SET \"creditCount\" = 10000;"
```

Then **log out and log back in** to refresh your session.

### OpenRouter API Errors

- Verify your `OPENROUTER_API_KEY` is set in `.env`
- Get a free key from https://openrouter.ai/keys (no credit card required)
- Check the terminal for detailed error messages

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma client

# Testing
npm test                 # Run tests
npm run test:e2e         # Run E2E tests

# Database Management
docker-compose -f docker-compose.test.yml up -d      # Start DB
docker-compose -f docker-compose.test.yml down       # Stop DB
docker-compose -f docker-compose.test.yml restart    # Restart DB
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [docs/](docs/) for architecture and API documentation
- Configure additional AI providers (OpenAI, Anthropic, Google)
- Set up Stripe for billing features
- Configure SMTP for email notifications

## Support

For issues or questions:

- Check the [docs/](docs/) folder
- Open an issue on GitHub
- Review the configuration in `.env.example`

Happy coding! 🚀
