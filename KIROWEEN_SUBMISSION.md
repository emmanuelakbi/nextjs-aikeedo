# 🎃 AIKEEDO - Kiroween Hackathon Submission 👻

## Category: Frankenstein - Stitch Together a Chimera of Technologies

## Project Overview

AIKEEDO is a **Frankenstein's monster of modern web technologies** - a multi-tenant AI services platform that stitches together seemingly incompatible elements into one unexpectedly powerful application. This platform brings together disparate parts (multiple AI providers, enterprise architecture patterns, serverless infrastructure, complex billing systems) and breathes life into them as a cohesive, production-ready system.

### The Monster's Parts 🧟

Our chimera combines:

1. **Five AI Brains** (OpenAI, Anthropic, Google, Mistral, Pollinations) - Multiple competing AI providers unified under one interface
2. **Enterprise Skeleton** (Domain-Driven Design + Clean Architecture) - Traditional enterprise patterns in a modern serverless body
3. **Multi-Tenant Nervous System** - Workspace isolation with shared infrastructure
4. **Credit-Based Circulatory System** - Complex billing (subscriptions + one-time purchases + affiliate commissions)
5. **Distributed Storage Organs** - AWS S3 + PostgreSQL + Redis working in harmony
6. **Authentication Heart** - NextAuth v5 pumping secure sessions throughout
7. **Payment Processing Limbs** - Stripe integration for subscriptions, invoices, and payouts
8. **Free AI Services** - Pollinations.ai for free image generation, Google Gemini free tier for text

### Why This is "Frankenstein"

The true horror (and beauty) of this project is making incompatible technologies work together:

- **Serverless + Stateful**: Next.js 14 App Router (serverless) managing complex stateful operations (subscriptions, credits, workspaces)
- **Multiple AI Providers**: Competing services (OpenAI vs Anthropic vs Google vs Mistral vs Pollinations) unified with circuit breakers and automatic failover
- **Enterprise DDD + Modern Web**: Clean Architecture and Domain-Driven Design patterns in a React/Next.js application
- **Complex Billing**: Stripe subscriptions + credit system + affiliate tracking + usage metering all synchronized
- **Multi-Tenancy**: Workspace isolation with shared authentication and billing infrastructure
- **Free + Paid Tiers**: Seamlessly mixing free AI services (Pollinations, Google free tier) with paid options

## Live Demo 🚀

**URL**: https://nextjs-aikeedo.vercel.app

**Test Credentials**:
- **Admin**: admin@aikeedo.com / password123
- **User**: user@example.com / password123

### What You Can Test:
- ✅ **Chat** - AI conversations with Google Gemini 2.5 Flash (free)
- ✅ **Text Generation** - Generate content with persistent history
- ✅ **Image Generation** - Create images with Flux model via Pollinations (free, no API key needed!)
- ✅ **Multi-workspace** - Create and switch between workspaces
- ✅ **Admin Dashboard** - User management, audit logs, analytics

## Tech Stack (The Laboratory) 🧪

### Core Framework
- Next.js 14 (App Router, Server Components, API Routes)
- TypeScript 5 (Strict mode)
- React 18

### Database & Caching
- PostgreSQL (Neon serverless)
- Prisma 7 (Type-safe ORM)
- Redis/Upstash (Session caching, rate limiting)

### AI Providers (The Five Brains)
- **OpenAI SDK** - GPT models, DALL-E (paid)
- **Anthropic SDK** - Claude models (paid)
- **Google Generative AI** - Gemini 2.5 Flash (FREE tier!)
- **Mistral AI SDK** - Mistral models (paid)
- **Pollinations.ai** - Flux image generation (FREE, no API key!)

### Payment & Billing
- Stripe (Subscriptions, invoicing, payouts)
- Custom credit system
- Affiliate commission tracking

### Infrastructure
- Vercel (Deployment)
- Neon (Serverless PostgreSQL)
- Upstash (Serverless Redis)
- AWS S3 (File storage)

### Testing
- Vitest (Unit/Integration)
- Playwright (E2E)
- fast-check (Property-based testing)

## How Kiro Brought the Monster to Life ⚡

### 1. Spec-Driven Development: The Blueprint

Kiro's spec-driven approach was essential for managing this complex system. We created **6 major specs** that Kiro used to systematically build each subsystem:

