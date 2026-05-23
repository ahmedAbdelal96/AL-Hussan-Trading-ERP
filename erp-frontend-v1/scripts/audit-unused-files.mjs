#!/usr/bin/env node

/**
 * Frontend dead-code audit (import-graph based).
 *
 * Purpose:
 * - Identify code files that are currently unreachable from app entrypoints.
 * - Highlight likely legacy artifacts (copy/new/old/temp naming).
 *
 * Notes:
 * - This is intentionally conservative and only audits TS/JS source files.
 * - It does not auto-delete anything; it only generates a report.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");
const outputDir = path.join(rootDir, "scripts", "audit", "results");
const outputFile = path.join(outputDir, "unused-files-report.json");

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const ENTRY_CANDIDATES = ["main.tsx", "main.ts", "App.tsx", "App.ts"]
  .map((file) => path.join(srcDir, file))
  .filter((file) => fs.existsSync(file));

if (ENTRY_CANDIDATES.length === 0) {
  console.error("No frontend entrypoints found under src/.");
  process.exit(1);
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
    if (entry.name.endsWith(".d.ts")) continue;
    files.push(path.normalize(fullPath));
  }

  return files;
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function extractImports(source) {
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

function tryResolve(withoutExt) {
  const candidates = [
    withoutExt,
    ...CODE_EXTENSIONS.map((ext) => `${withoutExt}${ext}`),
    ...CODE_EXTENSIONS.map((ext) => path.join(withoutExt, `index${ext}`)),
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

  // Ignore external and virtual imports.
  if (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.startsWith("@/")
  ) {
    return null;
  }

  let targetBase;
  if (specifier.startsWith("@/")) {
    targetBase = path.join(srcDir, specifier.slice(2));
  } else if (specifier.startsWith("/")) {
    targetBase = path.join(rootDir, specifier.slice(1));
  } else {
    targetBase = path.resolve(path.dirname(importerFile), specifier);
  }

  return tryResolve(targetBase);
}

function relativeFromRoot(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function analyze() {
  const allCodeFiles = walk(srcDir);
  const codeSet = new Set(allCodeFiles);
  const graph = new Map();

  for (const file of allCodeFiles) {
    const source = readFileSafe(file);
    const imports = extractImports(source);
    const deps = imports
      .map((specifier) => resolveImport(file, specifier))
      .filter((resolved) => resolved && codeSet.has(resolved));
    graph.set(file, [...new Set(deps)]);
  }

  const reachable = new Set();
  const queue = [...ENTRY_CANDIDATES];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    const deps = graph.get(current) ?? [];
    for (const dep of deps) {
      if (!reachable.has(dep)) queue.push(dep);
    }
  }

  const unused = allCodeFiles
    .filter((file) => !reachable.has(file))
    .map(relativeFromRoot)
    .sort();

  const suspiciousTokenPattern =
    /(?:^|[-_.])(copy|old|new|backup|temp|legacy)(?:[-_.]|$)/i;
  const suspiciousByName = unused.filter((file) =>
    suspiciousTokenPattern.test(path.basename(file, path.extname(file))),
  );

  const basenameGroups = new Map();
  for (const file of allCodeFiles) {
    const basename = path.basename(file, path.extname(file)).toLowerCase();
    const group = basenameGroups.get(basename) ?? [];
    group.push(relativeFromRoot(file));
    basenameGroups.set(basename, group);
  }
  const duplicateBasenames = [...basenameGroups.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([basename, files]) => ({ basename, files: files.sort() }))
    .sort((a, b) => a.basename.localeCompare(b.basename));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCodeFiles: allCodeFiles.length,
      entrypoints: ENTRY_CANDIDATES.map(relativeFromRoot),
      reachableFiles: reachable.size,
      unreachableFiles: unused.length,
      suspiciousUnreachableFiles: suspiciousByName.length,
      duplicateBasenames: duplicateBasenames.length,
    },
    unreachableFiles: unused,
    suspiciousUnreachableFiles: suspiciousByName,
    duplicateBasenames,
  };
}

function main() {
  const report = analyze();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), "utf8");

  console.log("Frontend unused-files audit completed.");
  console.log(`Report: ${relativeFromRoot(outputFile)}`);
  console.log(
    `Summary: total=${report.summary.totalCodeFiles}, reachable=${report.summary.reachableFiles}, unreachable=${report.summary.unreachableFiles}, suspicious=${report.summary.suspiciousUnreachableFiles}`,
  );
}

main();
