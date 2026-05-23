#!/usr/bin/env node

/**
 * Route integrity audit for frontend routing files.
 *
 * Goals:
 * - Detect unresolved local imports used by route definitions.
 * - Detect duplicate route paths across route modules.
 *
 * Notes:
 * - This script is static and intentionally conservative.
 * - It only resolves relative, absolute (project-root), and "@/" imports.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const routesDir = path.join(rootDir, "src", "routes");
const outputDir = path.join(rootDir, "scripts", "audit", "results");
const outputFile = path.join(outputDir, "routes-audit.json");

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const strictDuplicatePaths = String(process.env.STRICT_DUPLICATE_ROUTES || "")
  .toLowerCase()
  .trim() === "true";

function toPosix(filePath) {
  return filePath.replaceAll("\\", "/");
}

function relativeFromRoot(filePath) {
  return toPosix(path.relative(rootDir, filePath));
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!CODE_EXTENSIONS.includes(path.extname(entry.name))) continue;
    files.push(path.normalize(fullPath));
  }

  return files;
}

function extractImportSpecifiers(source) {
  const imports = new Set();
  const patterns = [
    /import\s+(?:[\s\S]*?)from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /export\s+(?:[\s\S]*?)from\s+['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const specifier = match[1]?.trim();
      if (specifier) imports.add(specifier);
    }
  }

  return [...imports];
}

function extractPaths(source) {
  const results = [];
  const pathPattern = /path\s*:\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = pathPattern.exec(source)) !== null) {
    const routePath = match[1]?.trim();
    if (routePath) results.push(routePath);
  }
  return results;
}

function groupDuplicatePaths(routePathOwners) {
  const duplicates = [...routePathOwners.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([routePath, owners]) => ({
      path: routePath,
      files: [...new Set(owners)].sort(),
      occurrences: owners.length,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const absoluteDuplicates = duplicates.filter((entry) =>
    entry.path.startsWith("/"),
  );
  const relativeDuplicates = duplicates.filter(
    (entry) => !entry.path.startsWith("/"),
  );

  return { absoluteDuplicates, relativeDuplicates };
}

function resolveWithExtensions(baseTarget) {
  const candidates = [
    baseTarget,
    ...CODE_EXTENSIONS.map((ext) => `${baseTarget}${ext}`),
    ...CODE_EXTENSIONS.map((ext) => path.join(baseTarget, `index${ext}`)),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }
  return null;
}

function resolveImport(importerFile, specifier) {
  if (!specifier) return null;

  if (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.startsWith("@/")
  ) {
    return { type: "external", resolved: null };
  }

  let targetBase;
  if (specifier.startsWith("@/")) {
    targetBase = path.join(rootDir, "src", specifier.slice(2));
  } else if (specifier.startsWith("/")) {
    targetBase = path.join(rootDir, specifier.slice(1));
  } else {
    targetBase = path.resolve(path.dirname(importerFile), specifier);
  }

  const resolved = resolveWithExtensions(targetBase);
  return { type: "local", resolved };
}

function auditRoutes() {
  if (!fs.existsSync(routesDir)) {
    throw new Error(`Routes directory does not exist: ${routesDir}`);
  }

  const routeFiles = walk(routesDir);
  const unresolvedImports = [];
  const routePathOwners = new Map();

  for (const filePath of routeFiles) {
    const source = readFileSafe(filePath);

    // Import resolution
    for (const specifier of extractImportSpecifiers(source)) {
      const result = resolveImport(filePath, specifier);
      if (result.type === "local" && !result.resolved) {
        unresolvedImports.push({
          file: relativeFromRoot(filePath),
          specifier,
        });
      }
    }

    // Route path collisions
    for (const routePath of extractPaths(source)) {
      const owners = routePathOwners.get(routePath) ?? [];
      owners.push(relativeFromRoot(filePath));
      routePathOwners.set(routePath, owners);
    }
  }

  const { absoluteDuplicates, relativeDuplicates } =
    groupDuplicatePaths(routePathOwners);

  const hasUnresolved = unresolvedImports.length > 0;
  const hasBlockingDuplicates =
    strictDuplicatePaths && absoluteDuplicates.length > 0;
  const ok = !hasUnresolved && !hasBlockingDuplicates;

  return {
    generatedAt: new Date().toISOString(),
    strictDuplicatePaths,
    summary: {
      routeFiles: routeFiles.length,
      unresolvedImports: unresolvedImports.length,
      absoluteDuplicatePaths: absoluteDuplicates.length,
      relativeDuplicatePaths: relativeDuplicates.length,
      ok,
    },
    unresolvedImports,
    absoluteDuplicatePaths: absoluteDuplicates,
    relativeDuplicatePaths: relativeDuplicates,
  };
}

function main() {
  const report = auditRoutes();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), "utf8");

  console.log("Route audit completed.");
  console.log(`Report: ${relativeFromRoot(outputFile)}`);
  console.log(
    `Summary: files=${report.summary.routeFiles}, unresolved=${report.summary.unresolvedImports}, absDup=${report.summary.absoluteDuplicatePaths}, relDup=${report.summary.relativeDuplicatePaths}, strictDuplicate=${report.strictDuplicatePaths}`,
  );

  if (report.summary.unresolvedImports > 0) {
    console.error("Unresolved local imports were found in route files.");
  }
  if (report.strictDuplicatePaths && report.summary.absoluteDuplicatePaths > 0) {
    console.error(
      "Duplicate route paths were found while STRICT_DUPLICATE_ROUTES=true.",
    );
  }

  if (!report.summary.ok) {
    process.exit(1);
  }
}

main();
