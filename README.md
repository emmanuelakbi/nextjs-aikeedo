# AIKEEDO - AI Services Platform

A modern, enterprise-grade AI services platform built with Next.js 14, featuring multi-tenant workspaces, integrated AI providers, and a comprehensive billing system.

## 🚀 Quick Setup (5 Minutes)

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)
- Git

### Installation Steps

```bash
# 1. Clone and install
git clone https://github.com/emmanuelakbi/nextjs-aikeedo.git
cd nextjs-aikeedo
npm install

# 2. Configure environment
cp .env.example .env
```

Edit `.env` with these **3 required variables**:

```bash
DATABASE_URL="postgresql://aikeedo:password@localhost:5433/aikeedo_dev"
NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
OPENROUTER_API_KEY="your-key-here"  # FREE from https://openrouter.ai/keys
```

```bash
# 3. Start database
docker-compose -f docker-compose.test.yml up -d

# 4. Setup database
npm run db:generate
npm run db:migrate
npm run db:seed  # Creates test users with credits

# 5. Start application
npm run dev
```

### Test It Out

1. Open http://localhost:3000
2. Login: `admin@aikeedo.com` / `password123`
3. Go to Chat page
4. Select a FREE model (Amazon Nova 2 Lite)
5. Start chatting with AI!

**New users automatically get 10,000 free credits** - perfect for testing!

## ✨ Key Features

- **Multi-AI Provider Integration** - OpenAI, Anthropic, Google, Mistral via unified interface
- **Multi-Tenant Workspaces** - Isolated resources and credit allocations
- **Credit-Based Billing** - Flexible subscription plans with Stripe integration
- **Enterprise Features** - Affiliate program, admin dashboard, audit logging
- **Clean Architecture** - Domain-Driven Design with clear layer separation
- **Free AI Models** - Test with 100% free models via OpenRouter (no credit card)

## 📚 Documentation

- **[Hackathon Submission](KIROWEEN_SUBMISSION.md)** - Project overview and Kiro usage
- **[Architecture](docs/ARCHITECTURE.md)** - System design and patterns
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Configuration](docs/CONFIGURATION.md)** - Customize without code changes
- **[Environment Variables](docs/ENVIRONMENT.md)** - All configuration options

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
