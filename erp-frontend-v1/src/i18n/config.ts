import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import "./devTools";

type SupportedLanguage = "ar" | "en";

type TranslationTree = Record<string, unknown>;

const languageLoaders: Record<SupportedLanguage, () => Promise<TranslationTree>> = {
  ar: async () => {
    const module = await import("./locales/ar");
    return module.ar as TranslationTree;
  },
  en: async () => {
    const module = await import("./locales/en");
    return module.en as TranslationTree;
  },
};

const loadedLanguages = new Set<SupportedLanguage>();
let lastLanguageRequestId = 0;

const isDev = process.env.NODE_ENV === "development";

function applyDocumentDirection(lang: string) {
  if (typeof document === "undefined") return;

  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", dir);
}

function normalizeLanguage(language: string | undefined): SupportedLanguage {
  if (!language) return "ar";
  const normalized = language.split("-")[0];
  return normalized === "en" ? "en" : "ar";
}

export async function ensureLanguageLoaded(
  language: string,
): Promise<SupportedLanguage> {
  const normalizedLanguage = normalizeLanguage(language);

  if (loadedLanguages.has(normalizedLanguage)) {
    return normalizedLanguage;
  }

  const translationResource = await languageLoaders[normalizedLanguage]();

  i18n.addResourceBundle(
    normalizedLanguage,
    "translation",
    translationResource,
    true,
    true,
  );

  loadedLanguages.add(normalizedLanguage);
  return normalizedLanguage;
}

export async function changeLanguageWithLoad(language: string): Promise<void> {
  const requestId = ++lastLanguageRequestId;

  const normalizedLanguage = await ensureLanguageLoaded(language);

  // Ignore stale async requests if user toggles language rapidly.
  if (requestId !== lastLanguageRequestId) return;

  await i18n.changeLanguage(normalizedLanguage);
}

const initPromise = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {},
    supportedLngs: ["ar", "en"],
    fallbackLng: "ar",
    defaultNS: "translation",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      convertDetectedLanguage: (lng: string) => lng.split("-")[0],
    },
    saveMissing: isDev,
    missingKeyHandler: (lngs, ns, key) => {
      if (isDev) {
        // Keep hook for local debugging without noisy logs.
      }
    },
    debug: isDev,
  });

export const i18nReady = (async () => {
  await initPromise;

  const initialLanguage = normalizeLanguage(
    i18n.resolvedLanguage || i18n.language,
  );

  try {
    await changeLanguageWithLoad(initialLanguage);
  } catch {
    await changeLanguageWithLoad("ar");
  }
})();

i18n.on("initialized", () => applyDocumentDirection(i18n.language));
i18n.on("languageChanged", (lng) => applyDocumentDirection(lng));

if (isDev) {
  i18n.on("initialized", () => {
    // Optional dev-only hook point.
  });

  i18n.on("missingKey", (lng, ns, key) => {
    const paddedKey = String(key).padEnd(50);
    void paddedKey;
  });
}

export default i18n;
