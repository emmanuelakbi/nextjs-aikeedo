# Product Overview

AIKEEDO is a Next.js-based AI services platform that provides multi-tenant workspace management with integrated AI capabilities. The platform enables users to interact with multiple AI providers (OpenAI, Anthropic, Google, Mistral) for text generation, image creation, speech synthesis, and transcription services.

## Core Features

### User & Workspace Management

- **Multi-tenant Workspaces**: Users can create and manage multiple workspaces with isolated resources and credit allocations
- **Authentication**: Secure email/password authentication with email verification, password reset, and session management
- **User Profiles**: Customizable profiles with preferences and settings
- **Workspace Switching**: Seamless switching between workspaces with context preservation

### AI Services Integration

- **Unified AI Interface**: Single API for multiple AI providers with automatic failover and error handling
- **Text Generation**: Chat completions and text generation with streaming support
- **Image Generation**: AI-powered image creation with DALL-E and other providers
- **Speech Synthesis**: Text-to-speech with multiple voices and languages
- **Audio Transcription**: Speech-to-text transcription services
- **Voice Cloning**: Custom voice creation and management for personalized TTS
- **Circuit Breaker Pattern**: Automatic provider failover on errors
- **Model Caching**: Intelligent caching of AI model responses

### Billing & Credits System

- **Credit-based Billing**: Flexible credit system with subscription plans and one-time purchases
- **Subscription Management**: Multiple plan tiers with recurring billing via Stripe
- **Usage Tracking**: Real-time tracking of credit consumption across all services
- **Invoice Generation**: Automatic invoice creation and management
- **Payment Methods**: Support for multiple payment methods with secure storage
- **Trial Periods**: Optional trial periods for new users
- **Credit Purchases**: One-time credit purchases in addition to subscriptions

### Content Management

- **Document Management**: Create, edit, and organize documents with version history
- **File Storage**: Secure file upload and storage with S3 or local storage
- **Conversation History**: Persistent chat conversations with search and filtering
- **Prompt Presets**: Reusable prompt templates for common tasks
- **Media Processing**: Image and audio file processing and optimization

### Affiliate Program

- **Referral Tracking**: Cookie-based referral tracking with conversion attribution
- **Commission Calculation**: Flexible commission rates and calculation rules
- **Payout Management**: Automated payout processing with Stripe Connect
- **Affiliate Dashboard**: Real-time statistics and earnings tracking
- **Referral Links**: Custom referral link generation

### Admin Tools

- **User Impersonation**: Secure admin impersonation for support and debugging
- **Audit Logging**: Comprehensive audit trail of all system actions
- **Content Moderation**: Tools for reviewing and moderating user-generated content
- **Reporting System**: Analytics and reporting for usage, revenue, and performance
- **Support Tools**: Admin utilities for user management and troubleshooting

### Performance & Security

- **Component Preloading**: Intelligent preloading of components for faster navigation
- **Lazy Loading**: Code splitting and lazy loading for optimal bundle sizes
- **Caching Strategies**: Multi-layer caching (Redis, route cache, session cache)
- **Query Optimization**: Database query optimization and connection pooling
- **Rate Limiting**: Configurable rate limiting per endpoint and user
- **CSRF Protection**: Token-based CSRF protection on all mutations
- **Security Headers**: Comprehensive security headers and CSP policies
- **Input Sanitization**: XSS prevention and input validation

## Configuration System

The platform is **fully configurable without code changes** through a centralized configuration system:

- **Feature Flags**: Enable/disable features dynamically
- **Credit Rates**: Configure credit costs per AI service
- **Subscription Plans**: Define plan tiers, pricing, and features
- **Affiliate Settings**: Commission rates, payout thresholds, cookie duration
- **Rate Limits**: Per-endpoint and per-user rate limiting
- **AI Provider Settings**: API keys, model selection, fallback providers
- **Branding**: Customize colors, logos, and UI elements
- **Security Settings**: Session duration, password requirements, CORS
- **Email Templates**: Customize transactional email content

**Configuration Commands:**

```bash
npm run config:view      # View current configuration
npm run config:init      # Create custom configuration
npm run config:validate  # Validate configuration
npm run config:diff      # Compare with defaults
```

## Business Model

The platform operates on a **credit-based system** where:

- Users purchase credits through subscriptions or one-time purchases
- Credits are consumed based on AI service usage (tokens, generations, etc.)
- Workspaces can have allocated credits from subscriptions plus purchased credits
- Affiliate partners earn commissions on referred user conversions and can request payouts
- Flexible pricing allows for different credit rates per AI service and model

## Key Domains

