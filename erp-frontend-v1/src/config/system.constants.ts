/**
 * System-wide Constants
 *
 * Central configuration for system-level settings, defaults, and constants
 * used throughout the application.
 */

/**
 * Currency Configuration
 * Default system currency and supported currencies
 */
export const CURRENCY = {
  /**
   * Default system currency (Saudi Riyal)
   * Used as fallback when currency is not specified
   */
  DEFAULT: "SAR" as const,

  /**
   * Currency symbol for display
   * Used in UI components for currency formatting
   */
  SYMBOL: "ر.س" as const,

  /**
   * Supported currencies in the system
   */
  SUPPORTED: {
    SAR: {
      code: "SAR",
      symbol: "ر.س",
      nameAr: "الريال السعودي",
      nameEn: "Saudi Riyal",
    },
  } as const,
} as const;

/**
 * System Locale Configuration
 */
export const LOCALE = {
  /**
   * Default locale for number and date formatting
   */
  DEFAULT_AR: "ar-SA" as const,
  DEFAULT_EN: "en-US" as const,
} as const;

/**
 * Get current locale from language store
 * Reads from localStorage to determine user's language preference
 * @returns Current locale string (ar-SA or en-US)
 */
export function getCurrentLocale(): string {
  if (typeof window === "undefined") return LOCALE.DEFAULT_EN;

  try {
    const stored = localStorage.getItem("language-store");
    if (stored) {
      const parsed = JSON.parse(stored);
      const language = parsed?.state?.language;
      return language === "ar" ? LOCALE.DEFAULT_AR : LOCALE.DEFAULT_EN;
    }
  } catch (error) {
    console.error("Error reading language from localStorage:", error);
  }

  return LOCALE.DEFAULT_EN;
}

/**
 * Helper function to get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  const currency = Object.values(CURRENCY.SUPPORTED).find(
    (curr) => curr.code === code,
  );
  return currency?.symbol || CURRENCY.SYMBOL;
}

/**
 * Helper function to get currency name by code and language
 */
export function getCurrencyName(code: string, language: "ar" | "en"): string {
  const currency = Object.values(CURRENCY.SUPPORTED).find(
    (curr) => curr.code === code,
  );
  if (!currency) {
    return language === "ar"
      ? CURRENCY.SUPPORTED.SAR.nameAr
      : CURRENCY.SUPPORTED.SAR.nameEn;
  }
  return language === "ar" ? currency.nameAr : currency.nameEn;
}