- **Foundation Spec** - Clean Architecture, authentication, database
- **AI Services Spec** - Unified interface for 5 AI providers with circuit breakers
- **Billing Spec** - Credit system with Stripe integration
- **Affiliate Spec** - Referral tracking and commission payouts
- **Content Management Spec** - Documents, files, voice cloning
- **Admin Dashboard Spec** - User management, moderation, analytics

### 2. Steering Documents: The Operating Manual

Three steering documents guided Kiro throughout development:

- **`tech.md`** - Technology standards, commands, environment setup
- **`structure.md`** - Architecture rules, file organization, patterns
- **`product.md`** - Business context, feature requirements, user flows

### 3. Vibe Coding: The Creative Spark

Kiro excelled at complex implementations:

**AI Provider Factory with Circuit Breaker** - Described the problem, Kiro generated:
- Abstract base classes for each AI service type
- Factory pattern with provider selection logic
- Circuit breaker with exponential backoff
- Type-safe interfaces for all providers

**Free Image Generation Integration** - Asked Kiro to add Pollinations.ai:
- Created `PollinationsImageGenerationService` 
- Integrated into factory with automatic fallback
- Dynamic UI that changes based on selected model
- No API key required - works out of the box!

## Key Features Demonstrating "Frankenstein" Nature

### 1. Unified AI Provider Interface
Five different AI SDKs with completely different APIs, unified behind a single interface:

```typescript
// One interface, five implementations
const provider = AIProviderFactory.create('google', config);
const result = await provider.generateText(prompt);
// Works identically with 'openai', 'anthropic', 'mistral', or 'pollinations'
```

### 2. Free + Paid AI Services
Seamlessly mixing free and paid services:
- **Text**: Google Gemini 2.5 Flash (free tier) as default
- **Images**: Pollinations/Flux (completely free) as default
- **Premium**: OpenAI, Anthropic, DALL-E available with API keys

### 3. Model-Specific UI
The interface adapts based on selected model:
- **Flux (Free)**: Shows tips for prompt engineering, hides irrelevant options
- **DALL-E**: Shows Style and Quality selectors
- Dynamic placeholder text guides users

### 4. Credit System + Stripe Subscriptions
Traditional subscription billing stitched together with a custom credit system:
- Subscriptions allocate monthly credits
- One-time purchases add credits
- Usage deducts credits in real-time
- Free services still track usage for analytics

### 5. Multi-Tenant Architecture
Workspace isolation with shared infrastructure:
- Each workspace has its own credits, documents, and settings
- Users can belong to multiple workspaces
- Billing is per-workspace but users are global

## Repository

**GitHub**: https://github.com/emmanuelakbi/nextjs-aikeedo

The `.kiro` directory contains:
- 6 comprehensive specs with requirements, design, and tasks
- 3 steering documents enforcing standards
- Complete development history showing Kiro's involvement

## Installation & Setup

```bash
# Clone the repository
git clone https://github.com/emmanuelakbi/nextjs-aikeedo.git
cd nextjs-aikeedo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (only GOOGLE_AI_API_KEY needed for free tier!)

# Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables (Minimal Setup)

For a working demo, you only need:
```env
DATABASE_URL=your_postgres_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_AI_API_KEY=your_free_google_ai_key  # Free tier available!
```

Image generation works without any API key (uses Pollinations.ai)!

## The Horror and the Beauty 🌙

The true achievement of this Frankenstein project isn't just that it works - it's that it works **well**. Despite stitching together incompatible technologies, the result is:

- **Type-safe**: End-to-end TypeScript with strict mode
- **Tested**: Unit, integration, and E2E tests
- **Performant**: Optimized queries, caching, and lazy loading
- **Secure**: Rate limiting, CSRF protection, input validation
- **Maintainable**: Clean Architecture makes changes predictable
- **Scalable**: Multi-tenant design supports growth
- **Accessible**: Free tier works without paid API keys!

Like Frankenstein's monster, this platform is more than the sum of its parts. It's alive, it's powerful, and it's ready to serve.

## Acknowledgments

Built with Kiro during Kiroween 2025. This project demonstrates how Kiro's combination of spec-driven development, steering documents, and vibe coding can tame even the most monstrous technical challenges.

---

_"It's alive! IT'S ALIVE!"_ - Dr. Frankenstein (and us, after Kiro helped us integrate the fifth AI provider)
