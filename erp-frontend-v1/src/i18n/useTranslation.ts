import { useLanguageStore } from "@/store/languageStore";
import { translations } from "./translations";

type TranslationOptions = {
  defaultValue?: string;
  count?: number;
  returnObjects?: boolean;
  [key: string]: unknown;
};

const interpolate = (
  template: string,
  options?: TranslationOptions,
): string => {
  if (!options) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = options[key];
    if (value === undefined || value === null) {
      return match;
    }
    return String(value);
  });
};

export const useTranslation = () => {
  const { language, setLanguage } = useLanguageStore();

  const t = <T = string>(path: string, options?: TranslationOptions): T => {
    const keys = path.split(".");
    let value: unknown = translations[language];

    for (const key of keys) {
      if (typeof value !== "object" || value === null) {
        value = undefined;
        break;
      }
      value = (value as Record<string, unknown>)[key];
      if (value === undefined) {
        if (options?.defaultValue) {
          return options.defaultValue as T;
        }
        console.warn(`Translation missing for: ${path}`);
        return path as T;
      }
    }

    if (typeof value === "string") {
      return interpolate(value, options) as T;
    }

    if (options?.returnObjects) {
      return value as T;
    }

    // Guard against rendering "[object Object]" when a non-leaf key is used.
    console.warn(`Translation key resolved to object, expected string: ${path}`);
    if (options?.defaultValue) {
      return options.defaultValue as T;
    }
    return path as T;
  };

  return {
    t,
    i18n: {
      language,
      changeLanguage: setLanguage,
    },
  };
};

// Typed helper for specific sections
export const useCommonTranslation = () => {
  const { language } = useLanguageStore();
  return translations[language].common;
};

export const useSidebarTranslation = () => {
  const { language } = useLanguageStore();
  return translations[language].sidebar;
};

export const useAuthTranslation = () => {
  const { language } = useLanguageStore();
  return translations[language].auth;
};

export const useDashboardTranslation = () => {
  const { language } = useLanguageStore();
  return translations[language].dashboard;
};

export const useProfileTranslation = () => {
  const { language } = useLanguageStore();
  return translations[language].profile;
};
