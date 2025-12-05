# Setup Guide

This guide will walk you through setting up the AIKEEDO Next.js foundation module for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 14.0 or higher
- **Git**: For version control

### Checking Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Check PostgreSQL version
psql --version  # Should be 14.0 or higher
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nextjs-aikeedo
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:

- Next.js 14
- React 18
- TypeScript
- Prisma
- NextAuth.js
- Tailwind CSS
- Zod
- bcrypt
- And more...

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL Installation

1. Install PostgreSQL on your system:
   - **macOS**: `brew install postgresql@14`
   - **Ubuntu**: `sudo apt-get install postgresql-14`
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

2. Start PostgreSQL service:
   - **macOS**: `brew services start postgresql@14`
   - **Ubuntu**: `sudo systemctl start postgresql`
   - **Windows**: Service starts automatically

3. Create a database:

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE aikeedo;

# Create user (optional)
CREATE USER aikeedo_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aikeedo TO aikeedo_user;

# Exit
\q
```

#### Option B: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name aikeedo-postgres \
  -e POSTGRES_DB=aikeedo \
  -e POSTGRES_USER=aikeedo_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:14
```

#### Option C: Cloud Database

You can also use cloud PostgreSQL services:

- **Vercel Postgres**
- **Supabase**
- **Railway**
- **Neon**
- **AWS RDS**

### 4. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` and configure the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://aikeedo_user:your_password@localhost:5432/aikeedo"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Email (SMTP) Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@aikeedo.com"
```

#### Generating NEXTAUTH_SECRET

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

#### Email Configuration

For development, you can use:

**Gmail:**

1. Enable 2-factor authentication
2. Generate an App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Use the app password as `SMTP_PASSWORD`

**Mailtrap (Recommended for Development):**

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials from your inbox
3. Use Mailtrap credentials in `.env`

**SendGrid, Mailgun, or other services:**

- Follow their documentation for SMTP credentials

### 5. Set Up Database Schema

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Optional: Seed database with test data
npm run db:seed
```

### 6. Verify Setup

Run the verification script to ensure everything is configured correctly:

```bash
npm run verify-setup
```

This will check:

- Environment variables are set correctly
- Database connection is working
- Prisma client is generated
- All required dependencies are installed

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Running the Application

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Database Management

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create a new migration
npm run db:migrate

# Push schema changes without migration (dev only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with test data
npm run db:seed

# Reset database (delete all data)
npm run db:reset
```

### Code Quality

```bash
# Run TypeScript type checking
npm run type-check

# Run ESLint
npm run lint

# Fix ESLint errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e

# Run end-to-end tests in UI mode
npm run test:e2e:ui
```

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Verify database exists: `psql -l`
4. Test connection: `psql $DATABASE_URL`

### Prisma Client Issues

**Error:** `@prisma/client did not initialize yet`

**Solution:**

```bash
npm run db:generate
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Email Not Sending

**Error:** `SMTP connection failed`

**Solution:**

1. Verify SMTP credentials in `.env`
2. Check firewall settings
3. For Gmail, ensure App Password is used (not regular password)
4. For development, use Mailtrap instead

### TypeScript Errors

**Error:** Type errors in IDE

**Solution:**

```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd/Ctrl + Shift + P) > "TypeScript: Restart TS Server"

# Or regenerate types
npm run db:generate
npm run type-check
```

## IDE Setup

### Visual Studio Code (Recommended)

Install recommended extensions:

```bash
# Install extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
```

Recommended VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Environment-Specific Configuration

### Development

```env
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
```

### Staging

```env
NODE_ENV="production"
NEXTAUTH_URL="https://staging.yourdomain.com"
DATABASE_URL="postgresql://user:pass@staging-db:5432/aikeedo"
```

### Production

```env
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
DATABASE_URL="postgresql://user:pass@prod-db:5432/aikeedo"
# Enable Redis for caching
REDIS_URL="redis://prod-redis:6379"
# Enable error tracking
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

3. Set environment variables in Vercel dashboard

4. Connect PostgreSQL database (Vercel Postgres or external)

### Docker

```bash
# Build image
docker build -t aikeedo-nextjs .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  aikeedo-nextjs
```

### Other Platforms

The application can be deployed to:

- **Netlify**
- **Railway**
- **Render**
- **AWS Amplify**
- **DigitalOcean App Platform**

Follow their Next.js deployment guides and ensure environment variables are set.

## Next Steps

After setup is complete:

1. **Explore the codebase**: Review the architecture in `docs/ARCHITECTURE.md`
2. **Read API documentation**: See `docs/API.md` for endpoint details
3. **Review environment variables**: See `docs/ENVIRONMENT.md` for all configuration options
4. **Start building**: Create your first feature following the established patterns

## Getting Help

- **Documentation**: Check the `docs/` directory
- **Issues**: Report bugs or request features on GitHub
- **Community**: Join our Discord/Slack community

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database and SMTP
- Rotate `NEXTAUTH_SECRET` regularly in production
- Enable HTTPS in production
- Keep dependencies updated: `npm audit` and `npm update`
