/**
 * Property-Based Tests for TypeScript Compilation Success
 *
 * Feature: critical-fixes, Property 1: TypeScript Compilation Success
 * **Validates: Requirements 1.1, 1.2, 7.1, 7.5**
 *
 * Property: For any codebase state, running TypeScript compilation should
 * complete without errors and produce valid JavaScript output.
 *
 * This test validates that the TypeScript compiler can be invoked programmatically,
 * compilation produces no errors, and the output is valid JavaScript.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

// Get the project root directory
const projectRoot = path.resolve(__dirname, '../../..');

// Reserved words and global identifiers that should not be used as variable names
const RESERVED_WORDS = new Set([
  // JavaScript reserved words
  'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new',
  'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
  'with', 'class', 'const', 'enum', 'export', 'extends', 'import', 'super',
  'implements', 'interface', 'let', 'package', 'private', 'protected', 'public',
  'static', 'yield', 'await', 'async',
  // TypeScript reserved words
  'any', 'boolean', 'number', 'string', 'symbol', 'unknown', 'never', 'object',
  'type', 'namespace', 'module', 'declare', 'abstract', 'as', 'asserts', 'bigint',
  'readonly', 'keyof', 'unique', 'infer', 'is', 'out', 'override', 'satisfies',
  // Global identifiers that conflict in strict mode
  'name', 'length', 'arguments', 'caller', 'callee', 'eval', 'constructor',
  'prototype', '__proto__', 'toString', 'valueOf', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
  // Common global objects
  'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number',
  'Object', 'RegExp', 'String', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Symbol', 'Proxy', 'Reflect', 'console', 'window', 'document', 'global',
  'process', 'require', 'exports', 'module', 'Buffer', 'undefined', 'null',
  'NaN', 'Infinity', 'true', 'false',
]);

/**
 * Check if a string is a valid identifier that won't conflict with reserved words
 */
function isValidIdentifier(s: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s) && !RESERVED_WORDS.has(s.toLowerCase()) && !RESERVED_WORDS.has(s);
}

/**
 * Check if a string is a valid type/class/interface name (PascalCase)
 */
function isValidTypeName(s: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(s) && !RESERVED_WORDS.has(s.toLowerCase()) && !RESERVED_WORDS.has(s);
}

/**
 * Check if a string is a valid enum member name (UPPER_SNAKE_CASE)
 */
function isValidEnumMember(s: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(s) && !RESERVED_WORDS.has(s.toLowerCase()) && !RESERVED_WORDS.has(s);
}

/**
 * Helper function to run TypeScript type checking
 */
function runTypeCheck(): { success: boolean; output: string; errorCount: number } {
  try {
    const result = spawnSync('npx', ['tsc', '--noEmit'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 120000, // 2 minute timeout
      shell: true,
    });

    const output = result.stdout + result.stderr;
    const success = result.status === 0;
    
    // Count error lines (lines containing "error TS")
    const errorCount = (output.match(/error TS\d+/g) || []).length;

    return { success, output, errorCount };
  } catch (error) {
    return {
      success: false,
      output: error instanceof Error ? error.message : String(error),
      errorCount: -1,
    };
  }
}

/**
 * Helper function to check if TypeScript configuration is valid using TypeScript's built-in parser
 */
function validateTsConfig(): { valid: boolean; errors: string[]; config: ts.ParsedCommandLine | null } {
  const errors: string[] = [];
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  if (!fs.existsSync(tsconfigPath)) {
    errors.push('tsconfig.json not found');
    return { valid: false, errors, config: null };
  }

  try {
    // Use TypeScript's built-in config parser which handles comments
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    
    if (configFile.error) {
      errors.push(`Failed to read tsconfig.json: ${ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n')}`);
      return { valid: false, errors, config: null };
    }

    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      projectRoot
    );

    if (parsedConfig.errors.length > 0) {
      for (const error of parsedConfig.errors) {
        errors.push(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
      }
      return { valid: false, errors, config: null };
    }

    const options = parsedConfig.options;

    // Validate required compiler options
    if (options.strict !== true) {
      errors.push('strict mode is not enabled');
    }

    if (options.noEmit !== true) {
      errors.push('noEmit is not enabled');
    }

    if (options.isolatedModules !== true) {
      errors.push('isolatedModules is not enabled');
    }

    return { valid: errors.length === 0, errors, config: parsedConfig };
  } catch (error) {
    errors.push(`Failed to parse tsconfig.json: ${error instanceof Error ? error.message : String(error)}`);
    return { valid: false, errors, config: null };
  }
}

/**
 * Helper function to compile a TypeScript string and check for errors
 */