- **User Management**: Authentication, profiles, preferences, sessions, email verification
- **Workspace Management**: Multi-tenant workspaces with resource isolation and credit allocation
- **Billing & Credits**: Subscriptions, one-time purchases, usage tracking, invoicing, payment methods
- **AI Services**: Text generation, image creation, speech synthesis, transcription, voice cloning
- **Content**: Documents, conversations, presets, file management, media processing
- **Affiliate Program**: Referral tracking, commission calculation, payout management, analytics
- **Admin Tools**: User impersonation, audit logs, content moderation, reporting, support utilities
- **Configuration**: Centralized configuration system for all platform settings

## Development Principles

- **Clean Architecture**: Separation of concerns with clear layer boundaries
- **Domain-Driven Design**: Business logic organized by domain concepts
- **Type Safety**: Strict TypeScript with comprehensive type coverage
- **Testing**: Unit, integration, property-based, and E2E tests
- **Performance**: Optimized for speed with caching, lazy loading, and code splitting
- **Security**: Defense in depth with multiple security layers
- **Maintainability**: Well-documented, modular, and testable code
- **Configurability**: Customize without code changes through configuration

## User Roles & Permissions

### User Role

- Create and manage own workspaces
- Access AI services within credit limits
- Manage own profile and settings
- View own usage statistics
- Manage own subscriptions and payments
- Participate in affiliate program (if enabled)

### Admin Role

- All user permissions
- Impersonate users for support
- View audit logs
- Moderate content
- View system-wide analytics
- Manage users (suspend, delete)
- Access admin dashboard
- Configure system settings

### Workspace Owner

- Manage workspace settings
- Invite workspace members (if multi-user workspaces enabled)
- View workspace usage
- Manage workspace credits
- Delete workspace

## Credit System Details

### Credit Consumption

Credits are consumed based on:

- **Text Generation**: Per 1,000 tokens (input + output)
- **Image Generation**: Per image generated
- **Speech Synthesis**: Per character or per minute of audio
- **Transcription**: Per minute of audio
- **Voice Cloning**: Per voice created

### Credit Sources

1. **Subscription Credits**: Allocated monthly based on plan
2. **Purchased Credits**: One-time credit purchases
3. **Bonus Credits**: Promotional or referral bonuses
4. **Trial Credits**: Initial credits for new users

### Credit Allocation

- Credits are allocated to workspaces
- Subscription credits reset monthly
- Purchased credits never expire
- Credits are consumed in order: trial → subscription → purchased

### Credit Tracking

- Real-time credit balance updates
- Usage history with detailed breakdowns
- Low credit notifications
- Automatic top-up options (configurable)

## Subscription Plans

### Typical Plan Structure

1. **Free/Trial Plan**
   - Limited credits per month
   - Access to basic AI models
   - Limited features
   - No support

2. **Starter Plan**
   - Moderate monthly credits
   - Access to most AI models
   - Standard features
   - Email support

3. **Professional Plan**
   - High monthly credits
   - Access to all AI models
   - All features
   - Priority support
   - Custom voice cloning

4. **Enterprise Plan**
   - Custom credit allocation
   - Dedicated support
   - Custom integrations
   - SLA guarantees
   - Volume discounts

**Note**: Plans are fully configurable through the configuration system.

## Affiliate Program Details

### How It Works

1. User signs up as affiliate
2. Receives unique referral link
3. Shares link with potential customers
4. Earns commission on conversions
5. Requests payout when threshold reached

### Commission Structure (Configurable)

- **One-time Purchases**: Percentage of purchase amount
- **Subscriptions**: Percentage of first payment or recurring
- **Lifetime Value**: Commission on all payments (optional)

### Payout Process

1. Affiliate requests payout
2. Admin reviews request
3. Payout processed via Stripe Connect
4. Affiliate receives funds
5. Transaction recorded in system

### Tracking

- Cookie-based tracking (30-90 days configurable)
- Conversion attribution
- Real-time statistics
- Detailed reporting

## AI Service Details

### Text Generation

- **Models**: GPT-3.5, GPT-4, Claude, Gemini, Mistral
- **Features**: Streaming, system prompts, temperature control
- **Use Cases**: Chat, content generation, code generation
- **Credit Cost**: Based on tokens consumed

### Image Generation

- **Models**: DALL-E 2, DALL-E 3
- **Features**: Multiple sizes, quality settings
- **Use Cases**: Art, design, illustrations
- **Credit Cost**: Per image, varies by size/quality

### Speech Synthesis

- **Providers**: OpenAI TTS, custom voices
- **Features**: Multiple voices, languages, speeds
- **Use Cases**: Audiobooks, voiceovers, accessibility
- **Credit Cost**: Per character or per minute

### Transcription

