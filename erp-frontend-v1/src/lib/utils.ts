import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY, getCurrentLocale } from "@/config/system.constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  _currency: string = CURRENCY.DEFAULT,
): string {
  return new Intl.NumberFormat(getCurrentLocale(), {
    style: "currency",
    currency: CURRENCY.DEFAULT,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getCurrentLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "—";
  return dateObj.toLocaleDateString(getCurrentLocale(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
