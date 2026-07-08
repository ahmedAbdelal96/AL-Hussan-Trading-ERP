import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string;
  secondaryText?: string;
}

export default function CTASection({
  title,
  subtitle,
  primaryLink = "/contact",
  primaryText,
  secondaryLink = "/login",
  secondaryText
}: CTASectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-primary-main dark:bg-surface-secondary py-20 px-4 sm:px-6 lg:px-8 border-t border-transparent dark:border-border transition-colors">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white dark:text-text-primary sm:text-4xl">
          {title || t("public.cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80 dark:text-text-secondary">
          {subtitle || t("public.cta.subtitle")}
        </p>
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          {/* White background button with primary color text in light mode, solid blue with white text in dark mode */}
          <Button asChild size="lg" className="!bg-white !text-primary-main !border-transparent hover:!bg-surface-soft dark:!bg-primary-main dark:!text-white dark:hover:!bg-primary-dark">
            <Link to={primaryLink}>{primaryText || t("public.cta.secondary")}</Link>
          </Button>
          
          {/* Transparent background outline button with white border/text in light mode, themed border/text in dark mode */}
          <Button asChild size="lg" variant="outline" className="!bg-transparent !border-white !text-white hover:!bg-white/10 dark:!border-border dark:!text-text-primary dark:hover:!bg-surface-hover">
            <Link to={secondaryLink}>{secondaryText || t("public.cta.login")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
export { CTASectionProps };
