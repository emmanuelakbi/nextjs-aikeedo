# Technology Stack

## Core Framework

- **Next.js 14**: React framework with App Router, Server Components, Server Actions, and API routes
- **TypeScript 5**: Strict mode enabled with comprehensive type safety and advanced compiler options
- **React 18**: UI library with Server and Client Components, Suspense, and streaming

**Key Features Used**:

- App Router for file-based routing
- Server Components for zero-JS components
- Server Actions for mutations
- Streaming with Suspense
- Route handlers for API endpoints
- Middleware for request interception
- Image optimization
- Font optimization (Geist fonts)

## Database & ORM

- **PostgreSQL**: Primary database (supports Neon serverless, standard PostgreSQL)
- **Prisma 7**: Type-safe ORM with migrations, client generation, and connection pooling
- **Redis**: Session caching, rate limiting, and general caching (optional but recommended)
- **@prisma/adapter-neon**: Neon serverless adapter for edge deployments
- **@prisma/adapter-pg**: PostgreSQL adapter for standard deployments

**Database Features**:

- Automatic migrations
- Type-safe queries
- Connection pooling
- Query optimization
- Soft deletes
- Audit trails

## Authentication & Security

- **NextAuth.js v5**: Authentication with session management, JWT, and OAuth support
- **@auth/prisma-adapter**: Prisma adapter for NextAuth.js
- **bcrypt**: Password hashing (12 rounds, configurable)
- **Zod**: Runtime validation and type inference for all inputs
- **CSRF Protection**: Token-based CSRF protection on mutations
- **Security Headers**: Comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)

**Security Features**:

- Session-based authentication
- Email verification
- Password reset flows
- Rate limiting
- Input sanitization
- XSS prevention
- SQL injection prevention (via Prisma)

## AI Provider SDKs

- **OpenAI SDK** (`openai`): GPT-3.5, GPT-4, GPT-4 Turbo, DALL-E 2/3
- **Anthropic SDK** (`@anthropic-ai/sdk`): Claude 2, Claude 3 (Opus, Sonnet, Haiku)
- **Google Generative AI** (`@google/generative-ai`): Gemini Pro, Gemini Pro Vision
- **Mistral AI SDK** (`@mistralai/mistralai`): Mistral models

**AI Integration Features**:

- Unified provider interface
- Automatic failover and retry logic
- Circuit breaker pattern
- Streaming support
- Credit calculation
- Usage tracking
- Model caching
- Error handling

## Payment & Billing

- **Stripe** (`stripe`): Payment processing, subscriptions, invoicing, and webhooks
- **Stripe Checkout**: Hosted checkout pages
- **Stripe Customer Portal**: Self-service billing management
- **Stripe Webhooks**: Event-driven updates

**Billing Features**:

- Subscription management
- One-time payments
- Invoice generation
- Payment method storage
- Webhook handling
- Payout processing (Stripe Connect)

## Storage

