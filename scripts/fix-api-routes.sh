#!/bin/bash

# Fix API Routes - Add dynamic export to all API routes
# This fixes the "couldn't be rendered statically" error

echo "🔧 Fixing API routes..."
echo ""

# Find all route.ts files in app/api directory
find app/api -name "route.ts" -type f | while read -r file; do
  # Check if file already has dynamic export
  if grep -q "export const dynamic" "$file"; then
    echo "⏭️  Skipping $file (already has dynamic export)"
  else
    # Add dynamic export at the top of the file (after imports)
    # Find the line number of the first export function
    first_export_line=$(grep -n "^export async function" "$file" | head -1 | cut -d: -f1)
    
    if [ -n "$first_export_line" ]; then
      # Insert dynamic export before the first export function
      sed -i.bak "${first_export_line}i\\
export const dynamic = 'force-dynamic';\\
" "$file"
      
      # Remove backup file
      rm "${file}.bak"
      
      echo "✅ Fixed $file"
    else
      echo "⚠️  Skipped $file (no export function found)"
    fi
  fi
done

echo ""
echo "✅ All API routes fixed!"
echo ""
echo "Next steps:"
echo "1. Commit and push the changes"
echo "2. Vercel will automatically redeploy"
echo "3. The errors should be gone!"
