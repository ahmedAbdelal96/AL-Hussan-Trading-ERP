/**
 * Not Found Page - 404
 */

import { useNavigate } from "react-router";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-brand-600">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
          {t("common.notFound.title")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[var(--text-secondary)]">
          {t("common.notFound.message")}
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Button onClick={() => navigate("/")}>
            <Home className="w-4 h-4" />
            {t("common.notFound.goHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
