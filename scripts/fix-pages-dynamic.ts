#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const DYNAMIC_EXPORT = "export const dynamic = 'force-dynamic';\n\n";

// Pages that use auth() or requireAuth() need dynamic export
const pagesToFix = [
  'app/page.tsx',
  'app/(dashboard)/billing/page.tsx',
  'app/(dashboard)/files/page.tsx',
  'app/(dashboard)/profile/page.tsx',
  'app/(dashboard)/affiliate/page.tsx',
  'app/(dashboard)/affiliate/reports/page.tsx',
  'app/(dashboard)/workspaces/page.tsx',
  'app/(dashboard)/dashboard/page.tsx',
  'app/(dashboard)/admin/page.tsx',
  'app/(dashboard)/admin/users/page.tsx',
  'app/(dashboard)/admin/users/[id]/page.tsx',
  'app/(dashboard)/admin/workspaces/page.tsx',
  'app/(dashboard)/admin/workspaces/[id]/page.tsx',
  'app/(dashboard)/admin/subscriptions/page.tsx',
  'app/(dashboard)/admin/settings/page.tsx',
  'app/(dashboard)/admin/affiliate/page.tsx',
  'app/(dashboard)/admin/affiliate/payouts/page.tsx',
];

function fixPage(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    // Check if already has dynamic export
    if (content.includes("export const dynamic = 'force-dynamic';")) {
      return false;
    }
    
    const lines = content.split('\n');
    let insertIndex = 0;
    let inMultiLineImport = false;
    let foundComment = false;
    
    // Find the correct position: after imports and comments, before first export
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';
      
      // Track multi-line imports
      if (line.startsWith('import ') && line.includes('{') && !line.includes('}')) {
        inMultiLineImport = true;
      }
      
      if (inMultiLineImport && line.includes('}')) {
        inMultiLineImport = false;
        insertIndex = i + 1;
        continue;
      }
      
      // Single line import
      if (line.startsWith('import ') && !inMultiLineImport) {
        insertIndex = i + 1;
      }
      
      // Track comments
      if (line.startsWith('/**') || line.startsWith('/*')) {
        foundComment = true;
      }
      
      if (foundComment && (line.endsWith('*/') || line.startsWith(' */'))) {
        insertIndex = i + 1;
        foundComment = false;
      }
      
      // Stop at first export
      if (!inMultiLineImport && line.startsWith('export ')) {
        break;
      }
    }
    
    // Insert dynamic export
    lines.splice(insertIndex, 0, DYNAMIC_EXPORT);
    
    const newContent = lines.join('\n');
    writeFileSync(filePath, newContent, 'utf-8');
    
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

function main() {
  console.log('🔧 Adding dynamic export to pages...\n');
  
  let fixed = 0;
  let skipped = 0;
  
  for (const file of pagesToFix) {
    try {
      if (fixPage(file)) {
        console.log(`✅ Fixed ${file}`);
        fixed++;
      } else {
        console.log(`⏭️  Skipped ${file} (already has dynamic export)`);
        skipped++;
      }
    } catch (error) {
      console.log(`❌ Error with ${file}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${pagesToFix.length}`);
  
  if (fixed > 0) {
    console.log(`\n✅ Pages fixed!`);
  }
}

main();
