import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language } from "../types";
import { changeLanguageWithLoad } from "@/i18n/config";

interface LanguageStoreState {
  language: Language;
  direction: "ltr" | "rtl";
}

interface LanguageActions {
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

type LanguageStore = LanguageStoreState & LanguageActions;

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "en";

  const stored = localStorage.getItem("language");
  if (stored === "ar" || stored === "en") return stored;

  const browserLang = navigator.language.split("-")[0];
  return browserLang === "ar" ? "ar" : "en";
};

const getDirection = (language: Language): "ltr" | "rtl" => {
  return language === "ar" ? "rtl" : "ltr";
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => {
      const initialLanguage = getInitialLanguage();
      const initialDirection = getDirection(initialLanguage);

      if (typeof window !== "undefined") {
        document.documentElement.lang = initialLanguage;
        document.documentElement.dir = initialDirection;
        document.documentElement.setAttribute("lang", initialLanguage);
        document.documentElement.setAttribute("dir", initialDirection);

        // Keep i18next in sync with persisted language.
        void changeLanguageWithLoad(initialLanguage);
      }

      return {
        language: initialLanguage,
        direction: initialDirection,

        setLanguage: (language) => {
          const direction = getDirection(language);

          // Update store only after language resources are ready to avoid UI flicker.
          void changeLanguageWithLoad(language)
            .then(() => {
              set({
                language,
                direction,
              });

              if (typeof window !== "undefined") {
                document.documentElement.lang = language;
                document.documentElement.dir = direction;
                document.documentElement.setAttribute("lang", language);
                document.documentElement.setAttribute("dir", direction);
              }
            })
            .catch((error) => {
              console.error("Failed to change language", error);
            });
        },

        toggleLanguage: () => {
          const currentLang = get().language;
          const newLang = currentLang === "ar" ? "en" : "ar";
          get().setLanguage(newLang);
        },
      };
    },
    {
      name: "language-store",
      partialize: (state) => ({
        language: state.language,
        direction: state.direction,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          const direction = getDirection(state.language);

          // Keep i18next in sync after restoring persisted state.
          void changeLanguageWithLoad(state.language);

          document.documentElement.lang = state.language;
          document.documentElement.dir = direction;
          document.documentElement.setAttribute("lang", state.language);
          document.documentElement.setAttribute("dir", direction);
        }
      },
    },
  ),
);

/**
 * Helper hook for backward compatibility with old LanguageContext
 */
export const useLanguage = () => {
  const { language, toggleLanguage, direction } = useLanguageStore();
  return {
    language,
    toggleLanguage,
    isRTL: direction === "rtl",
  };
};
