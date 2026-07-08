import { useTranslation } from "@/i18n/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import CTASection from "@/components/layout/CTASection";
import AnimatedSection from "@/components/common/AnimatedSection";
import { 
  Building2, HardHat, Pickaxe, Map, Banknote, FileBarChart, ShieldCheck,
  Target, Lightbulb, Scale, Eye, Activity, Key, BookOpen
} from "lucide-react";

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const builtForItems = [
    { icon: Map, key: "sites" },
    { icon: HardHat, key: "transfers" },
    { icon: Pickaxe, key: "assets" },
    { icon: Building2, key: "maintenance" },
    { icon: Banknote, key: "payroll" },
    { icon: FileBarChart, key: "reports" },
    { icon: ShieldCheck, key: "roles" },
  ];

  const valuesItems = [
    { icon: Target, key: "accuracy" },
    { icon: Scale, key: "control" },
    { icon: Eye, key: "clarity" },
    { icon: Activity, key: "accountability" },
    { icon: FileBarChart, key: "reporting" },
    { icon: Key, key: "security" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary">
      
      {/* 1. Hero Section */}
      <section className="bg-surface py-20 border-b border-border text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-bg/5 to-transparent pointer-events-none" />
        <AnimatedSection className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10" delay={150}>
          <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
            {t("public.about.heroTitle")}
          </h1>
          <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto">
            {t("public.about.heroSubtitle")}
          </p>
        </AnimatedSection>
      </section>

      {/* 2. Story Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Right / Start (in RTL): Content */}
            <AnimatedSection className="order-2 md:order-1 text-start space-y-6" delay={100}>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary">
                {t("public.about.storyTitle")}
              </h2>
              <p className="text-base text-text-secondary leading-relaxed">
                {t("public.about.storyText")}
              </p>
            </AnimatedSection>
            
            {/* Left / End (in RTL): Visual UI Mockup (Workflow/Data integration) */}
            <AnimatedSection className="order-1 md:order-2" delay={250}>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-primary p-6 rounded-xl border border-border flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 transition-transform shadow-sm">
                  <Pickaxe className="w-8 h-8 text-primary-main" />
                  <span className="font-bold text-sm text-text-primary">{isAr ? "التنفيذ الميداني" : "Field Execution"}</span>
                </div>
                <div className="bg-surface-primary p-6 rounded-xl border border-border flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 transition-transform translate-y-6 shadow-sm">
                  <HardHat className="w-8 h-8 text-primary-main" />
                  <span className="font-bold text-sm text-text-primary">{isAr ? "إدارة المشاريع" : "Project Management"}</span>
                </div>
                <div className="bg-surface-primary p-6 rounded-xl border border-border flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 transition-transform shadow-sm">
                  <ShieldCheck className="w-8 h-8 text-primary-main" />
                  <span className="font-bold text-sm text-text-primary">{isAr ? "الجودة والسلامة" : "Quality & Safety"}</span>
                </div>
                <div className="bg-surface-primary p-6 rounded-xl border border-border flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 transition-transform translate-y-6 shadow-sm">
                  <Building2 className="w-8 h-8 text-primary-main" />
                  <span className="font-bold text-sm text-text-primary">{isAr ? "تسليم المشاريع" : "Project Handover"}</span>
                </div>
              </div>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* 3. Vision & Mission Cards */}
      <section className="py-16 bg-bg-app border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="grid md:grid-cols-2 gap-8" delay={100}>
            <Card className="border-border shadow-xs bg-surface-primary hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full w-full min-w-0">
              <CardContent className="p-8 text-start flex flex-col items-start gap-4">
                <div className="w-12 h-12 bg-primary-bg text-primary-main rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">{t("public.about.visionTitle")}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t("public.about.visionText")}</p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-xs bg-surface-primary hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full w-full min-w-0">
              <CardContent className="p-8 text-start flex flex-col items-start gap-4">
                <div className="w-12 h-12 bg-primary-bg text-primary-main rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">{t("public.about.missionTitle")}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t("public.about.missionText")}</p>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* 4. Built for Saudi Operations */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary text-center mb-12">
            {t("public.about.builtForTitle")}
          </h2>
          <AnimatedSection className="grid grid-cols-2 md:grid-cols-4 gap-6" delay={150}>
            {builtForItems.map(({ icon: Icon, key }, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-4 bg-surface border border-border rounded-xl shadow-xs text-start hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 w-full min-w-0">
                <Icon className="w-5 h-5 text-primary-main flex-shrink-0" />
                <span className="text-text-primary font-medium text-sm">{t(`public.about.builtFor.${key}`)}</span>
              </div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* 5. Operational Values */}
      <section className="py-20 bg-bg-app border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary text-center mb-12">
            {t("public.about.valuesTitle")}
          </h2>
          <AnimatedSection className="grid grid-cols-2 md:grid-cols-6 gap-6" delay={150}>
            {valuesItems.map(({ icon: Icon, key }, idx) => (
              <Card key={idx} className="border-border text-center hover:border-primary-main hover:-translate-y-1 transition-all duration-300 bg-surface-primary h-full w-full min-w-0">
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <Icon className="w-8 h-8 text-text-tertiary" />
                  <span className="text-sm font-bold text-text-primary">{t(`public.about.values.${key}`)}</span>
                </CardContent>
              </Card>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* 6. CTA Section */}
      <CTASection title={t("public.about.ctaTitle")} />
      
    </div>
  );
}