function compileTypeScriptString(code: string): { success: boolean; errors: ts.Diagnostic[] } {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
    isolatedModules: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile;
  
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (fileName === 'test.ts') {
      return ts.createSourceFile(fileName, code, languageVersion, true);
    }
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  const program = ts.createProgram(['test.ts'], compilerOptions, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  
  // Filter out errors related to missing modules (since we're testing isolated code)
  const relevantErrors = diagnostics.filter(d => 
    d.code !== 2307 && // Cannot find module
    d.code !== 2304 && // Cannot find name
    d.code !== 2503    // Cannot find namespace
  );

  return {
    success: relevantErrors.length === 0,
    errors: relevantErrors,
  };
}

/**
 * Feature: critical-fixes, Property 1: TypeScript Compilation Success
 * **Validates: Requirements 1.1, 1.2, 7.1, 7.5**
 */
describe('Property 1: TypeScript Compilation Success', () => {
  describe('TypeScript Configuration Validation', () => {
    it('should have a valid tsconfig.json with required settings', () => {
      const result = validateTsConfig();
      
      if (!result.valid) {
        console.log('TypeScript configuration errors:', result.errors);
      }
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have strict mode enabled in tsconfig.json', () => {
      const result = validateTsConfig();
      expect(result.config).not.toBeNull();
      expect(result.config?.options.strict).toBe(true);
    });

    it('should have isolatedModules enabled for Next.js compatibility', () => {
      const result = validateTsConfig();
      expect(result.config).not.toBeNull();
      expect(result.config?.options.isolatedModules).toBe(true);
    });

    it('should have noEmit enabled for type-checking only', () => {
      const result = validateTsConfig();
      expect(result.config).not.toBeNull();
      expect(result.config?.options.noEmit).toBe(true);
    });
  });

  describe('Full Codebase Type Checking', () => {
    it('should complete type checking without errors', () => {
      const result = runTypeCheck();

      if (!result.success) {
        // Log first few errors for debugging
        const errorLines = result.output.split('\n').filter(line => line.includes('error TS'));
        console.log(`TypeScript errors found (${result.errorCount} total):`);
        console.log(errorLines.slice(0, 10).join('\n'));
        if (errorLines.length > 10) {
          console.log(`... and ${errorLines.length - 10} more errors`);
        }
      }

      expect(result.success).toBe(true);
      expect(result.errorCount).toBe(0);
    }, 180000); // 3 minute timeout for full type check
  });

  describe('TypeScript Compiler Programmatic Invocation', () => {
    /**
     * Property: For any valid TypeScript variable declaration, compilation should succeed
     */
    it('should compile valid variable declarations', () => {
      fc.assert(
        fc.property(
          fc.record({
            varName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidIdentifier),
            varType: fc.constantFrom('string', 'number', 'boolean', 'null', 'undefined'),
            value: fc.constantFrom('"test"', '42', 'true', 'null', 'undefined'),
          }),
          ({ varName, varType, value }) => {
            // Match value to type
            let matchedValue = value;
            if (varType === 'string') matchedValue = '"test"';
            else if (varType === 'number') matchedValue = '42';
            else if (varType === 'boolean') matchedValue = 'true';
            else if (varType === 'null') matchedValue = 'null';
            else if (varType === 'undefined') matchedValue = 'undefined';

            const code = `const ${varName}: ${varType} = ${matchedValue};`;
            const result = compileTypeScriptString(code);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: For any valid TypeScript function declaration, compilation should succeed
     */
    it('should compile valid function declarations', () => {
      fc.assert(
        fc.property(
          fc.record({
            funcName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidIdentifier),
            paramName: fc.string({ minLength: 1, maxLength: 10 }).filter(isValidIdentifier),
            paramType: fc.constantFrom('string', 'number', 'boolean'),
            returnType: fc.constantFrom('string', 'number', 'boolean', 'void'),
          }),
          ({ funcName, paramName, paramType, returnType }) => {
            let returnValue = '';
            if (returnType === 'string') returnValue = 'return "";';
            else if (returnType === 'number') returnValue = 'return 0;';
            else if (returnType === 'boolean') returnValue = 'return true;';
            // void doesn't need a return

            const code = `function ${funcName}(${paramName}: ${paramType}): ${returnType} { ${returnValue} }`;
            const result = compileTypeScriptString(code);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: For any valid TypeScript interface declaration, compilation should succeed
     */
    it('should compile valid interface declarations', () => {
      fc.assert(
        fc.property(
          fc.record({
            interfaceName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidTypeName),
            propName: fc.string({ minLength: 1, maxLength: 15 }).filter(isValidIdentifier),
            propType: fc.constantFrom('string', 'number', 'boolean', 'string[]', 'number[]'),
            optional: fc.boolean(),
          }),
          ({ interfaceName, propName, propType, optional }) => {
            const optionalMarker = optional ? '?' : '';
            const code = `interface ${interfaceName} { ${propName}${optionalMarker}: ${propType}; }`;
            const result = compileTypeScriptString(code);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: For any valid TypeScript type alias, compilation should succeed
     */
    it('should compile valid type aliases', () => {
      fc.assert(
        fc.property(
          fc.record({
            typeName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidTypeName),
            baseType: fc.constantFrom(
              'string',
              'number',
              'boolean',
              'string | number',
              'string | null',
              '{ id: string }',
              'string[]',
              'readonly string[]'
            ),
          }),
          ({ typeName, baseType }) => {
            const code = `type ${typeName} = ${baseType};`;
            const result = compileTypeScriptString(code);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: For any valid TypeScript enum declaration, compilation should succeed
     */
    it('should compile valid enum declarations', () => {
      fc.assert(
        fc.property(
          fc.record({
            enumName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidTypeName),
            members: fc.array(
              fc.string({ minLength: 1, maxLength: 15 }).filter(isValidEnumMember),
              { minLength: 1, maxLength: 5 }
            ).map(arr => [...new Set(arr)]), // Ensure unique members
          }),
          ({ enumName, members }) => {
            if (members.length === 0) return; // Skip if no unique members
            
            const membersStr = members.map((m, i) => `${m} = ${i}`).join(', ');
            const code = `enum ${enumName} { ${membersStr} }`;
            const result = compileTypeScriptString(code);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: For any valid TypeScript class declaration, compilation should succeed
     */
    it('should compile valid class declarations', () => {
      fc.assert(
        fc.property(
          fc.record({
            className: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidTypeName),
            propName: fc.string({ minLength: 1, maxLength: 15 }).filter(isValidIdentifier),
            propType: fc.constantFrom('string', 'number', 'boolean'),
            visibility: fc.constantFrom('public', 'private', 'protected'),
          }),
          ({ className, propName, propType, visibility }) => {
            const code = `class ${className} { ${visibility} ${propName}: ${propType}; constructor() { this.${propName} = ${propType === 'string' ? '""' : propType === 'number' ? '0' : 'true'}; } }`;
            const result = compileTypeScriptString(code);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);
  });

  describe('Type Safety Validation', () => {
    /**
     * Property: Type mismatches should be detected by the compiler
     */
    it('should detect type mismatches in variable assignments', () => {
      fc.assert(
        fc.property(
          fc.record({
            varName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidIdentifier),
          }),
          ({ varName }) => {
            // This should fail: assigning string to number
            const code = `const ${varName}: number = "not a number";`;
            const result = compileTypeScriptString(code);
            
            // Should have compilation errors
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: Missing required properties should be detected
     */
    it('should detect missing required properties in object literals', () => {
      fc.assert(
        fc.property(
          fc.record({
            interfaceName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidTypeName),
            propName: fc.string({ minLength: 1, maxLength: 15 }).filter(isValidIdentifier),
          }),
          ({ interfaceName, propName }) => {
            // This should fail: missing required property
            const code = `
              interface ${interfaceName} { ${propName}: string; }
              const obj: ${interfaceName} = {};
            `;
            const result = compileTypeScriptString(code);
            
            // Should have compilation errors
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: Invalid function return types should be detected
     */
    it('should detect invalid function return types', () => {
      fc.assert(
        fc.property(
          fc.record({
            funcName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidIdentifier),
          }),
          ({ funcName }) => {
            // This should fail: returning string when number is expected
            const code = `function ${funcName}(): number { return "not a number"; }`;
            const result = compileTypeScriptString(code);
            
            // Should have compilation errors
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);
  });

  describe('JavaScript Output Validity', () => {
    /**
     * Property: Compiled TypeScript should produce syntactically valid JavaScript
     */
    it('should produce valid JavaScript from TypeScript compilation', () => {
      fc.assert(
        fc.property(
          fc.record({
            varName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidIdentifier),
            value: fc.constantFrom('42', '"hello"', 'true', '[]', '{}'),
          }),
          ({ varName, value }) => {
            const tsCode = `const ${varName} = ${value};`;
            
            // Compile to JavaScript
            const result = ts.transpileModule(tsCode, {
              compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.ESNext,
              },
            });

            // The output should be valid JavaScript
            expect(result.outputText).toBeDefined();
            expect(result.outputText.length).toBeGreaterThan(0);
            
            // Verify it's syntactically valid by attempting to parse it
            expect(() => {
              // Use Function constructor to validate syntax (doesn't execute)
              new Function(result.outputText);
            }).not.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);

    /**
     * Property: Type annotations should be stripped from JavaScript output
     */
    it('should strip type annotations from JavaScript output', () => {
      fc.assert(
        fc.property(
          fc.record({
            varName: fc.string({ minLength: 1, maxLength: 20 }).filter(isValidIdentifier),
            typeName: fc.constantFrom('string', 'number', 'boolean'),
          }),
          ({ varName, typeName }) => {
            const tsCode = `const ${varName}: ${typeName} = ${typeName === 'string' ? '"test"' : typeName === 'number' ? '42' : 'true'};`;
            
            // Compile to JavaScript
            const result = ts.transpileModule(tsCode, {
              compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.ESNext,
              },
            });

            // Type annotations should be stripped
            expect(result.outputText).not.toContain(`: ${typeName}`);
          }
        ),
        { numRuns: 10 }
      );
    }, 60000);
  });
});
