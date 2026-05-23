import { useEffect } from "react";
import { useLanguageStore } from "../store/languageStore";

export const useLanguage = () => {
  const { language, direction, setLanguage, toggleLanguage } = useLanguageStore();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", direction);
  }, [language, direction]);

  const t = (key: string, ar?: string): string => {
    return language === "ar" && ar ? ar : key;
  };

  return {
    language,
    direction,
    isRTL: direction === "rtl",
    isLTR: direction === "ltr",
    isArabic: language === "ar",
    isEnglish: language === "en",
    setLanguage,
    toggleLanguage,
    t,
  };
};
