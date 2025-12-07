#!/bin/bash

# Deploy Migrations Script
# This script applies database migrations to production

echo "🚀 Deploying database migrations..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set it first:"
  echo "  export DATABASE_URL='your-neon-production-url'"
  echo ""
  exit 1
fi

echo "📊 Database URL: ${DATABASE_URL:0:30}..."
echo ""

# Run migrations
echo "⚙️  Running migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migrations deployed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Go to Vercel dashboard"
  echo "2. Redeploy your application"
  echo "3. Try logging in again"
else
  echo ""
  echo "❌ Migration deployment failed"
  echo "Please check the error messages above"
  exit 1
fi
