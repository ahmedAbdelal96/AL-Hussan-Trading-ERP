import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Alert({
  children,
  className,
  variant = "warning",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "warning" | "destructive" | "success" | "info";
}) {
  const variantClassName =
    variant === "default"
      ? "border-border bg-card text-foreground"
      : variant === "destructive"
      ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
      : variant === "success"
        ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
        : variant === "info"
          ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
          : "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200";

  return (
    <div
      className={cn(
        "rounded-md border p-4 flex items-center gap-2",
        variantClassName,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AlertTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)}>
      {children}
    </h5>
  );
}

export function AlertDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)}>
      {children}
    </div>
  );
}
