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

Edit `.env` and configure:

**Required:**
- `DATABASE_URL` - PostgreSQL connection (see step 4)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - `http://localhost:3000`
- `OPENROUTER_API_KEY` - Get free key from https://openrouter.ai/keys

**Optional (for full features):**
- SMTP settings for email
- Stripe keys for payments
- AWS S3 for file storage

## 4. Start PostgreSQL Database

```bash
# Start the database
docker-compose -f docker-compose.test.yml up -d

# Check it's running
docker ps | grep aikeedo-nextjs-test-db
```

The database will be available at `localhost:5433`

Your `DATABASE_URL` should be:
```
DATABASE_URL="postgresql://aikeedo:password@localhost:5433/aikeedo_dev"
```

## 5. Set Up Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

## 6. Add Credits to Your Workspace

After registering, add credits to test the AI features:

```bash
# List all workspaces
docker exec aikeedo-nextjs-test-db psql -U aikeedo -d aikeedo_dev -c "SELECT id, name, \"creditCount\" FROM workspaces;"

# Add 10,000 credits to all workspaces
docker exec aikeedo-nextjs-test-db psql -U aikeedo -d aikeedo_dev -c "UPDATE workspaces SET \"creditCount\" = 10000;"
```

Or use the script:
```bash
chmod +x scripts/add-credits.sh
./scripts/add-credits.sh --all 10000
```

## 7. Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## 8. Register and Start Using

1. Click "Register" and create an account
2. Log in with your credentials
3. Go to the Chat page
4. Select a FREE model (Amazon Nova 2 Lite is default)
5. Start chatting!

## Free AI Models Available

All these models are FREE via OpenRouter:
- **Amazon Nova 2 Lite** (300K context) - Default
- **Arcee Trinity Mini** - Fast and efficient
- **TNG R1T Chimera** - Experimental
- **Allen AI OLMo 3 32B Think** - Reasoning model

## Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
docker ps | grep postgres

# Restart database
docker-compose -f docker-compose.test.yml restart

# View logs
docker-compose -f docker-compose.test.yml logs
```

### No Workspace Selected Error
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

Then log out and log back in.

### Insufficient Credits Error
```bash
# Add credits to all workspaces
docker exec aikeedo-nextjs-test-db psql -U aikeedo -d aikeedo_dev -c "UPDATE workspaces SET \"creditCount\" = 10000;"
```

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
