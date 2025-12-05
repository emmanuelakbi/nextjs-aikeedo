# Documentation Index

Welcome to the AIKEEDO Next.js Foundation documentation. This index will help you find the information you need.

## 📚 Documentation Overview

This documentation is organized into several key areas:

### Getting Started

- **[Setup Guide](SETUP.md)** - Complete installation and configuration instructions
  - Prerequisites and system requirements
  - Step-by-step installation process
  - Database setup (PostgreSQL, Docker, Cloud)
  - Environment configuration
  - Development workflow
  - Troubleshooting common issues

### API Reference

- **[API Documentation](API.md)** - Comprehensive API endpoint reference
  - Authentication endpoints
  - User management endpoints
  - Workspace management endpoints
  - Request/response formats
  - Error codes and handling
  - Rate limiting
  - Complete examples

### Configuration

- **[Environment Variables](ENVIRONMENT.md)** - All configuration options explained
  - Required variables
  - Optional variables
  - Environment-specific configuration
  - Security best practices
  - Validation and troubleshooting
  - Example configurations

### Architecture

- **[Architecture Documentation](ARCHITECTURE.md)** - System design and patterns
  - Clean Architecture principles
  - Domain-Driven Design (DDD)
  - Layer architecture
  - Design patterns
  - Data flow
  - Database design
  - Testing strategy
  - Performance considerations

### Feature Modules

- **[Admin Dashboard](ADMIN_DASHBOARD.md)** - Administrative interface and tools
  - User management
  - Workspace management
  - Subscription management
  - System settings
  - Analytics and reporting
  - Audit logging
  - Support tools
  - Content moderation
  - Impersonation feature

- **[Billing](BILLING.md)** - Subscription management and payment processing
  - Subscription plans and management
  - Stripe integration
  - Credit system
  - Payment processing
  - Invoice management
  - Webhook handling
  - Usage tracking
  - Refund processing

- **[Content Management](CONTENT_MANAGEMENT.md)** - File uploads, documents, presets, and voice cloning
  - File upload and storage
  - Document management
  - Preset templates
  - Voice cloning
  - Media processing
  - API reference
  - Usage examples

- **[Voice Cloning](VOICE_CLONING.md)** - Custom voice creation and management
  - Voice sample upload
  - Model training
  - Voice library management
  - Speech synthesis integration

## 🎯 Quick Navigation

### For New Developers

1. Start with [Setup Guide](SETUP.md) to get your development environment running
2. Read [Architecture Documentation](ARCHITECTURE.md) to understand the codebase structure
3. Review [API Documentation](API.md) to understand available endpoints
4. Check [Environment Variables](ENVIRONMENT.md) for configuration options

### For Frontend Developers

1. [API Documentation](API.md) - Understand available endpoints
2. [Architecture Documentation](ARCHITECTURE.md) - Component structure and patterns
3. [Setup Guide](SETUP.md) - Development workflow

### For Backend Developers

1. [Architecture Documentation](ARCHITECTURE.md) - Layer architecture and DDD
2. [API Documentation](API.md) - Endpoint implementation details
3. [Environment Variables](ENVIRONMENT.md) - Configuration management
4. [Setup Guide](SETUP.md) - Database and testing setup

### For DevOps Engineers

1. [Setup Guide](SETUP.md) - Deployment instructions
2. [Environment Variables](ENVIRONMENT.md) - Production configuration
3. [Architecture Documentation](ARCHITECTURE.md) - Scalability considerations

## 📖 Documentation by Topic

### Authentication & Security

