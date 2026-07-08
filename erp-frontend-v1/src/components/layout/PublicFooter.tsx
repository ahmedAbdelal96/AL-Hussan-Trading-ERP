import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router";

export default function PublicFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2 md:mb-0 mb-6">
            <div className="flex gap-6">
              <Link to="/" className="text-text-secondary hover:text-primary-main text-sm font-medium">
                {t("public.nav.home")}
              </Link>
              <Link to="/about" className="text-text-secondary hover:text-primary-main text-sm font-medium">
                {t("public.nav.about")}
              </Link>
              <Link to="/contact" className="text-text-secondary hover:text-primary-main text-sm font-medium">
                {t("public.nav.contact")}
              </Link>
            </div>
          </div>
          <div className="md:order-1 flex justify-center md:justify-start items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-main text-white font-bold text-xs">
              H
            </div>
            <p className="text-center text-sm leading-5 text-text-tertiary">
              &copy; {currentYear} {t("public.footer.rights")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
