import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type ColorVariant =
  | "blue"
  | "green"
  | "purple"
  | "amber"
  | "red"
  | "orange"
  | "indigo"
  | "pink"
  | "teal"
  | "cyan"
  | "white"
  | "soft";

interface InfoCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: ColorVariant;
  iconVariant?: ColorVariant;
  valueSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  extra?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

const accentMap: Record<ColorVariant, string> = {
  blue: "var(--primary-main)",
  green: "var(--success)",
  purple: "var(--info)",
  amber: "var(--warning)",
  red: "var(--error)",
  orange: "var(--warning)",
  indigo: "var(--info)",
  pink: "var(--error)",
  teal: "var(--success)",
  cyan: "var(--info)",
  white: "var(--text-secondary)",
  soft: "var(--text-secondary)",
};

const valueSizeClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
  "2xl": "text-3xl",
};

export const InfoCard: React.FC<InfoCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = "blue",
  iconVariant,
  valueSize = "lg",
  extra,
  className = "",
  labelClassName = "",
  valueClassName = "",
}) => {
  const accent = accentMap[variant];
  const iconAccent = accentMap[iconVariant ?? variant];

  return (
    <Card
      className={className}
      style={{
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={[
                "text-[var(--font-meta-size)] leading-[var(--font-meta-line)] font-[var(--font-meta-weight)] text-[var(--text-secondary)] truncate",
                labelClassName,
              ].join(" ")}
            >
              {label}
            </p>
            <p
              className={[
                valueSizeClasses[valueSize],
                "mt-1 font-semibold leading-tight text-[var(--text-primary)] tabular-nums truncate",
                valueClassName,
              ].join(" ")}
              style={{ color: accent }}
            >
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-[var(--text-tertiary)] truncate">
                {subtitle}
              </p>
            )}
            {extra && <div className="mt-2">{extra}</div>}
          </div>

          {Icon && (
            <div
              className="h-8 w-8 shrink-0 rounded-[var(--radius-md)] flex items-center justify-center"
              style={{
                background: `color-mix(in srgb, ${iconAccent} 14%, var(--bg-surface-primary))`,
                color: iconAccent,
              }}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

