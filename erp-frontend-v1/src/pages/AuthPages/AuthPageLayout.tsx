import React from "react";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { LanguageToggleButton } from "@/components/common/LanguageToggleButton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-1 h-dvh w-full bg-slate-50 dark:bg-[#08111C] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden transition-colors duration-300">
      {/* Background ambient lighting effects & blueprint grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Blueprint Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(96,165,250,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-60 dark:opacity-40" />
        
        {/* Ambient radial glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-main/5 dark:bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* Main content shell */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {children}
      </div>

      {/* Floating controls positioned cleanly in the corner */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-1 shadow-md backdrop-blur-xs rtl:right-auto rtl:left-4 scale-90">
        <LanguageToggleButton />
        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />
        <ThemeToggleButton />
      </div>
    </div>
  );
}
