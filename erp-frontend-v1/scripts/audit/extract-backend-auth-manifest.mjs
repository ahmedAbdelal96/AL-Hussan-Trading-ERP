#!/usr/bin/env node

/**
 * Extracts backend authorization metadata from NestJS controllers.
 *
 * Output:
 *   scripts/audit/results/backend-auth-manifest.json
 *
 * Why:
 * - Provides a single auditable reference for frontend route/sidebar alignment.
 * - Prevents auth drift when backend @Auth decorators change.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_ROOT = path.resolve(__dirname, "..", "..");
const REPO_ROOT = path.resolve(FRONTEND_ROOT, "..");
const BACKEND_SRC = path.join(REPO_ROOT, "erp-backend-v1", "src");
const OUTPUT_DIR = path.join(FRONTEND_ROOT, "scripts", "audit", "results");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "backend-auth-manifest.json");

const CONTROLLER_FILE_PATTERN = /controller\.ts$/i;
const HTTP_METHOD_REGEX = /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g;

function walk(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walk(fullPath));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!CONTROLLER_FILE_PATTERN.test(entry.name)) continue;
    if (fullPath.includes(`${path.sep}docs${path.sep}`)) continue;
    result.push(fullPath);
  }
  return result;
}

function toPosix(filePath) {
  return filePath.replaceAll("\\", "/");
}

function relFromRepo(filePath) {
  return toPosix(path.relative(REPO_ROOT, filePath));
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("`") && trimmed.endsWith("`"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseControllerBase(source) {
  const match = source.match(/@Controller\(([^)]*)\)/);
  if (!match) return "";
  const raw = match[1].trim();
  if (!raw) return "";
  return stripQuotes(raw);
}

function parseAuthPayload(payload) {
  if (!payload || payload.trim() === "") {
    return { isAuthOnly: true, roles: [], permissions: [] };
  }

  const rolesMatch = payload.match(/roles\s*:\s*\[([\s\S]*?)\]/);
  const permsMatch = payload.match(/permissions\s*:\s*\[([\s\S]*?)\]/);

  const parseList = (rawList) => {
    if (!rawList) return [];
    return [...rawList.matchAll(/['"`]([^'"`]+)['"`]/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
  };

  return {
    isAuthOnly: false,
    roles: parseList(rolesMatch?.[1]),
    permissions: parseList(permsMatch?.[1]),
  };
}

function parseClassLevelAuth(source) {
  const controllerIdx = source.indexOf("@Controller(");
  const classIdx = source.indexOf("export class ");
  if (controllerIdx < 0 || classIdx < 0 || classIdx <= controllerIdx) {
    return null;
  }
  const between = source.slice(controllerIdx, classIdx);
  const authMatch = between.match(/@Auth\(([\s\S]*?)\)/);
  if (!authMatch) return null;
  return parseAuthPayload(authMatch[1] ?? "");
}

function normalizeSegment(segment) {
  const s = segment.trim().replace(/^\/+|\/+$/g, "");
  return s;
}

function joinRoute(base, child) {
  const b = normalizeSegment(base);
  const c = normalizeSegment(child);
  if (!b && !c) return "/";
  if (!b) return `/${c}`;
  if (!c) return `/${b}`;
  return `/${b}/${c}`;
}

function parseMethods(source, basePath, classAuth, filePath) {
  const methods = [];
  const httpMatches = [...source.matchAll(HTTP_METHOD_REGEX)];

  let searchWindowStart = 0;

  for (const match of httpMatches) {
    const method = match[1];
    const rawPathArg = match[2] ?? "";
    const endpointPath = stripQuotes(rawPathArg || "");
    const httpIndex = match.index ?? 0;

    // Search between previous HTTP decorator and current HTTP decorator.
    // This captures method-level @Auth(...) even when comments are present.
    const decoratorsSegment = source.slice(searchWindowStart, httpIndex);
    const authMatches = [...decoratorsSegment.matchAll(/@Auth\(([\s\S]*?)\)/g)];
    const nearestAuth = authMatches.length
      ? authMatches[authMatches.length - 1]
      : null;

    const methodAuth = nearestAuth
      ? parseAuthPayload(nearestAuth[1] ?? "")
      : null;

    const effectiveAuth = methodAuth ?? classAuth;
    if (!effectiveAuth) {
      searchWindowStart = httpIndex + 1;
      continue; // public/non-@Auth endpoint
    }

    methods.push({
      file: relFromRepo(filePath),
      method,
      route: joinRoute(basePath, endpointPath),
      auth: effectiveAuth,
    });

    searchWindowStart = httpIndex + 1;
  }

  return methods;
}

function buildManifest() {
  if (!fs.existsSync(BACKEND_SRC)) {
    throw new Error(`Backend source not found: ${BACKEND_SRC}`);
  }

  const controllerFiles = walk(BACKEND_SRC);
  const endpoints = [];

  for (const filePath of controllerFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const basePath = parseControllerBase(source);
    if (basePath === "") continue;

    const classAuth = parseClassLevelAuth(source);
    const methodEntries = parseMethods(source, basePath, classAuth, filePath);
    endpoints.push(...methodEntries);
  }

  endpoints.sort((a, b) => {
    if (a.route !== b.route) return a.route.localeCompare(b.route);
    return a.method.localeCompare(b.method);
  });

  const groupedByPrefix = {
    reports: endpoints.filter((e) => e.route.startsWith("/reports/")).length,
    projects: endpoints.filter((e) => e.route.startsWith("/projects")).length,
    employees: endpoints.filter((e) => e.route.startsWith("/employees")).length,
    finance: endpoints.filter((e) => e.route.startsWith("/finance")).length,
    payroll: endpoints.filter((e) => e.route.startsWith("/payroll")).length,
    sites: endpoints.filter((e) => e.route.startsWith("/sites")).length,
    assets: endpoints.filter((e) => e.route.startsWith("/assets")).length,
    maintenance: endpoints.filter((e) =>
      e.route.startsWith("/maintenance"),
    ).length,
    users: endpoints.filter((e) => e.route.startsWith("/users")).length,
    auth: endpoints.filter((e) => e.route.startsWith("/auth")).length,
    rbac: endpoints.filter((e) => e.route.startsWith("/rbac")).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    source: {
      backendSrc: relFromRepo(BACKEND_SRC),
      controllerFiles: controllerFiles.length,
    },
    summary: {
      endpointsWithAuth: endpoints.length,
      groupedByPrefix,
    },
    endpoints,
  };
}

function main() {
  const manifest = buildManifest();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), "utf8");

  console.log("Backend auth manifest generated.");
  console.log(`File: ${toPosix(path.relative(FRONTEND_ROOT, OUTPUT_FILE))}`);
  console.log(`Endpoints with @Auth: ${manifest.summary.endpointsWithAuth}`);
}

main();
