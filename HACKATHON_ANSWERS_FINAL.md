# Kiroween Hackathon - Final Answers

## Vibe Coding

**How did you structure your conversations with Kiro to build your project?**

I used vibe coding for approximately 20% of the project - primarily for bug fixes, optimizations, and edge cases that emerged during development. My conversation structure followed this pattern:

1. **Provide context**: Describe the problem and show relevant code
2. **State the goal**: What needs to be fixed or improved
3. **Iterate quickly**: Ask follow-up questions to refine the solution
4. **Verify immediately**: Run tests after each change

Example conversation flow:
- Me: "The credit deduction is happening twice for streaming AI responses. Here's the usage tracking code..."
- Kiro: [Analyzes code, identifies duplicate call in stream handler]
- Me: "Good catch. Also ensure we handle connection drops gracefully"
- Kiro: [Adds error handling and cleanup logic]
- Me: "Perfect. Now add a test for this scenario"
- Kiro: [Generates test case]

**What was the most impressive code generation Kiro helped you with?**

The circuit breaker pattern for AI provider failover. I described the requirement: "When an AI provider fails, automatically switch to a backup provider without the user noticing. Track failure rates and temporarily disable providers that are consistently failing."

Kiro generated:
- A complete circuit breaker implementation with three states (closed, open, half-open)
- Exponential backoff logic for retry attempts
- Automatic provider health tracking
- Graceful degradation when all providers are down
- Comprehensive error logging and metrics

This would have taken me 2-3 days to implement and test properly. Kiro generated production-ready code in minutes, including edge cases I hadn't considered (like handling partial failures during streaming responses).

---

## Agent Hooks

**N/A** - I did not use agent hooks in this project. The development workflow was primarily spec-driven with conversational refinements, and I didn't set up automated hooks for file changes or other events.

---

## Spec-Driven Development

**How did you structure your spec for Kiro to implement?**

I created 6 major specs, each with three files:

1. **requirements.md**: Acceptance criteria and feature descriptions
   - User stories and use cases
   - Functional requirements
   - Non-functional requirements (performance, security)
   - Success criteria

2. **design.md**: Architecture and technical decisions
   - System architecture diagrams
   - Database schema changes
   - API endpoint designs
   - Technology choices and rationale
   - Integration points with existing code

3. **tasks.md**: Step-by-step implementation plan
   - 20-40 tasks per spec, ordered by dependency
   - Each task clearly defined with inputs/outputs
   - Acceptance criteria per task
   - Testing requirements

Example structure from `nextjs-billing` spec:
- Requirements: "Users can purchase credits via Stripe, subscribe to plans, view invoices"
- Design: "Credit ledger table, Stripe webhook handlers, subscription state machine"
- Tasks: "1. Create credit ledger schema, 2. Implement Stripe checkout, 3. Add webhook handlers..."

**How did the spec-driven approach improve your development process?**

Specs provided three major benefits:

1. **Managed complexity**: Breaking down large features (like billing with subscriptions + credits + webhooks) into 30+ small tasks made them manageable

2. **Maintained consistency**: Kiro followed the architectural patterns defined in the design doc, ensuring all code fit together properly

3. **Enabled incremental progress**: I could implement and test one task at a time, catching issues early rather than debugging a massive feature all at once

**How did this compare to vibe coding?**

| Aspect | Spec-Driven | Vibe Coding |
|--------|-------------|-------------|
| **Best for** | Large features (20+ files) | Quick fixes (1-5 files) |
| **Planning** | Upfront design required | Exploratory, iterative |
| **Consistency** | High - follows defined patterns | Variable - depends on conversation |
| **Speed** | Slower start, faster overall | Fast start, can slow down |
| **Use in project** | 80% (major features) | 20% (refinements) |

Specs were essential for features that touched multiple subsystems (like billing affecting auth, workspaces, and AI services). Vibe coding was perfect for "fix this bug" or "optimize this query" tasks.

---

## Steering Docs

**How did you leverage steering to improve Kiro's responses?**

I created 3 steering documents that Kiro applied to every interaction:

1. **tech.md**: Technology stack and standards
   - Enforced TypeScript strict mode usage
   - Standardized testing approaches (Vitest, Playwright, fast-check)
   - Defined common commands and workflows

2. **structure.md**: Architecture rules and file organization
   - Enforced Clean Architecture layer boundaries
   - Defined file naming conventions (PascalCase for components, kebab-case for utilities)
   - Specified import order and path alias usage

3. **product.md**: Business context and domain knowledge
   - Explained the credit system and multi-tenant architecture
   - Defined user roles and permissions
   - Described feature requirements and use cases

**Was there a particular strategy that made the biggest difference?**

The biggest impact came from **structure.md** enforcing Clean Architecture boundaries. Without it, Kiro would naturally take shortcuts (like importing Prisma directly in domain entities or mixing business logic with API routes).

With structure.md, Kiro consistently:
- Kept domain layer pure (no infrastructure dependencies)
- Used repository interfaces instead of direct database access
- Separated business logic from presentation logic
- Maintained consistent file organization across 150+ files

This prevented architectural drift as the codebase grew. Every file Kiro generated followed the same patterns because the rules were encoded in steering docs, not just explained in individual conversations.

The steering docs essentially gave Kiro "institutional memory" - patterns established in week 1 were still being applied correctly in week 5.

---

## MCP

**N/A** - I did not use MCP (Model Context Protocol) extensions in this project. The built-in Kiro features (specs, steering, and conversational coding) were sufficient for building the platform. All integrations (AI providers, Stripe, S3, etc.) were implemented using standard SDKs and APIs without requiring custom MCP servers.
