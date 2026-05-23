#!/usr/bin/env node

/**
 * Frontend bundle analyzer (dist-based).
 *
 * Produces a deterministic report for:
 * - Total JS/CSS bytes
 * - Initial JS/CSS bytes referenced by index.html
 * - Largest JS chunks
 *
 * This script intentionally analyzes built assets only and does not run Lighthouse.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(distDir, "assets");
const defaultOutput = path.join(
  rootDir,
  "scripts",
  "perf",
  "results",
  "frontend-current.json",
);

function toPosix(p) {
  return p.replaceAll("\\", "/");
}

function relFromRoot(p) {
  return toPosix(path.relative(rootDir, p));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatKB(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function listAssetFiles() {
  if (!fs.existsSync(assetsDir)) return [];
  return fs
    .readdirSync(assetsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(assetsDir, entry.name));
}

function getFileSize(filePath) {
  return fs.statSync(filePath).size;
}

function extractInitialAssetsFromIndex() {
  const indexHtmlPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error("dist/index.html not found. Run build first.");
  }

  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const scriptSrcPattern = /<script[^>]*src="([^"]+)"[^>]*>/g;
  const modulePreloadPattern = /<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"[^>]*>/g;
  const cssLinkPattern = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;

  const scriptJsRefs = new Set();
  const preloadJsRefs = new Set();
  const cssRefs = new Set();

  let match;
  while ((match = scriptSrcPattern.exec(html)) !== null) {
    scriptJsRefs.add(match[1]);
  }
  while ((match = modulePreloadPattern.exec(html)) !== null) {
    preloadJsRefs.add(match[1]);
  }
  while ((match = cssLinkPattern.exec(html)) !== null) {
    cssRefs.add(match[1]);
  }

  const normalizeRef = (ref) => ref.replace(/^\//, "");
  const entrypointJsFiles = [...scriptJsRefs].map((ref) =>
    path.join(distDir, normalizeRef(ref)),
  );
  const preloadedJsFiles = [...preloadJsRefs].map((ref) =>
    path.join(distDir, normalizeRef(ref)),
  );
  const initialCssFiles = [...cssRefs].map((ref) =>
    path.join(distDir, normalizeRef(ref)),
  );

  return { entrypointJsFiles, preloadedJsFiles, initialCssFiles };
}

function buildReport() {
  if (!fs.existsSync(distDir)) {
    throw new Error("dist folder not found. Run build first.");
  }

  const allAssets = listAssetFiles();
  const jsAssets = allAssets.filter((file) => file.endsWith(".js"));
  const cssAssets = allAssets.filter((file) => file.endsWith(".css"));

  const totalJsBytes = jsAssets.reduce((sum, file) => sum + getFileSize(file), 0);
  const totalCssBytes = cssAssets.reduce((sum, file) => sum + getFileSize(file), 0);

  const { entrypointJsFiles, preloadedJsFiles, initialCssFiles } =
    extractInitialAssetsFromIndex();
  const existingEntrypointJs = entrypointJsFiles.filter((file) =>
    fs.existsSync(file),
  );
  const existingPreloadedJs = preloadedJsFiles.filter((file) =>
    fs.existsSync(file),
  );
  const uniqueInitialJs = [...new Set([...existingEntrypointJs, ...existingPreloadedJs])];
  const existingInitialCss = initialCssFiles.filter((file) => fs.existsSync(file));

  const entrypointJsBytes = existingEntrypointJs.reduce(
    (sum, file) => sum + getFileSize(file),
    0,
  );
  const preloadedJsBytes = existingPreloadedJs.reduce(
    (sum, file) => sum + getFileSize(file),
    0,
  );
  const initialJsBytes = uniqueInitialJs.reduce((sum, file) => sum + getFileSize(file), 0);
  const initialCssBytes = existingInitialCss.reduce(
    (sum, file) => sum + getFileSize(file),
    0,
  );

  const largestJsChunks = jsAssets
    .map((file) => ({
      file: relFromRoot(file),
      bytes: getFileSize(file),
      kb: formatKB(getFileSize(file)),
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      jsAssetsCount: jsAssets.length,
      cssAssetsCount: cssAssets.length,
      totalJsBytes,
      totalJsKB: formatKB(totalJsBytes),
      totalCssBytes,
      totalCssKB: formatKB(totalCssBytes),
      entrypointJsBytes,
      entrypointJsKB: formatKB(entrypointJsBytes),
      preloadedJsBytes,
      preloadedJsKB: formatKB(preloadedJsBytes),
      initialJsBytes,
      initialJsKB: formatKB(initialJsBytes),
      initialCssBytes,
      initialCssKB: formatKB(initialCssBytes),
      largestJsChunkBytes: largestJsChunks[0]?.bytes ?? 0,
      largestJsChunkKB: largestJsChunks[0]?.kb ?? 0,
      largestJsChunkFile: largestJsChunks[0]?.file ?? null,
    },
    initialAssets: {
      entrypointJs: existingEntrypointJs.map(relFromRoot),
      preloadedJs: existingPreloadedJs.map(relFromRoot),
      uniqueInitialJs: uniqueInitialJs.map(relFromRoot),
      css: existingInitialCss.map(relFromRoot),
    },
    largestJsChunks,
  };
}

function main() {
  const outputFile = process.env.FRONTEND_PERF_OUTPUT || defaultOutput;
  const report = buildReport();
  ensureDir(path.dirname(outputFile));
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2), "utf8");

  console.log("Frontend bundle report generated.");
  console.log(`Output: ${relFromRoot(outputFile)}`);
  console.log(
    `Summary: totalJs=${report.summary.totalJsKB}KB, initialJs=${report.summary.initialJsKB}KB, largestChunk=${report.summary.largestJsChunkKB}KB`,
  );
}

main();
