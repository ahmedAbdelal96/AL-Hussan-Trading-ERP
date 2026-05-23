import i18n from "./config";
import type { Language } from "@/types";

type TranslationTree = Record<string, any>;

/**
 * Compatibility adapter for legacy direct translation access:
 * - Keeps existing call sites working (translations[language].section.key)
 * - Avoids importing ar/en resources again (they are already loaded by i18next)
 */
export const translations = new Proxy(
  {} as Record<Language, TranslationTree>,
  {
    get(_target, prop: string) {
      if (prop !== "ar" && prop !== "en") return undefined;

      // i18next stores the full tree under the default "translation" namespace.
      return (
        (i18n.getResourceBundle(prop, "translation") as TranslationTree) ?? {}
      );
    },
  },
);

// Kept for backward compatibility in case older modules import this type.
export type TranslationKeys = TranslationTree;
export type { Language };
