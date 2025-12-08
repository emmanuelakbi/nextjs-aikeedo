# 🎃 AIKEEDO - Kiroween Hackathon Submission 👻

## Category: Frankenstein - Stitch Together a Chimera of Technologies

## Project Overview

AIKEEDO is a **Frankenstein's monster of modern web technologies** - a multi-tenant AI services platform that stitches together seemingly incompatible elements into one unexpectedly powerful application. This platform brings together disparate parts (multiple AI providers, enterprise architecture patterns, serverless infrastructure, complex billing systems) and breathes life into them as a cohesive, production-ready system.

### The Monster's Parts 🧟

Our chimera combines:

1. **Four AI Brains** (OpenAI, Anthropic, Google, Mistral) - Multiple competing AI providers unified under one interface
2. **Enterprise Skeleton** (Domain-Driven Design + Clean Architecture) - Traditional enterprise patterns in a modern serverless body
3. **Multi-Tenant Nervous System** - Workspace isolation with shared infrastructure
4. **Credit-Based Circulatory System** - Complex billing (subscriptions + one-time purchases + affiliate commissions)
5. **Distributed Storage Organs** - AWS S3 + PostgreSQL + Redis working in harmony
6. **Authentication Heart** - NextAuth v5 pumping secure sessions throughout
7. **Payment Processing Limbs** - Stripe integration for subscriptions, invoices, and payouts

### Why This is "Frankenstein"

The true horror (and beauty) of this project is making incompatible technologies work together:

- **Serverless + Stateful**: Next.js 14 App Router (serverless) managing complex stateful operations (subscriptions, credits, workspaces)
- **Multiple AI Providers**: Competing services (OpenAI vs Anthropic vs Google vs Mistral) unified with circuit breakers and automatic failover
- **Enterprise DDD + Modern Web**: Clean Architecture and Domain-Driven Design patterns in a React/Next.js application
- **Complex Billing**: Stripe subscriptions + credit system + affiliate tracking + usage metering all synchronized
- **Multi-Tenancy**: Workspace isolation with shared authentication and billing infrastructure

## Tech Stack (The Laboratory) 🧪

### Core Framework

- Next.js 14 (App Router, Server Components, API Routes)
- TypeScript 5 (Strict mode)
- React 18

### Database & Caching

- PostgreSQL (Neon serverless)
- Prisma 7 (Type-safe ORM)
- Redis (Session caching, rate limiting)

### AI Providers (The Four Brains)

- OpenAI SDK (GPT models, DALL-E)
- Anthropic SDK (Claude models)
- Google Generative AI (Gemini)
- Mistral AI SDK

### Payment & Billing

- Stripe (Subscriptions, invoicing, payouts)
- Custom credit system
- Affiliate commission tracking

### Infrastructure

- AWS S3 (File storage)
- Nodemailer (Email)
- NextAuth v5 (Authentication)

### Testing

- Vitest (Unit/Integration)
- Playwright (E2E)
- fast-check (Property-based testing)

## How Kiro Brought the Monster to Life ⚡

### 1. Spec-Driven Development: The Blueprint

Kiro's spec-driven approach was essential for managing this complex system. We created **6 major specs** that Kiro used to systematically build each subsystem:

#### Foundation Spec (`nextjs-foundation`)

- Established Clean Architecture with DDD patterns
- Set up authentication, database, and core infrastructure
- Created the skeleton that everything else would attach to

#### AI Services Spec (`nextjs-ai-services`)

- Unified interface for 4 different AI providers
- Circuit breaker pattern for resilience
- Token counting and usage tracking
- Automatic failover between providers

#### Billing Spec (`nextjs-billing`)

- Credit-based system with Stripe integration
- Subscription management with automatic renewals
- Invoice generation and payment tracking
- Usage metering and credit allocation

#### Affiliate Spec (`nextjs-affiliate`)

- Referral tracking with cookie-based attribution
- Commission calculation engine
- Payout system with Stripe Connect
- Performance analytics dashboard

#### Content Management Spec (`nextjs-content-management`)

- Document creation and management
- File upload with S3 integration
- Voice cloning capabilities
- Multi-workspace content isolation

#### Admin Dashboard Spec (`nextjs-admin-dashboard`)

- User impersonation for support
- Content moderation tools
- System-wide analytics and reporting
- Audit logging

**Impact**: Specs allowed us to break down this massive system into manageable pieces. Each spec had clear requirements, design decisions, and implementation tasks. Kiro could focus on one subsystem at a time while maintaining consistency with the overall architecture.

### 2. Steering Documents: The Operating Manual

We created **3 steering documents** that guided Kiro throughout development:

#### `tech.md` - Technology Standards

- Enforced consistent use of TypeScript strict mode
- Standardized testing approaches (Vitest + Playwright + fast-check)
- Defined common commands and workflows
- Ensured proper environment variable handling

#### `structure.md` - Architecture Rules

