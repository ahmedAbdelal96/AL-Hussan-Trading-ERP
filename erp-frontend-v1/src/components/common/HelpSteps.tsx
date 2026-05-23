/**
 * Help Steps Component
 */

import { Info, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HelpStepsProps {
  steps: string[];
  title?: string;
  compact?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const HelpSteps = ({
  steps,
  title,
  compact,
  collapsible,
  defaultOpen = true,
  className = "",
}: HelpStepsProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(collapsible ? defaultOpen : true);

  if (!steps?.length) return null;

  return (
    <Card
      className={`border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] shadow-[var(--shadow-xs)] ${
        compact ? "mt-4" : "mt-8"
      } ${className}`.trim()}
    >
      <CardHeader className={compact ? "py-3" : undefined}>
        <div className="flex items-center justify-between gap-3">
          <CardTitle
            className={`${
              compact ? "text-base" : "text-lg"
            } flex items-center gap-2 text-foreground`}
          >
            <Info className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-primary`} />
            {title ||
              t("common.helpSteps.title", { defaultValue: "نصائح سريعة" })}
          </CardTitle>

          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <Minus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isOpen
                ? t("common.hide", { defaultValue: "إخفاء" })
                : t("common.show", { defaultValue: "عرض" })}
            </button>
          )}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className={compact ? "pb-4 pt-0" : undefined}>
          <ol
            className={`list-inside list-decimal text-muted-foreground ${
              compact ? "space-y-1 text-xs" : "space-y-2 text-sm"
            }`}
          >
            {steps.map((step, index) => (
              <li key={index} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      )}
    </Card>
  );
};
