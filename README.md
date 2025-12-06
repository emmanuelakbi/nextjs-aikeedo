# AIKEEDO Next.js Foundation

A modern, enterprise-grade AI services platform built with Next.js 14, featuring multi-tenant workspaces, integrated AI providers, and a comprehensive billing system.

## 🚀 Quick Start for Judges/Evaluators

**New to this project?** Start here:
- **[Judge Setup Guide](JUDGE_SETUP_GUIDE.md)** - 5-10 minute setup with verification checklist
- **[Quick Start Guide](QUICK_START.md)** - Detailed setup instructions
- **[Hackathon Submission](KIROWEEN_SUBMISSION.md)** - Project overview and Kiro usage

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration instructions
- **[Configuration Guide](docs/CONFIGURATION.md)** - Customize the platform without code changes
- **[Configuration Quick Reference](config/QUICK_REFERENCE.md)** - Quick reference for common tasks
- **[API Documentation](docs/API.md)** - Detailed API endpoint reference
- **[Environment Variables](docs/ENVIRONMENT.md)** - All configuration options explained
- **[Architecture](docs/ARCHITECTURE.md)** - System design and patterns

## ⚙️ Configuration System

The platform is fully configurable without code changes:

```bash
# View current configuration
npm run config:view

# Create custom configuration
npm run config:init

# Validate configuration
npm run config:validate
```

**What you can configure:**
- Feature flags (enable/disable features)
- Credit rates and pricing
- Subscription plans
- Affiliate program settings
- Rate limits
- AI provider settings
- Branding and UI
- Security settings
- And much more...

**Quick Links:**
- [Configuration Guide](docs/CONFIGURATION.md) - Complete customization guide
- [Quick Reference](config/QUICK_REFERENCE.md) - Common tasks
- [Configuration Checklist](CONFIGURATION_CHECKLIST.md) - Deployment checklist
- [Reusable Codebase Summary](REUSABLE_CODEBASE_SUMMARY.md) - Implementation overview

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration (see docs/ENVIRONMENT.md for details)
```

3. **Set up the database:**

```bash
npm run db:generate
npm run db:migrate
```

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md).

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Validation**: Zod
- **Password Hashing**: bcrypt
- **Testing**: Vitest, fast-check, Playwright

## 📋 Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Database

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (dev only)
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset database (delete all data)

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run e2e tests in UI mode

## 📁 Project Structure

```
nextjs-aikeedo/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth routes group (login, register)
│   │   ├── (dashboard)/         # Protected routes group
│   │   └── api/                 # API routes
│   ├── lib/                     # Core libraries
│   │   ├── auth/               # Authentication logic
│   │   ├── db/                 # Database client
│   │   ├── email/              # Email service
│   │   └── validation/         # Validation schemas
│   ├── domain/                  # Domain layer (DDD)
│   │   ├── user/               # User domain
│   │   └── workspace/          # Workspace domain
│   ├── application/             # Application layer
│   │   ├── use-cases/          # Business use cases
│   │   ├── commands/           # Command objects
│   │   └── queries/            # Query objects
│   ├── infrastructure/          # Infrastructure layer
│   │   ├── repositories/       # Data access implementations
│   │   └── services/           # External service integrations
│   ├── components/              # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── forms/              # Form components
│   │   └── layouts/            # Layout components
│   └── types/                   # TypeScript types
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Seed script
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
└── docs/                        # Documentation
    ├── API.md                   # API reference
    ├── SETUP.md                 # Setup guide
    ├── ENVIRONMENT.md           # Environment variables
    └── ARCHITECTURE.md          # Architecture documentation
```

## 🏗 Architecture

This project follows **Clean Architecture** principles with **Domain-Driven Design (DDD)**:

### Layer Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  ← UI, API Routes, Components
├─────────────────────────────────────────┤
│         Application Layer               │  ← Use Cases, Commands, Queries
├─────────────────────────────────────────┤
│           Domain Layer                  │  ← Entities, Value Objects, Rules
├─────────────────────────────────────────┤
│       Infrastructure Layer              │  ← Database, External Services
└─────────────────────────────────────────┘
```

**Key Principles:**

- **Separation of Concerns**: Each layer has a specific responsibility
- **Dependency Rule**: Inner layers never depend on outer layers
- **Testability**: Business logic is independent of frameworks
- **Maintainability**: Changes in one layer don't affect others

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 🔐 Security Features

- **Password Security**: bcrypt hashing with 12 rounds
- **Session Management**: Database-backed sessions with NextAuth.js
- **CSRF Protection**: Token validation on all mutations
- **Input Validation**: Zod schemas for all user input
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Protection**: React automatic escaping
- **Rate Limiting**: Prevents brute force attacks
- **Secure Cookies**: httpOnly, secure, sameSite flags

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Test individual functions and classes (Vitest)
- **Property-Based Tests**: Test properties across all inputs (fast-check)
- **Integration Tests**: Test multiple components together
- **End-to-End Tests**: Test complete user flows (Playwright)

Run tests with:

```bash
npm test
```

## 🚢 Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard
4. Connect PostgreSQL database

### Docker

```bash
docker build -t aikeedo-nextjs .
docker run -p 3000:3000 -e DATABASE_URL="..." aikeedo-nextjs
```

### Other Platforms

Compatible with:

- Netlify
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

See [docs/SETUP.md](docs/SETUP.md) for detailed deployment instructions.

## 🤝 Development Guidelines

1. **TypeScript**: Strict mode is enabled, all code must be type-safe
2. **Code Style**: Follow ESLint and Prettier rules
3. **Testing**: Write tests for new features
4. **Commits**: Use conventional commit messages
5. **Documentation**: Update docs when adding features
6. **Architecture**: Follow the established layer architecture
7. **Validation**: Use Zod for runtime validation

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/request-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - Logout user

### User Management

- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile
- `PATCH /api/users/me/password` - Change password
- `PATCH /api/users/me/email` - Change email

### Workspace Management

- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `PATCH /api/workspaces/:id` - Update workspace
- `POST /api/workspaces/:id/switch` - Switch workspace

For complete API documentation, see [docs/API.md](docs/API.md).

## 🐛 Troubleshooting

### Common Issues

**Database connection failed:**

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

**Port already in use:**

```bash
lsof -i :3000
kill -9 <PID>
```

**Email not sending:**

- Verify SMTP credentials
- For Gmail, use App Password
- For development, use Mailtrap

For more troubleshooting tips, see [docs/SETUP.md](docs/SETUP.md).

## 📄 License

See LICENSE file in the root directory.

## 🙏 Acknowledgments

Built with:

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