- Enforced Clean Architecture boundaries
- Defined import order conventions
- Standardized file naming and organization
- Maintained DDD patterns across all features

#### `product.md` - Business Context

- Kept Kiro aligned with business goals
- Ensured credit system consistency
- Maintained multi-tenant isolation rules
- Guided feature prioritization

**Impact**: Steering docs prevented architectural drift. As we added features, Kiro consistently applied the same patterns, naming conventions, and architectural principles. This was crucial for a project with 100+ files.

### 3. Vibe Coding: The Creative Spark

While specs provided structure, vibe coding with Kiro enabled rapid iteration on complex problems:

#### Most Impressive Code Generation:

**AI Provider Factory with Circuit Breaker** - We described the problem: "We need to support multiple AI providers with automatic failover and circuit breaking to prevent cascading failures." Kiro generated:

- Abstract base classes for each AI service type (text, image, speech)
- Factory pattern with provider selection logic
- Circuit breaker implementation with exponential backoff
- Comprehensive error handling and logging
- Type-safe interfaces for all providers

This would have taken days to implement manually. Kiro generated production-ready code in minutes.

#### Conversation Strategy:

1. **Start with architecture**: Described the overall system structure and constraints
2. **Iterate on patterns**: Discussed trade-offs (e.g., repository pattern vs direct Prisma access)
3. **Refine implementations**: Asked Kiro to optimize specific functions or add edge case handling
4. **Test-driven refinement**: Had Kiro generate tests, then improve code based on failures

### 4. Comparison: Specs vs Vibe Coding

**Specs were better for**:

- Large, well-defined subsystems (billing, authentication)
- Features requiring multiple coordinated changes
- Maintaining consistency across related files
- Complex business logic with clear requirements

**Vibe coding was better for**:

- Exploratory work (trying different AI provider integrations)
- Quick fixes and optimizations
- Generating test cases
- Refactoring and code improvements

**The Sweet Spot**: Use specs for the skeleton, vibe coding for the flesh. Specs built the structure, vibe coding filled in the details and handled edge cases.

## Key Features Demonstrating "Frankenstein" Nature

### 1. Unified AI Provider Interface

Four different AI SDKs with completely different APIs, unified behind a single interface:

```typescript
// One interface, four implementations
const provider = AIProviderFactory.create('openai', config);
const result = await provider.generateText(prompt);
// Works identically with 'anthropic', 'google', or 'mistral'
```

### 2. Credit System + Stripe Subscriptions

Traditional subscription billing stitched together with a custom credit system:

- Subscriptions allocate monthly credits
- One-time purchases add credits
- Usage deducts credits in real-time
- Stripe webhooks keep everything synchronized

### 3. Multi-Tenant Architecture

Workspace isolation with shared infrastructure:

- Each workspace has its own credits, documents, and settings
- Users can belong to multiple workspaces
- Billing is per-workspace but users are global
- Database queries automatically scope to workspace context

### 4. Domain-Driven Design in Next.js

Enterprise patterns in a modern web framework:

- Domain entities with business logic
- Repository interfaces implemented by Prisma
- Use cases orchestrating domain operations
- Clean separation between layers

## Live Demo

**URL**: [Your deployed URL here]

**Test Credentials**:

```
Email: demo@aikeedo.com
Password: Demo123!
```

## Video Demonstration

**YouTube URL**: [Your 3-minute demo video]

The video demonstrates:

1. Multi-workspace management
2. AI service integration (text, image, speech)
3. Credit purchase and usage tracking
4. Affiliate referral flow
5. Admin dashboard capabilities

## Repository

**GitHub**: [Your repo URL]

The `.kiro` directory contains:

- 6 comprehensive specs with requirements, design, and tasks
- 3 steering documents enforcing standards
- Complete development history showing Kiro's involvement

## Installation & Setup

```bash
# Clone the repository
git clone [your-repo-url]
cd aikeedo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Testing

```bash
# Run all tests
npm run test:all

# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## The Horror and the Beauty 🌙

The true achievement of this Frankenstein project isn't just that it works - it's that it works **well**. Despite stitching together incompatible technologies, the result is:

- **Type-safe**: End-to-end TypeScript with strict mode
- **Tested**: 80%+ code coverage with unit, integration, and E2E tests
- **Performant**: Optimized queries, caching, and lazy loading
- **Secure**: Rate limiting, CSRF protection, input validation
- **Maintainable**: Clean Architecture makes changes predictable
- **Scalable**: Multi-tenant design supports growth

Like Frankenstein's monster, this platform is more than the sum of its parts. It's alive, it's powerful, and it's ready to serve.

## Acknowledgments

Built with Kiro during Kiroween 2025. This project demonstrates how Kiro's combination of spec-driven development, steering documents, and vibe coding can tame even the most monstrous technical challenges.

---

_"It's alive! IT'S ALIVE!"_ - Dr. Frankenstein (and us, after Kiro helped us debug the Stripe webhook handler)
