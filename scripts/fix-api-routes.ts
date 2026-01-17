#!/usr/bin/env tsx

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DYNAMIC_EXPORT = "export const dynamic = 'force-dynamic';\n\n";

function getAllRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixRouteFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Check if already has dynamic export
    if (content.includes("export const dynamic")) {
      return false;
    }
    
    // Find the position to insert (after imports, before first export)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import or first export
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';
      
      if (line.startsWith('import ')) {
        insertIndex = i + 1;
      } else if (line.startsWith('export async function') || line.startsWith('export function')) {
        // Insert before this line
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
  console.log('🔧 Fixing API routes...\n');
  
  const apiDir = join(process.cwd(), 'app', 'api');
  const routeFiles = getAllRouteFiles(apiDir);
  
  let fixed = 0;
  let skipped = 0;
  
  for (const file of routeFiles) {
    const relativePath = file.replace(process.cwd() + '/', '');
    
    if (fixRouteFile(file)) {
      console.log(`✅ Fixed ${relativePath}`);
      fixed++;
    } else {
      console.log(`⏭️  Skipped ${relativePath} (already has dynamic export)`);
      skipped++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${routeFiles.length}`);
  
  if (fixed > 0) {
    console.log(`\n✅ All API routes fixed!`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the changes`);
    console.log(`2. Commit and push: git add . && git commit -m "fix: add dynamic export to API routes" && git push`);
    console.log(`3. Vercel will automatically redeploy`);
  } else {
    console.log(`\n✅ All routes already have dynamic export!`);
  }
}

main();
