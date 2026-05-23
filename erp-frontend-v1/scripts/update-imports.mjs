#!/usr/bin/env node

/**
 * Automated Import Path Update Script
 *
 * This script updates all import statements from the old scattered structure
 * to the new organized features/{module}/components structure.
 *
 * Usage:
 *   node scripts/update-imports.mjs
 *
 * Or with dry-run:
 *   node scripts/update-imports.mjs --dry-run
 */

import { readFileSync, writeFileSync } from "fs";
import { globSync } from "glob";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Check if dry-run mode
const isDryRun = process.argv.includes("--dry-run");

console.log("🔄 Import Path Update Script");
console.log("=====================================");
if (isDryRun) {
  console.log("⚠️  DRY RUN MODE - No files will be modified\n");
} else {
  console.log("⚠️  LIVE MODE - Files will be modified!\n");
}

// Define replacement patterns
const replacements = [
  // Employee components
  {
    from: /@\/components\/features\/employees\//g,
    to: "@/features/employees/components/",
    description: "Employee components",
  },

  // Payroll components (two sources)
  {
    from: /@\/components\/features\/payroll\//g,
    to: "@/features/payroll/components/",
    description: "Payroll components (from features)",
  },
  {
    from: /@\/components\/payroll\//g,
    to: "@/features/payroll/components/",
    description: "Payroll components (from root)",
  },

  // Users components
  {
    from: /@\/components\/features\/users\//g,
    to: "@/features/users/components/",
    description: "Users components",
  },

  // Finance components
  {
    from: /@\/components\/finance\//g,
    to: "@/features/finance/components/",
    description: "Finance components",
  },

  // Maintenance components
  {
    from: /@\/components\/maintenance\//g,
    to: "@/features/maintenance/components/",
    description: "Maintenance components",
  },

  // Projects components
  {
    from: /@\/components\/projects\//g,
    to: "@/features/projects/components/",
    description: "Projects components",
  },

  // Sites components
  {
    from: /@\/components\/sites\//g,
    to: "@/features/sites/components/",
    description: "Sites components",
  },
];

// Find all TypeScript/TSX files
const files = globSync("src/**/*.{ts,tsx}", {
  cwd: rootDir,
  ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  absolute: true,
});

console.log(`📂 Found ${files.length} TypeScript files to process\n`);

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0,
  replacementsByPattern: {},
};

// Initialize stat counters
replacements.forEach((r) => {
  stats.replacementsByPattern[r.description] = 0;
});

// Process each file
files.forEach((filePath) => {
  try {
    const originalContent = readFileSync(filePath, "utf-8");
    let modifiedContent = originalContent;
    let fileHasChanges = false;

    // Apply each replacement pattern
    replacements.forEach(({ from, to, description }) => {
      const matches = modifiedContent.match(from);
      if (matches && matches.length > 0) {
        modifiedContent = modifiedContent.replace(from, to);
        stats.replacementsByPattern[description] += matches.length;
        stats.totalReplacements += matches.length;
        fileHasChanges = true;

        const relativePath = path.relative(rootDir, filePath);
        console.log(`  ✅ ${relativePath}`);
        console.log(
          `     └─ ${matches.length} replacement(s) for ${description}`,
        );
      }
    });

    if (fileHasChanges) {
      stats.filesModified++;

      // Write file if not dry-run
      if (!isDryRun) {
        writeFileSync(filePath, modifiedContent, "utf-8");
      }
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

// Print summary
console.log("\n=====================================");
console.log("📊 Summary:");
console.log("=====================================");
console.log(`Files processed:  ${stats.filesProcessed}`);
console.log(`Files modified:   ${stats.filesModified}`);
console.log(`Total replacements: ${stats.totalReplacements}\n`);

console.log("Replacements by pattern:");
Object.entries(stats.replacementsByPattern).forEach(([pattern, count]) => {
  if (count > 0) {
    console.log(`  • ${pattern}: ${count}`);
  }
});

if (isDryRun) {
  console.log("\n⚠️  This was a DRY RUN. No files were modified.");
  console.log("   Run without --dry-run to apply changes.\n");
} else {
  console.log("\n✅ Import paths have been updated successfully!");
  console.log("   Next steps:");
  console.log("   1. Run: npm run dev");
  console.log("   2. Test all pages");
  console.log("   3. Check DevTools console for errors");
  console.log("   4. If everything works, delete old folders\n");
}

process.exit(0);
