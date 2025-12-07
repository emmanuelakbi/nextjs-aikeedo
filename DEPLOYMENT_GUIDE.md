# Deployment Guide

## Before Pushing to GitHub/Vercel

To avoid build failures on Vercel, **always test your build locally first**:

```bash
npm run test-build
```

This runs the exact same build process that Vercel uses. If it passes locally, it will pass on Vercel!

## Quick Deployment Checklist

1. ✅ **Test build locally**
   ```bash
   npm run test-build
   ```

2. ✅ **Commit your changes**
   ```bash
   git add .
   git commit -m "your message"
   ```

3. ✅ **Push to GitHub**
   ```bash
   git push origin main
   ```

4. ✅ **Vercel auto-deploys** - Check your Vercel dashboard for deployment status

## Common Build Errors

### TypeScript Errors
- **Error**: `Type error: ...`
- **Fix**: Run `npm run type-check` to see all TypeScript errors
- **Tip**: Most errors are about unused variables or type mismatches

### Import Errors
- **Error**: `Cannot find module ...`
- **Fix**: Check your import paths and make sure files exist
- **Tip**: Use `@/` prefix for absolute imports (e.g., `@/lib/db/prisma`)

### Prisma Errors
- **Error**: `Property does not exist on type ...`
- **Fix**: Run `npm run db:generate` to regenerate Prisma client
- **Tip**: Do this after any schema changes

## Environment Variables

### Local Development (.env)
- Used for local development only
- **Never commit this file to git**

### Production (Vercel Dashboard)
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add/update variables
4. Redeploy for changes to take effect

### Required Variables for Production
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for session encryption
- `NEXTAUTH_URL` - Your Vercel app URL
- `OPENROUTER_API_KEY` - Your OpenRouter API key (or individual AI provider keys)

## Database Migrations

### When to Run Migrations
- After pulling schema changes from git
- Before deploying if schema changed
- When setting up a new database

### How to Run Migrations

**For Neon Production Database:**
```bash
DATABASE_URL="your-neon-url" npx prisma migrate deploy
```

**For Local Development:**
```bash
npm run db:migrate
```

## Troubleshooting

### Build Passes Locally But Fails on Vercel
1. Check environment variables are set in Vercel
2. Make sure you pushed all files to GitHub
3. Check Vercel build logs for specific errors

### Database Connection Errors
1. Verify `DATABASE_URL` is correct in Vercel
2. Check Neon database is running
3. Ensure IP allowlist includes Vercel (or use "Allow all")

### API Key Errors
1. Verify API keys are set in Vercel environment variables
2. Check keys are valid and not expired
3. Ensure keys have proper permissions

## Getting Help

If you see build errors:
1. Copy the full error message from Vercel logs
2. Run `npm run test-build` locally to reproduce
3. Check this guide for common solutions
4. Ask for help with the specific error message

## Useful Commands

```bash
# Test build before pushing
npm run test-build

# Check TypeScript errors
npm run type-check

# Check linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Check migration status
npx prisma migrate status
```
