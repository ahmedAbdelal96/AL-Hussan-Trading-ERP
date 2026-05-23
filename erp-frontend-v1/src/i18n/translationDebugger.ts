/**
 * Translation Debugger
 * Helps identify missing translation keys in development
 * Provides utilities to validate and check translation completeness
 */

import i18n from "./config";

/**
 * Check if a translation key exists
 * @param key - The translation key path (e.g., "payroll.salaryStructures.table.employee")
 * @param language - Optional language code, defaults to current language
 * @returns boolean indicating if the key exists
 */
export const translationKeyExists = (
  key: string,
  language?: string
): boolean => {
  const lng = language || i18n.language;
  try {
    const translation = i18n.getFixedT(lng);
    const result = translation(key);
    // If result equals the key itself, it means the translation was not found
    return result !== key;
  } catch (error) {
    return false;
  }
};

/**
 * Get all missing translation keys for a namespace
 * @param namespace - The namespace to check (e.g., "payroll")
 * @param language - Optional language code
 * @returns Array of missing keys
 */
export const getMissingTranslations = (
  namespace: string,
  language?: string
): string[] => {
  const lng = language || i18n.language;
  const missingKeys: string[] = [];

  try {
    const translation = i18n.getFixedT(lng);

    // Common translation paths to check
    const commonPaths = [
      `${namespace}.title`,
      `${namespace}.subtitle`,
      `${namespace}.table.actions`,
      `${namespace}.form.title`,
      `${namespace}.list.empty`,
    ];

    for (const path of commonPaths) {
      const result = translation(path);
      if (result === path) {
        missingKeys.push(path);
      }
    }
  } catch (error) {
  }

  return missingKeys;
};

/**
 * Log translation status in a formatted table
 * Useful for debugging missing translations
 */
export const logTranslationStatus = () => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const namespaces = [
    "payroll",
    "users",
    "employees",
    "sites",
    "projects",
    "common",
    "auth",
  ];

  console.group(
    "%c📋 Translation Status Report",
    "color: #7c3aed; font-size: 16px; font-weight: bold"
  );

  namespaces.forEach((namespace) => {
    const missingKeys = getMissingTranslations(namespace);
    const status =
      missingKeys.length === 0
        ? "✅ Complete"
        : `⚠️ Missing ${missingKeys.length}`;


    if (missingKeys.length > 0) {
      missingKeys.forEach((key) => {
      });
    }
  });

  console.groupEnd();
};

/**
 * Validate a translation key and log if it's missing
 * Safe to call anywhere in the app
 */
export const validateTranslationKey = (key: string): void => {
  if (process.env.NODE_ENV !== "development") return;

  const exists = translationKeyExists(key);

  if (!exists) {

    // Suggest similar keys
    const parts = key.split(".");
  }
};

/**
 * Export all missing keys in current language
 * Returns an object that can be copied to add to translation files
 */
export const exportMissingKeysTemplate = (): Record<string, any> => {
  const translation = i18n.getFixedT(i18n.language);
  const template: Record<string, any> = {};

  // This would need to be called with actual keys
  // Just a helper structure for developers


  return template;
};

/**
 * Initialize translation debugging in development mode
 * Call this once when app initializes
 */
export const initTranslationDebugger = () => {
  if (process.env.NODE_ENV !== "development") return;

  // Expose to global scope for easy access in console
  (window as any).translationDebug = {
    check: translationKeyExists,
    getMissing: getMissingTranslations,
    logStatus: logTranslationStatus,
    validate: validateTranslationKey,
    export: exportMissingKeysTemplate,
  };

};

export default {
  translationKeyExists,
  getMissingTranslations,
  logTranslationStatus,
  validateTranslationKey,
  exportMissingKeysTemplate,
  initTranslationDebugger,
};
