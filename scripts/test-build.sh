#!/bin/bash

# Test Build Script
# This script runs the same build that Vercel runs during deployment

echo "🔍 Testing production build (same as Vercel)..."
echo ""

# Run the build
npm run build

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build failed! Fix the errors above before pushing to GitHub."
  exit 1
fi

echo ""
echo "🎉 Build successful! Safe to push to GitHub/Vercel."
