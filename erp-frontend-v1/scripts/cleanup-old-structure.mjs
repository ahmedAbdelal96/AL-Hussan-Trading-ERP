#!/usr/bin/env node

/**
 * Cleanup Old Component Folders Script
 *
 * ⚠️ WARNING: This script DELETES old component folders!
 * Only run this after:
 *   1. Running update-imports.mjs
 *   2. Testing the application thoroughly
 *   3. Verifying all imports work correctly
 *
 * Usage:
 *   node scripts/cleanup-old-structure.mjs
 *
 * Or with dry-run (safer):
 *   node scripts/cleanup-old-structure.mjs --dry-run
 */

import { rmSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const isDryRun = process.argv.includes("--dry-run");

console.log("🗑️  Old Structure Cleanup Script");
console.log("=====================================");
if (isDryRun) {
  console.log("⚠️  DRY RUN MODE - No folders will be deleted\n");
} else {
  console.log("⚠️  DANGER: This will DELETE old folders!\n");
}

// Folders to delete
const foldersToDelete = [
  "src/components/features/employees",
  "src/components/features/payroll",
  "src/components/features/users",
  "src/components/payroll",
  "src/components/finance",
  "src/components/maintenance",
  "src/components/projects",
  "src/components/sites",
  // Empty parent folder
  "src/components/features",
];

// Interactive confirmation (only in live mode)
async function confirm() {
  if (isDryRun) return true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("⚠️  The following folders will be PERMANENTLY DELETED:\n");
    foldersToDelete.forEach((folder) => {
      const fullPath = path.join(rootDir, folder);
      const exists = existsSync(fullPath);
      console.log(
        `   ${exists ? "📁" : "❌"} ${folder} ${exists ? "" : "(not found)"}`,
      );
    });

    console.log("\n❓ Have you:");
    console.log("   ✅ Run update-imports.mjs?");
    console.log("   ✅ Tested the application?");
    console.log("   ✅ Verified all imports work?");
    console.log("   ✅ Committed changes to git?\n");

    rl.question('Type "DELETE" to proceed: ', (answer) => {
      rl.close();
      resolve(answer.trim() === "DELETE");
    });
  });
}

// Main cleanup function
async function cleanup() {
  const confirmed = await confirm();

  if (!confirmed) {
    console.log("\n❌ Cleanup cancelled. No changes made.\n");
    process.exit(0);
  }

  console.log("\n🗑️  Starting cleanup...\n");

  const stats = {
    deleted: 0,
    notFound: 0,
    errors: 0,
  };

  foldersToDelete.forEach((folder) => {
    const fullPath = path.join(rootDir, folder);

    try {
      if (existsSync(fullPath)) {
        if (!isDryRun) {
          rmSync(fullPath, { recursive: true, force: true });
          console.log(`  ✅ Deleted: ${folder}`);
        } else {
          console.log(`  🔍 Would delete: ${folder}`);
        }
        stats.deleted++;
      } else {
        console.log(`  ⏭️  Not found: ${folder}`);
        stats.notFound++;
      }
    } catch (error) {
      console.error(`  ❌ Error deleting ${folder}:`, error.message);
      stats.errors++;
    }
  });

  // Summary
  console.log("\n=====================================");
  console.log("📊 Summary:");
  console.log("=====================================");
  console.log(`Folders deleted:   ${stats.deleted}`);
  console.log(`Folders not found: ${stats.notFound}`);
  console.log(`Errors:            ${stats.errors}\n`);

  if (isDryRun) {
    console.log("⚠️  This was a DRY RUN. No folders were deleted.");
    console.log("   Run without --dry-run to actually delete.\n");
  } else if (stats.errors === 0) {
    console.log("✅ Cleanup completed successfully!");
    console.log("   Your project structure is now organized.\n");
  } else {
    console.log("⚠️  Cleanup completed with errors.");
    console.log("   Please review the error messages above.\n");
  }
}

// Run cleanup
cleanup().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
