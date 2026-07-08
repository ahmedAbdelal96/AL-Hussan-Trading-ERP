import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/authStore";
import { useLanguageStore } from "@/store/languageStore";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { Menu, X, Globe } from "lucide-react";

export default function PublicNavbar() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { toggleLanguage, language } = useLanguageStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isCurrentRoute = (path: string) => location.pathname === path;
  
  const navLinks = [
    { name: t("public.nav.home"), path: "/" },
    { name: t("public.nav.about"), path: "/about" },
    { name: t("public.nav.contact"), path: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Right / Start (in RTL): Logo Area */}
        <div className="flex items-center gap-2 min-w-[240px] justify-start">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-main text-white font-bold text-lg">
              H
            </div>
            <span className="font-bold text-lg text-primary-main">
              {t("public.nav.logoText") || "نظام الحصان للمقاولات"}
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links - flex-1 centers it because sides have same min-width */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary-main ${
                isCurrentRoute(link.path) ? "text-primary-main border-b-2 border-primary-main pb-1 font-bold" : "text-text-secondary"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Left / End (in RTL): Actions */}
        <div className="hidden md:flex items-center gap-4 min-w-[240px] justify-end">
          <ThemeToggleButton />
          
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary-main transition-colors px-2 py-1 rounded hover:bg-surface-hover"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{language === "ar" ? "en" : "عربي"}</span>
          </button>
          
          {isAuthenticated ? (
            <Button asChild variant="outline" className="border-border text-text-primary hover:bg-surface-hover">
              <Link to="/dashboard">{t("public.nav.dashboard")}</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-border text-text-primary hover:bg-surface-hover">
              <Link to="/login">{t("public.nav.login")}</Link>
            </Button>
          )}

          <Button asChild variant="default" className="bg-primary-main hover:bg-primary-dark text-white">
            <Link to="/contact">{t("public.nav.demo")}</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggleButton />
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-center h-10 w-10 text-text-secondary hover:bg-surface-hover rounded"
          >
            <Globe className="h-5 w-5" />
          </button>
          <button
            className="flex items-center justify-center h-10 w-10 text-text-secondary hover:bg-surface-hover rounded"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block rounded px-3 py-2 text-base font-medium ${
                  isCurrentRoute(link.path)
                    ? "bg-primary-bg text-primary-main font-bold"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
              {isAuthenticated ? (
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("public.nav.dashboard")}
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    {t("public.nav.login")}
                  </Link>
                </Button>
              )}
              <Button asChild variant="default" className="w-full justify-center bg-primary-main hover:bg-primary-dark text-white">
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                  {t("public.nav.demo")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
