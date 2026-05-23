/**
 * Development Console Helpers
 * Quick utilities for debugging translation keys in console
 *
 * Usage in browser console:
 * - devTools.checkKey("payroll.salaryStructures.table.employee")
 * - devTools.listMissing("payroll")
 * - devTools.reportStatus()
 * - devTools.exposeGlobals()
 */

import {
  translationKeyExists,
  getMissingTranslations,
  logTranslationStatus,
  validateTranslationKey,
} from "./translationDebugger";

interface DevToolsInterface {
  checkKey: (key: string) => boolean;
  listMissing: (namespace: string) => string[];
  reportStatus: () => void;
  validate: (key: string) => void;
  exposeGlobals: () => void;
}

// Create dev tools object
const devTools: DevToolsInterface = {
  checkKey: (key: string) => {
    const exists = translationKeyExists(key);
    const status = exists ? "✅ EXISTS" : "❌ MISSING";
    return exists;
  },

  listMissing: (namespace: string) => {
    const missing = getMissingTranslations(namespace);
    console.group(
      `%c📍 Missing Keys in "${namespace}"`,
      "color: #f59e0b; font-weight: bold; font-size: 13px"
    );
    if (missing.length === 0) {
    } else {
      missing.forEach((key) => {
      });
    }
    console.groupEnd();
    return missing;
  },

  reportStatus: () => {
    logTranslationStatus();
  },

  validate: (key: string) => {
    validateTranslationKey(key);
  },

  exposeGlobals: () => {
    const globalDevTools = {
      ...devTools,
      // Add more utilities as needed
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    (window as any).devTools = globalDevTools;
    console.table(Object.keys(globalDevTools));
  },
};

// Expose in development mode
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as any).devTools = devTools;

  // Log once on page load
}

export default devTools;
export type { DevToolsInterface };
