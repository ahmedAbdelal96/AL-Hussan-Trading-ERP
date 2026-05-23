import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary-main)] text-[var(--text-on-brand)]",
        secondary:
          "border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]",
        success:
          "border-transparent bg-[var(--success-bg)] text-[var(--success)]",
        destructive:
          "border-transparent bg-[var(--error-bg)] text-[var(--error)]",
        danger:
          "border-transparent bg-[var(--error-bg)] text-[var(--error)]",
        warning:
          "border-transparent bg-[var(--warning-bg)] text-[var(--warning)]",
        info: "border-transparent bg-[var(--info-bg)] text-[var(--info)]",
        purple:
          "border-transparent bg-[var(--info-bg)] text-[var(--info)]",
        accent:
          "border-transparent bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]",
        outline:
          "border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)]",
        urgent: "border-transparent bg-[var(--error)] text-[var(--text-on-brand)] animate-pulse",
        critical:
          "border-transparent bg-[var(--warning)] text-[var(--text-on-brand)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