- **Provider**: OpenAI Whisper
- **Features**: Multiple languages, timestamps
- **Use Cases**: Meeting notes, subtitles, accessibility
- **Credit Cost**: Per minute of audio

### Voice Cloning

- **Features**: Custom voice creation from samples
- **Use Cases**: Personalized TTS, brand voices
- **Credit Cost**: Per voice created + usage

## Content Management Features

### Documents

- Create, edit, delete documents
- Rich text editor
- Markdown support
- Version history (optional)
- Organize by workspace
- Search and filter
- Export options

### Files

- Upload images, audio, documents
- Secure storage (S3 or local)
- File type validation
- Size limits (configurable)
- Automatic cleanup of unused files
- Presigned URLs for secure access

### Conversations

- Persistent chat history
- Search conversations
- Filter by date, model, workspace
- Export conversations
- Delete conversations
- Resume conversations

### Presets

- Save prompt templates
- Reusable configurations
- Share within workspace (optional)
- Categories and tags
- Quick access from generation interfaces

## Admin Dashboard Features

### User Management

- View all users
- Search and filter users
- Suspend/unsuspend users
- Delete users
- View user details
- Impersonate users
- Reset passwords
- Verify emails manually

### Audit Logging

- Track all system actions
- Filter by user, action, date
- Export audit logs
- Retention policies
- Compliance reporting

### Content Moderation

- Review user-generated content
- Flag inappropriate content
- Take action (warn, suspend, delete)
- Moderation queue
- Automated filtering (optional)

### Analytics & Reporting

- User registration trends
- Revenue metrics
- Credit consumption
- AI provider usage
- Popular features
- Conversion rates
- Churn analysis
- Custom reports

### System Health

- Monitor API status
- Database performance
- Error rates
- Response times
- Resource usage
- Queue status

## Integration Points

### Payment Processing (Stripe)

- Checkout sessions
- Subscription management
- Invoice generation
- Payment method storage
- Webhook handling
- Payout processing

### Email Service (SMTP)

- Transactional emails
- Email verification
- Password reset
- Notifications
- Receipts and invoices
- Custom templates

### Storage (S3 or Local)

- File uploads
- Image storage
- Audio storage
- Presigned URLs
- Automatic cleanup

### Caching (Redis)

- Session storage
- Rate limiting
- Data caching
- Queue management

### AI Providers

- OpenAI API
- Anthropic API
- Google AI API
- Mistral AI API
- Automatic failover
- Usage tracking

## Customization Options

### Branding

- Application name
- Logo and favicon
- Color scheme
- Custom domain
- Email templates
- Terms of service
- Privacy policy

### Features

- Enable/disable features via config
- Feature flags for gradual rollout
- A/B testing support
- Beta features

### Pricing

- Credit rates per service
- Subscription plan pricing
- Affiliate commission rates
- Currency settings
- Tax handling

### Limits

- Rate limits per endpoint
- File size limits
- Credit limits
- API usage limits
- Workspace limits

### Behavior

- Session duration
- Password requirements
- Email verification required
- Trial period duration
- Credit expiration
- Referral cookie duration

## Scalability Considerations

### Horizontal Scaling

- Stateless API design
- Session storage in Redis
- Database connection pooling
- Load balancer compatible

### Vertical Scaling

- Efficient database queries
- Caching strategies
- Lazy loading
- Code splitting

### Database Scaling

- Read replicas support
- Connection pooling
- Query optimization
- Proper indexing

### Caching Strategy

- Redis for hot data
- React Query for client cache
- Route caching for static pages
- CDN for assets

### Cost Optimization

- Efficient AI provider usage
- Image optimization
- Code splitting
- Serverless functions
- Pay-per-use resources

## Compliance & Legal

### Data Privacy

- GDPR compliance ready
- User data export
- Right to deletion
- Privacy policy
- Cookie consent (implement as needed)

### Security

- SOC 2 ready architecture
- Audit logging
- Encryption at rest
- Encryption in transit
- Regular security updates

### Terms of Service

- Customizable terms
- Acceptable use policy
- Refund policy
- Service level agreements

## Future Enhancements (Roadmap Ideas)

### Planned Features

- Multi-user workspaces with roles
- API access for developers
- Webhook support
- Advanced analytics
- Custom AI model fine-tuning
- White-label options
- Mobile applications
- Browser extensions

### Integration Opportunities

- Zapier integration
- Slack integration
- Discord integration
- WordPress plugin
- Chrome extension
- VS Code extension

### Advanced Features

- A/B testing framework
- Feature flags system
- Advanced reporting
- Custom dashboards
- Workflow automation
- Team collaboration tools
- Version control for documents
- Real-time collaboration
