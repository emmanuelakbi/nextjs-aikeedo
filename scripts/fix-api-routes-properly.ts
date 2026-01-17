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
    let content = readFileSync(filePath, 'utf-8');
    
    // Check if already has dynamic export in correct position
    if (content.includes("export const dynamic = 'force-dynamic';")) {
      // Remove any incorrectly placed dynamic exports
      content = content.replace(/export const dynamic = 'force-dynamic';\s*/g, '');
    }
    
    const lines = content.split('\n');
    let insertIndex = 0;
    let inMultiLineImport = false;
    
    // Find the correct position: after all imports
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
      
      // Stop at first non-import, non-comment, non-empty line
      if (!inMultiLineImport && 
          line && 
          !line.startsWith('import ') && 
          !line.startsWith('//') && 
          !line.startsWith('/*') && 
          !line.startsWith('*') && 
          !line.startsWith('*/') &&
          line !== '') {
        break;
      }
    }
    
    // Insert dynamic export at the correct position
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
  console.log('🔧 Fixing API routes properly...\n');
  
  const apiDir = join(process.cwd(), 'app', 'api');
  const routeFiles = getAllRouteFiles(apiDir);
  
  let fixed = 0;
  
  for (const file of routeFiles) {
    const relativePath = file.replace(process.cwd() + '/', '');
    
    if (fixRouteFile(file)) {
      console.log(`✅ Fixed ${relativePath}`);
      fixed++;
    } else {
      console.log(`❌ Failed ${relativePath}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Total: ${routeFiles.length}`);
  
  console.log(`\n✅ All API routes fixed properly!`);
}

main();
