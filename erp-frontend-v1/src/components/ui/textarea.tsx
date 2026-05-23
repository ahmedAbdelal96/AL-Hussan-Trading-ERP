import * as React from "react";
import { useLanguageStore } from "@/store/languageStore";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const { language } = useLanguageStore();
  const isRTL = language === "ar";

  return (
    <textarea
      dir={isRTL ? "rtl" : "ltr"}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-all duration-200",
        "bg-[var(--input-bg)] border-[var(--input-border)]",
        "text-foreground placeholder:text-muted-foreground",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        "hover:border-[var(--border-hover)]",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--input-disabled)]",
        "selection:bg-primary selection:text-white",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
