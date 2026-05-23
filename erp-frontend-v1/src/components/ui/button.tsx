import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-main)] text-[var(--text-on-brand)] hover:bg-[var(--primary-dark)] shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-error-600 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 shadow-sm",
        outline:
          "border border-[var(--input-border)] bg-[var(--surface)] text-[var(--primary-main)] hover:bg-[var(--primary-bg)]",
        secondary:
          "bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] shadow-sm",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
        link: "text-[var(--primary-main)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  fullWidth?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  fullWidth = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        fullWidth && "w-full",
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
