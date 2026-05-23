#!/usr/bin/env node
/**
 * i18n key audit utility
 *
 * Purpose:
 * - Prevent runtime "Translation missing for: ..." warnings by failing fast in CI/dev checks.
 * - Compare keys used in source files against keys available in locale resource files.
 *
 * Example:
 * node scripts/i18n/audit-translation-keys.cjs \
 *   --prefix reports.finance \
 *   --source src/pages/reports/finance \
 *   --source src/components/common/PageTitleManager.tsx \
 *   --source src/hooks/useBreadcrumbs.ts \
 *   --locale src/i18n/locales/en/reports.ts \
 *   --locale src/i18n/locales/ar/reports.ts
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function parseArgs(argv) {
  const args = {
    prefix: "",
    sources: [],
    locales: [],
  };

  for (let i = 2; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === "--prefix") {
      args.prefix = argv[++i] || "";
      continue;
    }
    if (current === "--source") {
      args.sources.push(argv[++i] || "");
      continue;
    }
    if (current === "--locale") {
      args.locales.push(argv[++i] || "");
      continue;
    }
  }

  return args;
}

function toCamelCase(segment) {
  return segment.replace(/-([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

function normalizeKey(rawKey) {
  const parts = rawKey.split(".");
  return parts.map(toCamelCase).join(".");
}

function isValidLeafKey(key, prefix) {
  // Reject malformed keys from template literals like "reports.payroll.months."
  if (key.endsWith(".") || key.includes("..")) return false;
  // Require at least two levels under prefix, e.g. reports.payroll.overview.title
  return key.split(".").length >= prefix.split(".").length + 2;
}

function walkFiles(entryPath, collected = []) {
  const stats = fs.statSync(entryPath);
  if (stats.isFile()) {
    collected.push(entryPath);
    return collected;
  }

  const children = fs.readdirSync(entryPath);
  for (const child of children) {
    walkFiles(path.join(entryPath, child), collected);
  }

  return collected;
}

function collectUsedKeys(prefix, sourcePaths) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escapedPrefix}\\.[A-Za-z0-9_.-]+`, "g");
  const used = new Set();

  for (const src of sourcePaths) {
    const abs = path.resolve(src);
    if (!fs.existsSync(abs)) continue;

    const files = walkFiles(abs).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const matches = content.match(re) || [];
      for (const match of matches) {
        const normalized = normalizeKey(match);
        // Keep only leaf-like keys, e.g. reports.finance.dashboard.title
        if (isValidLeafKey(normalized, prefix)) {
          used.add(normalized);
        }
      }
    }
  }

  return used;
}

function parseLocaleObject(localeFile) {
  let source = fs.readFileSync(localeFile, "utf8");
  source = source.replace(/^\uFEFF?/, "").replace(/export default/, "module.exports =");
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(source, sandbox);
  return sandbox.module.exports;
}

function flattenLeafKeys(obj, prefix = "", out = []) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const key of Object.keys(obj)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenLeafKeys(obj[key], next, out);
    }
    return out;
  }
  out.push(prefix);
  return out;
}

function run() {
  const { prefix, sources, locales } = parseArgs(process.argv);

  if (!prefix || sources.length === 0 || locales.length === 0) {
    console.error(
      "Usage: --prefix <namespace> --source <path> [--source <path>...] --locale <file> [--locale <file>...]",
    );
    process.exit(2);
  }

  const used = collectUsedKeys(prefix, sources);
  const missingByLocale = [];

  for (const locale of locales) {
    const localePath = path.resolve(locale);
    if (!fs.existsSync(localePath)) {
      missingByLocale.push({ locale, missing: ["<locale file not found>"] });
      continue;
    }

    const localeObj = parseLocaleObject(localePath);
    const available = new Set(
      flattenLeafKeys(localeObj).map((key) => `reports.${key}`),
    );
    const missing = [...used].filter((key) => !available.has(key)).sort();
    missingByLocale.push({ locale, missing });
  }

  let hasMissing = false;
  for (const item of missingByLocale) {
    console.log(`\n[i18n-audit] ${item.locale}`);
    if (item.missing.length === 0) {
      console.log("  OK: no missing keys");
      continue;
    }
    hasMissing = true;
    for (const key of item.missing) {
      console.log(`  MISSING: ${key}`);
    }
  }

  if (hasMissing) {
    process.exit(1);
  }

  console.log(`\n[i18n-audit] PASS (${prefix})`);
}

run();
