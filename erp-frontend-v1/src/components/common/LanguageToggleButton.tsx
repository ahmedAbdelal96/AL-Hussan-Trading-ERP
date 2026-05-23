import { useLanguage } from "@/store/languageStore";
import { useTranslation } from "@/i18n/useTranslation";

export const LanguageToggleButton: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleLanguage}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--input-border)] bg-[var(--surface)] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      aria-label={t("common.toggleLanguage")}
      title={
        language === "ar"
          ? t("common.switchToEnglish")
          : t("common.switchToArabic")
      }
    >
      <span className="text-sm font-semibold">
        {language === "ar" ? "EN" : "AR"}
      </span>
    </button>
  );
};

export default LanguageToggleButton;
