import React from "react";
import { Link } from "react-router";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { LanguageToggleButton } from "@/components/common/LanguageToggleButton";
import { Building2, ShieldCheck, Activity } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative z-1 min-h-screen bg-[var(--background)] p-4 sm:p-0">
      <div className="relative flex min-h-screen w-full flex-col justify-center bg-[var(--background)] sm:p-0 lg:flex-row">
        {children}
        <div className="relative hidden h-full w-full overflow-hidden border-l border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-secondary)] to-[var(--background-sec)] lg:grid lg:w-1/2">
          <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary-main/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-primary-main/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10">
            <div className="max-w-xl">
              <Link to="/" className="mb-8 inline-flex items-center gap-3">
                <div className="rounded-md bg-primary-main/10 p-2.5">
                  <Building2 className="h-6 w-6 text-primary-main" />
                </div>
                <img width={300} height={56} src="/logo/logo.png" alt="Logo" />
              </Link>

              <h1 className="mb-3 text-3xl font-semibold leading-tight text-[var(--text-primary)]">
                {t("auth.login.enterprise.sideTitle")}
              </h1>
              <p className="max-w-lg text-base leading-7 text-[var(--text-secondary)]">
                {t("auth.login.enterprise.sideDescription")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 backdrop-blur">
                <ShieldCheck className="mb-2 h-5 w-5 text-primary-main" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t("auth.login.enterprise.featureSecurityTitle")}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {t("auth.login.enterprise.featureSecurityDesc")}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 backdrop-blur">
                <Activity className="mb-2 h-5 w-5 text-primary-main" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t("auth.login.enterprise.featureLiveDataTitle")}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {t("auth.login.enterprise.featureLiveDataDesc")}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 backdrop-blur">
                <Building2 className="mb-2 h-5 w-5 text-primary-main" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t("auth.login.enterprise.featureEnterpriseTitle")}
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {t("auth.login.enterprise.featureEnterpriseDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-5 right-5 z-50 hidden gap-2 sm:flex">
          <LanguageToggleButton />
          <ThemeToggleButton />
        </div>
      </div>
    </div>
  );
}