- **AWS S3** (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`): File storage with presigned URLs
- **Local Storage**: Development fallback with file system storage
- **Sharp**: Image optimization and processing

**Storage Features**:

- Presigned URLs for secure uploads
- File type validation
- Size limits
- Image optimization
- Automatic cleanup

## Styling & UI

- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **PostCSS**: CSS processing and optimization
- **Geist Fonts**: Custom fonts (Geist Sans, Geist Mono)

**UI Features**:

- Responsive design
- Dark mode support (configurable)
- Custom color schemes
- Reusable component library
- Accessible components

## Data Fetching & State Management

- **@tanstack/react-query**: Server state management, caching, and synchronization
- **React Server Components**: Server-side data fetching
- **SWR Pattern**: Stale-while-revalidate caching

**Features**:

- Automatic refetching
- Optimistic updates
- Cache invalidation
- Infinite queries
- Prefetching

## Markdown & Content

- **react-markdown**: Markdown rendering in React
- **remark-gfm**: GitHub Flavored Markdown support
- **rehype-highlight**: Syntax highlighting for code blocks

## Testing

- **Vitest**: Unit and integration testing with fast execution
- **@vitest/ui**: Interactive test UI
- **@vitest/coverage-v8**: Code coverage reporting
- **Playwright**: End-to-end testing with browser automation
- **fast-check**: Property-based testing for edge cases
- **dotenv**: Environment variable loading for tests

**Testing Features**:

- Test isolation
- Mocking utilities
- Test factories
- Docker test database
- Parallel test execution
- Coverage reporting

## Code Quality

- **ESLint**: Linting with TypeScript and Next.js rules
- **@typescript-eslint/eslint-plugin**: TypeScript-specific linting
- **@typescript-eslint/parser**: TypeScript parser for ESLint
- **eslint-config-next**: Next.js ESLint configuration
- **eslint-config-prettier**: Prettier integration
- **eslint-plugin-prettier**: Prettier as ESLint rule
- **Prettier**: Code formatting (2 spaces, single quotes, semicolons, trailing commas)
- **TypeScript Compiler**: Strict type checking with advanced options

**Code Quality Features**:

- Automatic formatting on save
- Pre-commit hooks (optional)
- Consistent code style
- Type safety enforcement
- Import sorting

## Email

- **Nodemailer**: Email sending via SMTP
- **Email Templates**: HTML email templates with inline CSS

**Email Features**:

- Transactional emails
- Email verification
- Password reset
- Notifications
- Template system

## Development Tools

- **tsx**: TypeScript execution for scripts
- **pg**: PostgreSQL client for scripts
- **ws**: WebSocket support
- **Docker**: Test database containerization

## Build & Deployment

- **SWC**: Fast TypeScript/JavaScript compiler (built into Next.js)
- **Webpack**: Module bundler with optimizations
- **Sharp**: Image optimization in production

**Build Features**:

- Code splitting
- Tree shaking
- Minification
- Compression
- Source maps (dev only)
- Bundle analysis

## Common Commands

### Development

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Run TypeScript compiler
npm run verify           # Verify setup and configuration
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Database

```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes (dev only, no migration)
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with test data
```

### Testing

```bash
npm test                 # Run unit tests (once)
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with interactive UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright e2e tests
npm run test:e2e:ui      # Run e2e tests with UI
npm run test:e2e:debug   # Debug e2e tests
npm run test:all         # Run all tests (unit + e2e)
```

### Test Database (Docker)

```bash
npm run test-db:start    # Start test PostgreSQL container
npm run test-db:stop     # Stop test database
npm run test-db:restart  # Restart test database
npm run test-db:reset    # Reset test database (drop and recreate)
npm run test-db:logs     # View database logs
npm run test-db:status   # Check database status
```

### Configuration Management

```bash
npm run config:view      # View current configuration
npm run config:validate  # Validate configuration
npm run config:init      # Initialize custom configuration
npm run config:diff      # Compare with default configuration
npm run config:help      # Show configuration help
npm run config:demo      # Run configuration demo
```

### Development Utilities

```bash
npm run dev:demo         # Run development utilities demo
npm run find:hardcoded   # Find hardcoded values in code
```

## Environment Variables

Required variables are documented in `.env.example`. Key categories:

### Core Configuration

- `NODE_ENV`: Environment (development, production, test)
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js session encryption
- `NEXTAUTH_URL`: Base URL for authentication callbacks

### AI Providers (at least one required)

- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `GOOGLE_API_KEY`: Google Generative AI API key
- `MISTRAL_API_KEY`: Mistral AI API key

### Payment Processing

- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Public Stripe key for client

### Email (SMTP)

- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `SMTP_FROM`: From email address

### Storage (Optional)

- `AWS_ACCESS_KEY_ID`: AWS access key for S3
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3
- `AWS_REGION`: AWS region
- `AWS_S3_BUCKET`: S3 bucket name
- `STORAGE_PROVIDER`: Storage provider (s3 or local)

### Caching (Optional but Recommended)

- `REDIS_URL`: Redis connection string
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_PASSWORD`: Redis password

### Application Settings

- `NEXT_PUBLIC_APP_URL`: Public application URL
- `NEXT_PUBLIC_APP_NAME`: Application name
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

See `docs/ENVIRONMENT.md` for complete documentation and `.env.example` for all available variables.

## Build Configuration

### next.config.mjs

Next.js configuration with:

- Instrumentation hook for environment validation
- Image optimization (WebP, AVIF)
- Compiler optimizations (console removal in production)
- Webpack optimizations (tree shaking, code splitting)
- Security headers (X-Frame-Options, CSP)
- Cache headers for static assets
- Package import optimization

### tsconfig.json

TypeScript configuration with:

- Strict mode enabled
- Path aliases (@/_, @/app/_, @/components/\*, etc.)
- Advanced compiler options (noUncheckedIndexedAccess, noImplicitOverride)
- ES2022 target
- Incremental compilation
- Unused variable detection

### tailwind.config.ts

Tailwind CSS configuration with:

- Custom color schemes
- Custom spacing and sizing
- Typography plugin
- Dark mode support
- Custom animations
- Responsive breakpoints

### vitest.config.ts

Vitest test configuration with:

- Test environment setup
- Path aliases matching tsconfig
- Coverage configuration
- Test globals
- Mock setup

### playwright.config.ts

Playwright e2e configuration with:

- Multiple browsers (Chromium, Firefox, WebKit)
- Parallel test execution
- Screenshot on failure
- Video recording
- Base URL configuration
- Retry logic

### prisma.config.js

Prisma configuration with:

- Custom output path
- Generator options
- Preview features

### postcss.config.mjs

PostCSS configuration with:

- Tailwind CSS plugin
- Autoprefixer

### .eslintrc.json

ESLint configuration with:

- Next.js rules
- TypeScript rules
- Prettier integration
- Custom rules

### .prettierrc.json

Prettier configuration with:

- 2 spaces indentation
- Single quotes
- Semicolons
- Trailing commas
- Line width 80

## Performance Optimizations

### Build Time

- SWC compiler for fast builds
- Incremental TypeScript compilation
- Optimized package imports
- Tree shaking enabled

### Runtime

- Code splitting by route
- Dynamic imports for heavy components
- Image optimization with Sharp
- Font optimization
- React Server Components for zero-JS components
- Streaming with Suspense

### Caching

- Redis for session and data caching
- React Query for client-side caching
- Route caching for static pages
- CDN caching for static assets

### Database

- Connection pooling
- Query optimization
- Proper indexing
- Efficient includes and selects

## Deployment Platforms

The application is compatible with:

- **Vercel** (Recommended): Zero-config deployment with edge functions
- **Netlify**: Serverless deployment with edge functions
- **Railway**: Container-based deployment with PostgreSQL
- **Render**: Container-based deployment
- **AWS Amplify**: Serverless deployment on AWS
- **DigitalOcean App Platform**: Container-based deployment
- **Docker**: Self-hosted with Docker Compose
- **Traditional VPS**: Node.js server with PM2 or systemd

### Deployment Requirements

- Node.js 18+ runtime
- PostgreSQL database
- Environment variables configured
- Build command: `npm run build`
- Start command: `npm run start`
- Port: 3000 (configurable)

## Package Version Management

### Core Dependencies (Keep Updated)

- `next`: Follow Next.js 14.x releases for bug fixes
- `react`, `react-dom`: Keep in sync with Next.js requirements
- `typescript`: Update to latest 5.x for new features
- `@prisma/client`, `prisma`: Keep in sync, update together
- `next-auth`: Follow 5.x beta releases for fixes

### AI Provider SDKs (Update Carefully)

- Test thoroughly after updates
- Check for breaking changes in API
- Update credit calculations if pricing changes
- Review migration guides

### Security Updates (Priority)

- Update immediately for security patches
- Monitor npm audit: `npm audit`
- Check Dependabot alerts
- Review CVE databases

### Testing Dependencies (Safe to Update)

- `vitest`, `@vitest/ui`, `@vitest/coverage-v8`
- `@playwright/test`
- `fast-check`

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd nextjs-aikeedo

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your values

# 4. Set up database
npm run db:generate
npm run db:migrate

# 5. Seed database (optional)
npm run db:seed

# 6. Verify setup
npm run verify

# 7. Start development server
npm run dev
```

### Daily Development

```bash
# Start dev server
npm run dev

# In another terminal, run tests in watch mode
npm run test:watch

# Check types periodically
npm run type-check

# Format code before committing
npm run format
npm run lint:fix
```

### Before Committing

```bash
# 1. Format code
npm run format

# 2. Fix linting issues
npm run lint:fix

# 3. Run type check
npm run type-check

# 4. Run tests
npm test

# 5. Check for hardcoded values (if applicable)
npm run find:hardcoded
```

### Database Changes

```bash
# 1. Edit prisma/schema.prisma

# 2. Generate migration
npm run db:migrate

# 3. Regenerate Prisma client
npm run db:generate

# 4. Update seed script if needed
# Edit prisma/seed.ts

# 5. Test migration
npm run test-db:reset
npm run db:seed
```

### Adding New Features

1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement feature following architecture patterns
3. Write tests (unit, integration, e2e as needed)
4. Update documentation
5. Run full test suite: `npm run test:all`
6. Create pull request

### Debugging

#### Server-Side Debugging

- Add `console.log` in Server Components and API routes
- Check terminal output where `npm run dev` is running
- Use `debugger` statement with Node.js inspector
- Check logs in production environment

#### Client-Side Debugging

- Use browser DevTools console
- React DevTools for component inspection
- Network tab for API calls
- Add `console.log` in Client Components

#### Database Debugging

- Use Prisma Studio: `npm run db:studio`
- Check query logs in terminal
- Use `prisma.$queryRaw` for raw SQL
- Enable Prisma query logging in development

#### E2E Test Debugging

```bash
# Run with UI
npm run test:e2e:ui

# Run with debugger
npm run test:e2e:debug

# Run specific test
npx playwright test tests/e2e/auth.spec.ts
```

## IDE Configuration

### VS Code (Recommended)

**Recommended Extensions**:

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- Error Lens
- GitLens

**Settings** (`.vscode/settings.json`):

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

### WebStorm / IntelliJ IDEA

- Enable ESLint integration
- Enable Prettier integration
- Configure TypeScript service
- Install Prisma plugin
- Install Tailwind CSS plugin

## Monitoring & Observability

### Development

- Console logs in terminal
- React DevTools
- Browser DevTools
- Prisma Studio for database

### Production (Recommended Tools)

- **Error Tracking**: Sentry, Rollbar, or Bugsnag
- **Performance Monitoring**: Vercel Analytics, New Relic, or Datadog
- **Logging**: Winston, Pino, or cloud provider logs
- **Database Monitoring**: Prisma Pulse, PgHero
- **Uptime Monitoring**: UptimeRobot, Pingdom

### Key Metrics to Monitor

- API response times
- Database query performance
- Error rates
- AI provider API usage and costs
- Credit consumption rates
- User registration and conversion
- Subscription churn
- Server resource usage (CPU, memory, disk)

## Security Checklist

### Environment Variables

- [ ] Never commit `.env` files
- [ ] Use strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Rotate secrets regularly
- [ ] Use different secrets per environment
- [ ] Restrict API key permissions

### Authentication

- [ ] Enforce strong passwords
- [ ] Implement rate limiting on auth endpoints
- [ ] Use secure session cookies
- [ ] Implement email verification
- [ ] Add 2FA (optional but recommended)

### API Security

- [ ] Validate all inputs with Zod
- [ ] Implement CSRF protection
- [ ] Add rate limiting
- [ ] Use proper HTTP methods
- [ ] Return appropriate status codes
- [ ] Don't expose sensitive data in errors

### Database Security

- [ ] Use connection pooling
- [ ] Implement proper indexes
- [ ] Use transactions for multi-step operations
- [ ] Implement soft deletes for important data
- [ ] Regular backups
- [ ] Encrypt sensitive data at rest

### Frontend Security

- [ ] Sanitize user inputs
- [ ] Use Content Security Policy
- [ ] Implement XSS protection
- [ ] Validate file uploads
- [ ] Limit file sizes
- [ ] Use HTTPS in production

### Dependency Security

- [ ] Run `npm audit` regularly
- [ ] Update dependencies with security patches
- [ ] Review dependency licenses
- [ ] Use lock files (`package-lock.json`)
- [ ] Scan for vulnerabilities in CI/CD

## Performance Checklist

### Build Optimization

- [ ] Enable SWC minification
- [ ] Remove console logs in production
- [ ] Optimize images with Sharp
- [ ] Use code splitting
- [ ] Analyze bundle size

### Runtime Optimization

- [ ] Use Server Components by default
- [ ] Implement lazy loading
- [ ] Preload critical routes
- [ ] Use React Query for caching
- [ ] Enable Redis caching
- [ ] Optimize database queries

### Asset Optimization

- [ ] Compress images (WebP, AVIF)
- [ ] Use Next.js Image component
- [ ] Optimize fonts
- [ ] Minimize CSS
- [ ] Use CDN for static assets

### Database Optimization

- [ ] Add proper indexes
- [ ] Use connection pooling
- [ ] Optimize queries (avoid N+1)
- [ ] Use select to limit fields
- [ ] Implement pagination
- [ ] Cache frequent queries

## Useful Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### AI Provider Docs

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Google AI Docs](https://ai.google.dev/docs)
- [Mistral AI Docs](https://docs.mistral.ai)

### Tools

- [Prisma Studio](https://www.prisma.io/studio)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [React DevTools](https://react.dev/learn/react-developer-tools)

### Community

- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma GitHub](https://github.com/prisma/prisma)
- [Next.js Discord](https://nextjs.org/discord)
- [Prisma Discord](https://pris.ly/discord)
