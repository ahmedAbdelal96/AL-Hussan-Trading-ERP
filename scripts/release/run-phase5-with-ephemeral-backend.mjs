#!/usr/bin/env node
/**
 * Runs Phase 5 monitoring smoke against a temporary backend instance.
 * Useful when another stale backend process is already running on port 9000.
 */

import { spawn } from "node:child_process";
import { resolve } from "node:path";

const rootDir = resolve(process.cwd());
const backendDir = resolve(rootDir, "erp-backend-v1");
const backendUrl = "http://localhost:9010";

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForBackendReady(timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${backendUrl}/api/v1/health/live`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.status === 200) {
        return true;
      }
    } catch {
      // keep retrying until timeout
    }
    await wait(1500);
  }
  return false;
}

async function main() {
  const backendProc = spawn("npm run start", {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: "9010",
    },
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  backendProc.stdout.on("data", (chunk) => {
    const text = String(chunk);
    if (text.includes("Application is running on")) {
      process.stdout.write(`[backend] ${text}`);
    }
  });
  backendProc.stderr.on("data", (chunk) => {
    process.stderr.write(`[backend] ${String(chunk)}`);
  });

  try {
    const isReady = await waitForBackendReady();
    if (!isReady) {
      throw new Error("Ephemeral backend did not become ready on :9010.");
    }

    const smokeScriptPath = resolve(
      rootDir,
      "scripts/release/run-phase5-monitoring-smoke.mjs",
    );
    const smokeProc = spawn(
      `"${process.execPath}" "${smokeScriptPath}"`,
      {
        cwd: rootDir,
        env: {
          ...process.env,
          PHASE5_BACKEND_URL: backendUrl,
          PHASE5_SKIP_FRONTEND: "true",
        },
        shell: true,
        stdio: "inherit",
      },
    );

    const smokeCode = await new Promise((resolveCode) => {
      smokeProc.on("close", (code) => resolveCode(code ?? 1));
    });
    process.exitCode = smokeCode;
  } finally {
    if (process.platform === "win32") {
      spawn("taskkill /PID " + backendProc.pid + " /T /F", {
        shell: true,
        stdio: "ignore",
      });
    } else if (!backendProc.killed) {
      backendProc.kill("SIGTERM");
      await wait(1000);
      if (!backendProc.killed) {
        backendProc.kill("SIGKILL");
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
