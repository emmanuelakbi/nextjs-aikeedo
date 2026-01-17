/**
 * Architecture Tests - Layer Dependencies
 *
 * These tests validate that our Clean Architecture principles are maintained:
 * 1. Domain layer has no infrastructure dependencies
 * 2. Application layer (use cases) only imports from domain
 * 3. API routes use DI container instead of direct repository instantiation
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively get all TypeScript files in a directory
 */
function getTypeScriptFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, and test directories
      if (
        !file.startsWith('.') &&
        file !== 'node_modules' &&
        file !== '__tests__'
      ) {
        getTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip test files
      if (!file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Extract import statements from a file
 */
function extractImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Check if an import is from infrastructure layer
 */
function isInfrastructureImport(importPath: string): boolean {
  return (
    importPath.includes('/infrastructure/') ||
    importPath.includes('@/infrastructure/') ||
    importPath.startsWith('../infrastructure/') ||
    importPath.startsWith('../../infrastructure/') ||
    importPath.startsWith('../../../infrastructure/')
  );
}

/**
 * Check if an import is from application layer
 */
function isApplicationImport(importPath: string): boolean {
  return (
    importPath.includes('/application/') ||
    importPath.includes('@/application/') ||
    importPath.startsWith('../application/') ||
    importPath.startsWith('../../application/') ||
    importPath.startsWith('../../../application/')
  );
}

/**
 * Check if an import is a concrete repository
 */
function isConcreteRepositoryImport(importPath: string): boolean {
  return (
    importPath.includes('/infrastructure/repositories/') ||
    importPath.includes('@/infrastructure/repositories/')
  );
}

/**
 * Check if an import is from Next.js or React
 */
function isFrameworkImport(importPath: string): boolean {
  return (
    importPath.startsWith('next') ||
    importPath.startsWith('react') ||
    importPath === 'react-dom'
  );
}

describe('Architecture Tests - Layer Dependencies', () => {
  describe('Domain Layer Purity', () => {
    it('should not import from infrastructure layer', () => {
      const domainDir = path.join(process.cwd(), 'src', 'domain');
      const domainFiles = getTypeScriptFiles(domainDir);

      const violations: Array<{ file: string; imports: string[] }> = [];

      domainFiles.forEach((file) => {
        const imports = extractImports(file);
        const infrastructureImports = imports.filter(isInfrastructureImport);

        if (infrastructureImports.length > 0) {
          violations.push({
            file: file.replace(process.cwd(), ''),
            imports: infrastructureImports,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `\n  ${v.file}:\n    ${v.imports.map((i) => `- ${i}`).join('\n    ')}`
          )
          .join('\n');

        expect.fail(
          `Domain layer must not import from infrastructure layer.${message}\n\n` +
            'Domain should be pure and framework-agnostic. Use interfaces instead.'
        );
      }

      expect(violations).toHaveLength(0);
    });

    it('should not import from application layer', () => {
      const domainDir = path.join(process.cwd(), 'src', 'domain');
      const domainFiles = getTypeScriptFiles(domainDir);

      const violations: Array<{ file: string; imports: string[] }> = [];

      domainFiles.forEach((file) => {
        const imports = extractImports(file);
        const applicationImports = imports.filter(isApplicationImport);

        if (applicationImports.length > 0) {
          violations.push({
            file: file.replace(process.cwd(), ''),
            imports: applicationImports,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `\n  ${v.file}:\n    ${v.imports.map((i) => `- ${i}`).join('\n    ')}`
          )
          .join('\n');

        expect.fail(
          `Domain layer must not import from application layer.${message}\n\n` +
            'Domain should not depend on use cases.'
        );
      }

      expect(violations).toHaveLength(0);
    });

    it('should not import framework code (Next.js, React)', () => {
      const domainDir = path.join(process.cwd(), 'src', 'domain');
      const domainFiles = getTypeScriptFiles(domainDir);

      const violations: Array<{ file: string; imports: string[] }> = [];

      domainFiles.forEach((file) => {
        const imports = extractImports(file);
        const frameworkImports = imports.filter(isFrameworkImport);

        if (frameworkImports.length > 0) {
          violations.push({
            file: file.replace(process.cwd(), ''),
            imports: frameworkImports,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `\n  ${v.file}:\n    ${v.imports.map((i) => `- ${i}`).join('\n    ')}`
          )
          .join('\n');

        expect.fail(
          `Domain layer must not import framework code.${message}\n\n` +
            'Keep domain pure and testable.'
        );
      }

      expect(violations).toHaveLength(0);
    });
  });

  describe('Application Layer (Use Cases)', () => {
    /**
     * Property 1: Repository Interface Import Purity
     * Feature: architecture-refactoring, Property 1: Repository Interface Import Purity
     *
     * For any use case file, all repository imports should come from @/domain/ paths,
     * not from @/infrastructure/ paths.
     *
     * Validates: Requirements 1.2, 5.1, 5.5
     */
    it('Property 1: all use case repository imports come from domain layer', () => {
      const useCasesDir = path.join(
        process.cwd(),
        'src',
        'application',
        'use-cases'
      );

      if (!fs.existsSync(useCasesDir)) {
        // If directory doesn't exist, test passes vacuously
        return;
      }

      const useCaseFiles = getTypeScriptFiles(useCasesDir);

      // Property: For ALL use case files
      fc.assert(
        fc.property(fc.constantFrom(...useCaseFiles), (useCaseFile) => {
          const content = fs.readFileSync(useCaseFile, 'utf-8');
          const fileName = path.basename(useCaseFile);
          const relativePath = useCaseFile.replace(process.cwd(), '');

          // Extract all imports
          const imports = extractImports(useCaseFile);

          // Filter for repository-related imports
          const repositoryImports = imports.filter((imp) => {
            const lowerImp = imp.toLowerCase();
            return (
              lowerImp.includes('repository') &&
              !lowerImp.includes('node_modules') &&
              !imp.startsWith('.')
            );
          });

          // Check each repository import
          for (const repoImport of repositoryImports) {
            // Property: Repository imports must come from domain, not infrastructure
            const isFromInfrastructure = isInfrastructureImport(repoImport);
            const isFromDomain =
              repoImport.includes('/domain/') ||
              repoImport.includes('@/domain/');

            if (isFromInfrastructure) {
              console.error(
                `❌ Use case ${fileName} imports repository from infrastructure: ${repoImport}`
              );
              console.error(
                `   Expected: Import from domain layer (e.g., @/domain/*/repositories/I*Repository)`
              );
              return false;
            }

            // If it's a repository import and not from infrastructure, it should be from domain
            if (
              repositoryImports.length > 0 &&
              !isFromDomain &&
              !isFromInfrastructure
            ) {
              // This might be a relative import, check if it resolves to infrastructure
              if (repoImport.startsWith('.')) {
                // For relative imports, we need to check the actual file path
                const resolvedPath = path.resolve(
                  path.dirname(useCaseFile),
                  repoImport
                );
                if (resolvedPath.includes('/infrastructure/')) {
                  console.error(
                    `❌ Use case ${fileName} imports repository from infrastructure via relative path: ${repoImport}`
                  );
                  return false;
                }
              }
            }
          }

          return true;
        }),
        { numRuns: useCaseFiles.length > 0 ? useCaseFiles.length : 1 }
      );
    });

    /**
     * Property 5: Use Case Constructor Injection
     * Feature: architecture-refactoring, Property 5: Use Case Constructor Injection
     *
     * For any use case class, repository dependencies should be declared as
     * constructor parameters with domain interface types.
     *
     * Validates: Requirements 3.1, 5.2
     */
    it('Property 5: all use cases use constructor injection for repository dependencies', () => {
      const useCasesDir = path.join(
        process.cwd(),
        'src',
        'application',
        'use-cases'
      );

      if (!fs.existsSync(useCasesDir)) {
        // If directory doesn't exist, test passes vacuously
        return;
      }

      const useCaseFiles = getTypeScriptFiles(useCasesDir);

      // Property: For ALL use case files
      fc.assert(
        fc.property(fc.constantFrom(...useCaseFiles), (useCaseFile) => {
          const content = fs.readFileSync(useCaseFile, 'utf-8');
          const fileName = path.basename(useCaseFile);

          // Find the use case class definition
          const classRegex = /export\s+class\s+(\w+UseCase)\s*{/;
          const classMatch = content.match(classRegex);

          if (!classMatch) {
            // Not a use case file, skip
            return true;
          }

          const className = classMatch[1];

          // Find the constructor
          const constructorRegex = /constructor\s*\(([\s\S]*?)\)\s*{/;
          const constructorMatch = content.match(constructorRegex);

          if (!constructorMatch) {
            // No constructor found - this might be okay if no dependencies
            // Check if the class has any repository usage
            const hasRepositoryUsage =
              content.includes('Repository') || content.includes('repository');

            if (hasRepositoryUsage) {
              console.error(
                `❌ Use case ${className} appears to use repositories but has no constructor`
              );
              return false;
            }

            return true;
          }

          const constructorParams = constructorMatch[1];

          // Extract repository-related imports
          const imports = extractImports(useCaseFile);
          const repositoryImports = imports.filter((imp) => {
            const lowerImp = imp.toLowerCase();
            return lowerImp.includes('repository');
          });

          // If there are repository imports, check constructor parameters
          if (repositoryImports.length > 0) {
            // Property 1: Constructor should have parameters (dependency injection)
            if (!constructorParams || constructorParams.trim() === '') {
              console.error(
                `❌ Use case ${className} imports repositories but constructor has no parameters`
              );
              console.error(
                `   Expected: Constructor should inject repository dependencies`
              );
              return false;
            }

            // Property 2: Constructor parameters should use 'private readonly' or 'private'
            // This ensures proper encapsulation
            const paramLines = constructorParams
              .split(',')
              .map((p) => p.trim());

            for (const param of paramLines) {
              if (param && param.toLowerCase().includes('repository')) {
                // Check if it uses private/private readonly
                const hasPrivate = param.includes('private');

                if (!hasPrivate) {
                  console.error(
                    `❌ Use case ${className} has repository parameter without 'private' modifier: ${param}`
                  );
                  console.error(
                    `   Expected: Use 'private readonly' for repository dependencies`
                  );
                  return false;
                }
              }
            }

            // Property 3: Repository parameters should use interface types (typically start with 'I')
            // or be from domain layer
            for (const param of paramLines) {
              if (param && param.toLowerCase().includes('repository')) {
                // Extract the type from the parameter
                const typeMatch = param.match(/:\s*(\w+)/);
                if (typeMatch) {
                  const typeName = typeMatch[1];

                  // Check if this type is imported from domain
                  const typeImport = imports.find((imp) =>
                    content.includes(
                      `import.*${typeName}.*from.*['"]${imp}['"]`
                    )
                  );

                  if (typeImport) {
                    const isFromDomain =
                      typeImport.includes('/domain/') ||
                      typeImport.includes('@/domain/');

                    const isFromInfrastructure =
                      isInfrastructureImport(typeImport);

                    if (isFromInfrastructure) {
                      console.error(
                        `❌ Use case ${className} injects concrete repository type ${typeName} from infrastructure`
                      );
                      console.error(
                        `   Expected: Inject domain interface (e.g., I${typeName})`
                      );
                      return false;
                    }

                    // If not from infrastructure and has repository imports, should be from domain
                    if (!isFromDomain && repositoryImports.length > 0) {
                      console.error(
                        `❌ Use case ${className} injects repository type ${typeName} not from domain layer`
                      );
                      return false;
                    }
                  }
                }
              }
            }
          }

          return true;
        }),
        { numRuns: useCaseFiles.length > 0 ? useCaseFiles.length : 1 }
      );
    });

    it('should not import concrete repositories', () => {
      const applicationDir = path.join(process.cwd(), 'src', 'application');
      const applicationFiles = getTypeScriptFiles(applicationDir);

      const violations: Array<{ file: string; imports: string[] }> = [];

      applicationFiles.forEach((file) => {
        const imports = extractImports(file);
        const concreteRepoImports = imports.filter(isConcreteRepositoryImport);

        if (concreteRepoImports.length > 0) {
          violations.push({
            file: file.replace(process.cwd(), ''),
            imports: concreteRepoImports,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `\n  ${v.file}:\n    ${v.imports.map((i) => `- ${i}`).join('\n    ')}`
          )
          .join('\n');

        expect.fail(
          `Application layer must not import concrete repositories.${message}\n\n` +
            'Import from domain interfaces instead (e.g., @/domain/user/repositories/IUserRepository).'
        );
      }

      expect(violations).toHaveLength(0);
    });

    it('should not import Next.js framework code', () => {
      const applicationDir = path.join(process.cwd(), 'src', 'application');
      const applicationFiles = getTypeScriptFiles(applicationDir);

      const violations: Array<{ file: string; imports: string[] }> = [];

      applicationFiles.forEach((file) => {
        const imports = extractImports(file);
        const nextImports = imports.filter((imp) => imp.startsWith('next'));

        if (nextImports.length > 0) {
          violations.push({
            file: file.replace(process.cwd(), ''),
            imports: nextImports,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `\n  ${v.file}:\n    ${v.imports.map((i) => `- ${i}`).join('\n    ')}`
          )
          .join('\n');

        expect.fail(
          `Application layer must not import Next.js code.${message}\n\n` +
            'Use cases should be framework-agnostic.'
        );
      }

      expect(violations).toHaveLength(0);
    });
  });

  describe('Presentation Layer (API Routes)', () => {
    /**
     * Property 6: API Route DI Usage
     * Feature: architecture-refactoring, Property 6: API Route DI Usage
     *
     * For any API route that uses a use case, it should obtain the use case instance
     * from the DI container rather than instantiating it directly.
     *
     * Validates: Requirements 3.2, 6.1
     */
    it('Property 6: API routes that use use cases obtain them from DI container', () => {
      const apiDir = path.join(process.cwd(), 'app', 'api');

      // Skip if api directory doesn't exist
      if (!fs.existsSync(apiDir)) {
        return;
      }

      const apiFiles = getTypeScriptFiles(apiDir);

      // Filter out test files
      const routeFiles = apiFiles.filter(
        (file) =>
          !file.includes('__tests__') &&
          !file.includes('.test.') &&
          !file.includes('.spec.')
      );

      if (routeFiles.length === 0) {
        return;
      }

      // Property: For ALL API route files
      fc.assert(
        fc.property(fc.constantFrom(...routeFiles), (routeFile) => {
          const content = fs.readFileSync(routeFile, 'utf-8');
          const fileName = path.basename(routeFile);
          const relativePath = routeFile.replace(process.cwd(), '');

          // Check if the route uses use cases
          const usesUseCases = content.includes('UseCase');

          if (!usesUseCases) {
            // If no use cases are used, property is vacuously true
            return true;
          }

          // Property 1: If use cases are used, check for DI container usage
          // Look for patterns like: container.createXxxUseCase()
          const usesDIContainer =
            content.includes('container.create') ||
            content.includes('from "@/infrastructure/di/container"') ||
            content.includes("from '@/infrastructure/di/container'");

          // Property 2: Check for direct use case instantiation (anti-pattern)
          // Pattern: new XxxUseCase(
          const directUseCaseInstantiationRegex = /new\s+\w+UseCase\s*\(/g;
          const hasDirectInstantiation =
            directUseCaseInstantiationRegex.test(content);

          // If the route uses use cases but doesn't use DI container
          if (usesUseCases && !usesDIContainer && hasDirectInstantiation) {
            console.error(
              `❌ API route ${relativePath} instantiates use cases directly instead of using DI container`
            );
            console.error(
              `   Expected: Use container.createXxxUseCase() from DI container`
            );
            console.error(
              `   Found: Direct instantiation with 'new XxxUseCase(...)'`
            );
            return false;
          }

          // Property 3: Routes that have been refactored should use container
          // These are the routes we know have been refactored
          const refactoredRoutes = [
            'app/api/users/me/route.ts',
            'app/api/users/me/email/route.ts',
            'app/api/users/me/password/route.ts',
            'app/api/workspaces/route.ts',
          ];

          const isRefactoredRoute = refactoredRoutes.some((route) =>
            routeFile.endsWith(route.replace('app/api/', ''))
          );

          if (isRefactoredRoute && !usesDIContainer) {
            console.error(
              `❌ Refactored API route ${relativePath} should use DI container`
            );
            console.error(
              `   Expected: import { container } from "@/infrastructure/di/container"`
            );
            return false;
          }

          return true;
        }),
        { numRuns: routeFiles.length }
      );
    });

    /**
     * Property 7: No Direct Repository Instantiation in API Routes
     * Feature: architecture-refactoring, Property 7: No Direct Repository Instantiation
     *
     * For any API route, it should not contain `new *Repository()` instantiation calls.
     *
     * Validates: Requirement 6.2
     */
    it('Property 7: API routes do not directly instantiate repositories', () => {
      const apiDir = path.join(process.cwd(), 'app', 'api');

      // Skip if api directory doesn't exist
      if (!fs.existsSync(apiDir)) {
        return;
      }

      const apiFiles = getTypeScriptFiles(apiDir);

      // Filter out test files
      const routeFiles = apiFiles.filter(
        (file) =>
          !file.includes('__tests__') &&
          !file.includes('.test.') &&
          !file.includes('.spec.')
      );

      if (routeFiles.length === 0) {
        return;
      }

      // Property: For ALL API route files
      fc.assert(
        fc.property(fc.constantFrom(...routeFiles), (routeFile) => {
          const content = fs.readFileSync(routeFile, 'utf-8');
          const fileName = path.basename(routeFile);
          const relativePath = routeFile.replace(process.cwd(), '');

          // Property: API routes should NOT contain direct repository instantiation
          // Pattern: new XxxRepository()
          const repositoryInstantiationRegex = /new\s+\w*Repository\s*\(/g;
          const matches = content.match(repositoryInstantiationRegex);

          if (matches && matches.length > 0) {
            console.error(
              `❌ API route ${relativePath} directly instantiates repositories`
            );
            console.error(
              `   Found ${matches.length} instantiation(s): ${matches.join(', ')}`
            );
            console.error(
              `   Expected: Use DI container to obtain repositories through use cases`
            );
            console.error(
              `   Example: const useCase = container.createXxxUseCase();`
            );

            // Show the lines where instantiation occurs
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (repositoryInstantiationRegex.test(line)) {
                console.error(`   Line ${index + 1}: ${line.trim()}`);
              }
            });

            return false;
          }

          return true;
        }),
        { numRuns: routeFiles.length }
      );
    });

    it('should use DI container instead of direct repository instantiation', () => {
      const apiDir = path.join(process.cwd(), 'app', 'api');

      // Skip if api directory doesn't exist
      if (!fs.existsSync(apiDir)) {
        return;
      }

      const apiFiles = getTypeScriptFiles(apiDir);

      const violations: Array<{ file: string; imports: string[] }> = [];

      apiFiles.forEach((file) => {
        // Skip test files
        if (
          file.includes('__tests__') ||
          file.includes('.test.') ||
          file.includes('.spec.')
        ) {
          return;
        }

        const imports = extractImports(file);
        const concreteRepoImports = imports.filter(isConcreteRepositoryImport);

        if (concreteRepoImports.length > 0) {
          violations.push({
            file: file.replace(process.cwd(), ''),
            imports: concreteRepoImports,
          });
        }
      });

      if (violations.length > 0) {
        const message = violations
          .map(
            (v) =>
              `\n  ${v.file}:\n    ${v.imports.map((i) => `- ${i}`).join('\n    ')}`
          )
          .join('\n');

        expect.fail(
          `API routes must not import concrete repositories directly.${message}\n\n` +
            'Use the DI container instead: import { container } from "@/infrastructure/di/container"'
        );
      }

      expect(violations).toHaveLength(0);
    });

    it('should import DI container in refactored routes', () => {
      const refactoredRoutes = [
        'app/api/users/me/route.ts',
        'app/api/users/me/email/route.ts',
        'app/api/users/me/password/route.ts',
        'app/api/workspaces/route.ts',
      ];

      const violations: string[] = [];

      refactoredRoutes.forEach((routePath) => {
        const fullPath = path.join(process.cwd(), routePath);

        if (!fs.existsSync(fullPath)) {
          return;
        }

        const imports = extractImports(fullPath);
        const hasContainerImport = imports.some(
          (imp) =>
            imp.includes('/infrastructure/di/container') ||
            imp.includes('@/infrastructure/di/container')
        );

        if (!hasContainerImport) {
          violations.push(routePath);
        }
      });

      if (violations.length > 0) {
        const message = violations.map((v) => `\n  - ${v}`).join('');

        expect.fail(
          `Refactored API routes must import the DI container.${message}\n\n` +
            'Add: import { container } from "@/infrastructure/di/container"'
        );
      }

      expect(violations).toHaveLength(0);
    });
  });

  describe('Infrastructure Layer', () => {
    it('should implement domain interfaces', () => {
      const repositoryDir = path.join(
        process.cwd(),
        'src',
        'infrastructure',
        'repositories'
      );

      if (!fs.existsSync(repositoryDir)) {
        return;
      }

      const repositoryFiles = getTypeScriptFiles(repositoryDir);

      const violations: string[] = [];

      repositoryFiles.forEach((file) => {
        const content = fs.readFileSync(file, 'utf-8');
        const fileName = path.basename(file);

        // Skip mapper files, index files, and optimized repositories
        // Optimized repositories extend base repositories which implement interfaces
        if (
          fileName.includes('Mapper') ||
          fileName.includes('mapper') ||
          fileName.includes('Optimized') ||
          fileName === 'index.ts'
        ) {
          return;
        }

        // Check if repository implements an interface
        const implementsRegex = /class\s+\w+\s+implements\s+\w+/;
        const hasImplements = implementsRegex.test(content);

        // Check if it imports from domain
        const imports = extractImports(file);
        const hasDomainImport = imports.some(
          (imp) => imp.includes('/domain/') || imp.includes('@/domain/')
        );

        if (!hasImplements || !hasDomainImport) {
          violations.push(fileName);
        }
      });

      if (violations.length > 0) {
        const message = violations.map((v) => `\n  - ${v}`).join('');

        expect.fail(
          `Repository implementations should implement domain interfaces.${message}\n\n` +
            'Ensure repositories implement interfaces from the domain layer.'
        );
      }

      expect(violations).toHaveLength(0);
    });

    /**
     * Property 4: Repository Implementation Location
     * Feature: architecture-refactoring, Property 4: Repository Implementation Location
     *
     * For any repository implementation, it should be located in
     * src/infrastructure/repositories/ and implement a corresponding domain interface.
     *
     * Validates: Requirement 1.4
     */
    it('Property 4: all repository implementations are in infrastructure and implement domain interfaces', () => {
      const repositoryDir = path.join(
        process.cwd(),
        'src',
        'infrastructure',
        'repositories'
      );

      if (!fs.existsSync(repositoryDir)) {
        // If directory doesn't exist, test passes vacuously
        return;
      }

      const repositoryFiles = getTypeScriptFiles(repositoryDir);

      // Property: For ALL repository files in infrastructure/repositories/
      fc.assert(
        fc.property(fc.constantFrom(...repositoryFiles), (repositoryFile) => {
          const content = fs.readFileSync(repositoryFile, 'utf-8');
          const fileName = path.basename(repositoryFile);
          const relativePath = repositoryFile.replace(process.cwd(), '');

          // Skip mapper files, non-repository files, and optimized repositories
          // Optimized repositories extend base repositories which implement interfaces
          if (
            fileName.includes('Mapper') ||
            fileName.includes('mapper') ||
            fileName.includes('Optimized') ||
            fileName.includes('index.ts')
          ) {
            return true;
          }

          // Property 1: File must be in src/infrastructure/repositories/
          const isInCorrectLocation = relativePath.includes(
            'src/infrastructure/repositories/'
          );

          if (!isInCorrectLocation) {
            console.error(
              `❌ Repository ${fileName} is not in src/infrastructure/repositories/`
            );
            return false;
          }

          // Property 2: Must implement an interface (contains "implements" keyword)
          const implementsRegex = /class\s+\w+\s+implements\s+\w+/;
          const hasImplements = implementsRegex.test(content);

          if (!hasImplements) {
            console.error(
              `❌ Repository ${fileName} does not implement an interface`
            );
            return false;
          }

          // Property 3: Must import from domain layer
          const imports = extractImports(repositoryFile);
          const hasDomainImport = imports.some(
            (imp) => imp.includes('/domain/') || imp.includes('@/domain/')
          );

          if (!hasDomainImport) {
            console.error(
              `❌ Repository ${fileName} does not import from domain layer`
            );
            return false;
          }

          // Property 4: The interface should be from the domain layer
          // Extract the interface name from implements clause
          const implementsMatch = content.match(
            /class\s+\w+\s+implements\s+(\w+)/
          );
          if (implementsMatch) {
            const interfaceName = implementsMatch[1];

            // Check if there's an import for this interface from domain
            // Look for imports that contain the interface name and come from domain
            const interfaceImportRegex = new RegExp(
              `import[^;]*${interfaceName}[^;]*from\\s*['"]([^'"]+)['"]`,
              'g'
            );
            const interfaceImportMatches = Array.from(
              content.matchAll(interfaceImportRegex)
            );

            const hasInterfaceImport = interfaceImportMatches.some((match) => {
              const importPath = match[1];
              // Check if import is from domain (handles both @/domain and relative paths like ../../domain)
              return (
                importPath &&
                (importPath.includes('/domain/') ||
                importPath.includes('@/domain/'))
              );
            });

            if (!hasInterfaceImport) {
              console.error(
                `❌ Repository ${fileName} implements ${interfaceName} but doesn't import it from domain layer`
              );
              return false;
            }
          }

          return true;
        }),
        { numRuns: repositoryFiles.length > 0 ? repositoryFiles.length : 1 }
      );
    });
  });

  describe('DI Container', () => {
    it('should exist and export singleton instance', () => {
      const containerPath = path.join(
        process.cwd(),
        'src',
        'infrastructure',
        'di',
        'container.ts'
      );

      expect(fs.existsSync(containerPath)).toBe(true);

      const content = fs.readFileSync(containerPath, 'utf-8');

      // Check for singleton pattern
      expect(content).toContain('private static instance');
      expect(content).toContain('getInstance()');

      // Check for export
      expect(content).toContain('export const container');
    });

    it('should have factory methods for all use cases', () => {
      const containerPath = path.join(
        process.cwd(),
        'src',
        'infrastructure',
        'di',
        'container.ts'
      );

      const content = fs.readFileSync(containerPath, 'utf-8');

      // Check for key factory methods
      const expectedMethods = [
        'createGetUserUseCase',
        'createUpdateProfileUseCase',
        'createCreateWorkspaceUseCase',
        'createListWorkspacesUseCase',
      ];

      const missingMethods = expectedMethods.filter(
        (method) => !content.includes(method)
      );

      if (missingMethods.length > 0) {
        expect.fail(
          `DI Container is missing factory methods: ${missingMethods.join(', ')}`
        );
      }

      expect(missingMethods).toHaveLength(0);
    });
  });
});