- **Setup**: [Setup Guide - Email Configuration](SETUP.md#email-configuration)
- **API**: [API Documentation - Authentication Endpoints](API.md#authentication-endpoints)
- **Config**: [Environment Variables - Authentication Configuration](ENVIRONMENT.md#authentication-configuration)
- **Architecture**: [Architecture Documentation - Authentication Flow](ARCHITECTURE.md#authentication-flow)

### Database

- **Setup**: [Setup Guide - Database Setup](SETUP.md#set-up-postgresql-database)
- **Config**: [Environment Variables - Database Configuration](ENVIRONMENT.md#database-configuration)
- **Architecture**: [Architecture Documentation - Database Design](ARCHITECTURE.md#database-design)

### User Management

- **API**: [API Documentation - User Management Endpoints](API.md#user-management-endpoints)
- **Architecture**: [Architecture Documentation - Domain Layer](ARCHITECTURE.md#domain-layer)

### Workspace Management

- **API**: [API Documentation - Workspace Management Endpoints](API.md#workspace-management-endpoints)
- **Architecture**: [Architecture Documentation - Multi-Tenancy](ARCHITECTURE.md#multi-workspace-support)

### Email Service

- **Setup**: [Setup Guide - Email Configuration](SETUP.md#email-configuration)
- **Config**: [Environment Variables - Email Configuration](ENVIRONMENT.md#email-smtp-configuration)

### Testing

- **Setup**: [Setup Guide - Testing](SETUP.md#testing)
- **Architecture**: [Architecture Documentation - Testing Strategy](ARCHITECTURE.md#testing-strategy)

### Deployment

- **Setup**: [Setup Guide - Deployment](SETUP.md#deployment)
- **Config**: [Environment Variables - Production Configuration](ENVIRONMENT.md#production)
- **Architecture**: [Architecture Documentation - Scalability](ARCHITECTURE.md#scalability-considerations)

### Billing & Subscriptions

- **Overview**: [Billing Documentation](BILLING.md)
- **Plans**: [Billing - Subscription Management](BILLING.md#subscription-management)
- **Credits**: [Billing - Credit System](BILLING.md#credit-system)
- **Payments**: [Billing - Payment Processing](BILLING.md#payment-processing)
- **Invoices**: [Billing - Invoicing](BILLING.md#invoicing)
- **Webhooks**: [Billing - Webhooks](BILLING.md#webhooks)
- **API**: [Billing - API Reference](BILLING.md#api-reference)

### Admin Dashboard

- **Overview**: [Admin Dashboard Documentation](ADMIN_DASHBOARD.md)
- **Users**: [Admin Dashboard - User Management](ADMIN_DASHBOARD.md#user-management)
- **Workspaces**: [Admin Dashboard - Workspace Management](ADMIN_DASHBOARD.md#workspace-management)
- **Subscriptions**: [Admin Dashboard - Subscription Management](ADMIN_DASHBOARD.md#subscription-management)
- **Settings**: [Admin Dashboard - System Settings](ADMIN_DASHBOARD.md#system-settings)
- **Reports**: [Admin Dashboard - Reports](ADMIN_DASHBOARD.md#reports)
- **Audit Logs**: [Admin Dashboard - Audit Logs](ADMIN_DASHBOARD.md#audit-logs)
- **Support**: [Admin Dashboard - Support Tools](ADMIN_DASHBOARD.md#support-tools)
- **Moderation**: [Admin Dashboard - Content Moderation](ADMIN_DASHBOARD.md#content-moderation)

### Content Management

- **Files**: [Content Management - File Upload](CONTENT_MANAGEMENT.md#file-upload-and-storage)
- **Documents**: [Content Management - Document Management](CONTENT_MANAGEMENT.md#document-management)
- **Presets**: [Content Management - Preset Templates](CONTENT_MANAGEMENT.md#preset-templates)
- **Voices**: [Content Management - Voice Cloning](CONTENT_MANAGEMENT.md#voice-cloning)
- **API**: [Content Management - API Reference](CONTENT_MANAGEMENT.md#api-reference)

## 🔍 Search by Use Case

### "I want to..."

#### Set up the project for the first time

→ [Setup Guide](SETUP.md)

#### Understand how authentication works

→ [Architecture Documentation - Authentication Flow](ARCHITECTURE.md#authentication-flow)
→ [API Documentation - Authentication Endpoints](API.md#authentication-endpoints)

#### Add a new API endpoint

→ [Architecture Documentation - Layer Architecture](ARCHITECTURE.md#layer-architecture)
→ [API Documentation - Response Format](API.md#response-format)

#### Configure environment variables

→ [Environment Variables](ENVIRONMENT.md)
→ [Setup Guide - Environment Configuration](SETUP.md#configure-environment-variables)

#### Deploy to production

→ [Setup Guide - Deployment](SETUP.md#deployment)
→ [Environment Variables - Production](ENVIRONMENT.md#production)

#### Write tests

→ [Architecture Documentation - Testing Strategy](ARCHITECTURE.md#testing-strategy)
→ [Setup Guide - Testing](SETUP.md#testing)

#### Understand the codebase structure

→ [Architecture Documentation - Directory Structure](ARCHITECTURE.md#directory-structure)

#### Debug email sending issues

→ [Setup Guide - Troubleshooting - Email Not Sending](SETUP.md#email-not-sending)
→ [Environment Variables - Email Configuration](ENVIRONMENT.md#email-smtp-configuration)

#### Optimize performance

→ [Architecture Documentation - Performance Considerations](ARCHITECTURE.md#performance-considerations)

#### Implement a new feature

→ [Architecture Documentation - Design Patterns](ARCHITECTURE.md#design-patterns)
→ [Architecture Documentation - Data Flow](ARCHITECTURE.md#data-flow)

#### Upload and manage files

→ [Content Management - File Upload](CONTENT_MANAGEMENT.md#file-upload-and-storage)

#### Create and manage documents

→ [Content Management - Document Management](CONTENT_MANAGEMENT.md#document-management)

#### Use preset templates

→ [Content Management - Preset Templates](CONTENT_MANAGEMENT.md#preset-templates)

#### Create custom voices

→ [Content Management - Voice Cloning](CONTENT_MANAGEMENT.md#voice-cloning)
→ [Voice Cloning Guide](VOICE_CLONING.md)

#### Set up billing and subscriptions

→ [Billing Documentation](BILLING.md)
→ [Billing - Getting Started](BILLING.md#getting-started)

#### Manage subscription plans

→ [Billing - Subscription Management](BILLING.md#subscription-management)
→ [Plan Management Guide](PLAN_MANAGEMENT.md)

#### Process payments

→ [Billing - Payment Processing](BILLING.md#payment-processing)

#### Track credit usage

→ [Billing - Credit System](BILLING.md#credit-system)
→ [Credit System Guide](CREDIT_SYSTEM.md)

#### Manage users as admin

→ [Admin Dashboard - User Management](ADMIN_DASHBOARD.md#user-management)

#### Manage workspaces as admin

→ [Admin Dashboard - Workspace Management](ADMIN_DASHBOARD.md#workspace-management)

#### Generate reports

→ [Admin Dashboard - Reports](ADMIN_DASHBOARD.md#reports)

#### Monitor system health

→ [Admin Dashboard - Support Tools](ADMIN_DASHBOARD.md#support-tools)

#### Moderate content

→ [Admin Dashboard - Content Moderation](ADMIN_DASHBOARD.md#content-moderation)

## 📋 Cheat Sheets

### Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run type-check            # Check TypeScript

# Database
npm run db:generate           # Generate Prisma client
npm run db:migrate            # Run migrations
npm run db:studio             # Open Prisma Studio

# Testing
npm test                      # Run all tests
npm run test:e2e             # Run e2e tests

# Code Quality
npm run lint:fix             # Fix linting issues
npm run format               # Format code
```

### Environment Variables Quick Reference

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_FROM="noreply@example.com"

# Optional
REDIS_URL="redis://..."
SENTRY_DSN="https://..."
```

### API Endpoints Quick Reference

```
POST   /api/auth/register
POST   /api/auth/verify-email
POST   /api/auth/request-reset
POST   /api/auth/reset-password
POST   /api/auth/logout

GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/password
PATCH  /api/users/me/email

GET    /api/workspaces
POST   /api/workspaces
PATCH  /api/workspaces/:id
POST   /api/workspaces/:id/switch
```

## 🆘 Getting Help

### Documentation Not Clear?

If you find any documentation unclear or incomplete:

1. Check the [Troubleshooting](SETUP.md#troubleshooting) section
2. Search for your issue in the documentation
3. Review related sections in other documents
4. Check the code comments in the source files

### Common Questions

**Q: Where do I start?**
A: Begin with the [Setup Guide](SETUP.md) to get your environment running.

**Q: How do I add a new feature?**
A: Read the [Architecture Documentation](ARCHITECTURE.md) to understand the layer architecture and design patterns.

**Q: How do I configure environment variables?**
A: See [Environment Variables](ENVIRONMENT.md) for detailed explanations of all configuration options.

**Q: Where can I find API endpoint details?**
A: Check the [API Documentation](API.md) for comprehensive endpoint reference.

**Q: How do I deploy to production?**
A: Follow the [Deployment](SETUP.md#deployment) section in the Setup Guide.

## 📝 Documentation Standards

All documentation follows these standards:

- **Clear Structure**: Organized with headers and sections
- **Code Examples**: Practical examples for all concepts
- **Cross-References**: Links to related documentation
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Recommended approaches
- **Security Notes**: Security considerations highlighted

## 🔄 Documentation Updates

This documentation is maintained alongside the codebase. When making changes:

1. Update relevant documentation files
2. Add examples for new features
3. Update the API documentation for new endpoints
4. Add troubleshooting tips for common issues
5. Keep the architecture documentation in sync with code changes

## 📚 Additional Resources

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Related Specifications

- [Requirements Document](../.kiro/specs/nextjs-foundation/requirements.md)
- [Design Document](../.kiro/specs/nextjs-foundation/design.md)
- [Task List](../.kiro/specs/nextjs-foundation/tasks.md)

---

**Last Updated**: November 2024

**Version**: 1.0.0

**Maintained By**: AIKEEDO Development Team
