import { useTranslation } from "@/i18n/useTranslation";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CTASection from "@/components/layout/CTASection";
import AnimatedSection from "@/components/common/AnimatedSection";
import { 
  MapPin, Briefcase, Users, Banknote, Truck, Wrench, BarChart3, ShieldCheck,
  Target, LineChart, Lock, CheckCircle2, Shield,
  ArrowRight, HardHat, ClipboardCheck, Award, Eye
} from "lucide-react";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  // trust Items
  const trustItems = [
    { icon: ClipboardCheck, key: "control" },
    { icon: Target, key: "tracking" },
    { icon: Award, key: "reports" },
    { icon: Users, key: "roles" },
  ];

  // 3 Featured Services (larger) + 5 compact services
  const featuredServices = [
    { icon: MapPin, key: "sites", color: "from-blue-600/20 to-blue-500/5 text-blue-500 border-blue-500/30" },
    { icon: Briefcase, key: "projects", color: "from-amber-600/20 to-amber-500/5 text-amber-500 border-amber-500/30" },
    { icon: Users, key: "employees", color: "from-emerald-600/20 to-emerald-500/5 text-emerald-500 border-emerald-500/30" },
  ];

  const supportingServices = [
    { icon: Banknote, key: "payroll" },
    { icon: Truck, key: "assets" },
    { icon: Wrench, key: "maintenance" },
    { icon: BarChart3, key: "reports" },
    { icon: ShieldCheck, key: "users" },
  ];

  // Project Delivery Journey Steps
  const journeySteps = [
    { key: "reqs", number: "01" },
    { key: "planning", number: "02" },
    { key: "execution", number: "03" },
    { key: "followup", number: "04" },
    { key: "quality", number: "05" },
  ];

  // Coordination departments
  const coordinationTeams = [
    { key: "management", icon: Shield, position: "lg:col-start-1 lg:row-start-2" },
    { key: "projectManagement", icon: Briefcase, position: "lg:col-start-2 lg:row-start-1" },
    { key: "siteSupervisors", icon: MapPin, position: "lg:col-start-4 lg:row-start-1" },
    { key: "resources", icon: Truck, position: "lg:col-start-5 lg:row-start-2" },
    { key: "quality", icon: ShieldCheck, position: "lg:col-start-3 lg:row-start-3" },
  ];

  // Showcase categories
  const showcaseCategories = [
    { key: "construction", count: "12", desc: isAr ? "مشاريع بنية تحتية ومباني" : "Infrastructure and buildings" },
    { key: "site", count: "24", desc: isAr ? "أعمال تهيئة وتنسيق مواقع" : "Site preparation and grading" },
    { key: "support", count: "8", desc: isAr ? "دعم تشغيلي ولوجستي" : "Logistical and support services" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary overflow-x-hidden">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-surface py-20 lg:py-32 border-b border-border">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-main/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Area */}
            <AnimatedSection className="lg:col-span-6 flex flex-col gap-6 text-start" delay={150}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-bg/50 border border-primary-main/30 w-fit text-xs font-semibold text-primary-main">
                <HardHat className="w-3.5 h-3.5" />
                {isAr ? "مؤسسة وطنية رائدة" : "A Leading National Enterprise"}
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl leading-tight">
                {t("public.hero.title")}
              </h1>
              
              <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
                {t("public.hero.subtitle")}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-primary-main hover:bg-primary-dark text-white px-8 h-12 text-base font-semibold shadow-md transition-all duration-300">
                  <Link to="/contact">{t("public.hero.primaryCTA")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-border text-text-primary hover:bg-surface-hover px-8 h-12 text-base font-semibold transition-all duration-300">
                  <a href="#services">{t("public.hero.secondaryCTA")}</a>
                </Button>
              </div>
            </AnimatedSection>
            
            {/* Right: Technical/Blueprint Visual composition */}
            <AnimatedSection className="lg:col-span-6" delay={300}>
              <div className="relative aspect-square w-full max-w-[480px] mx-auto bg-surface-secondary border border-border rounded-2xl overflow-hidden p-6 shadow-xl flex items-center justify-center">
                {/* Blueprint Drawing Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#3b82f615_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                
                {/* Visual architectural blueprint lines */}
                <div className="relative w-full h-full border border-dashed border-primary-main/20 rounded-xl flex flex-col justify-between p-6">
                  
                  {/* Top line with axis labels */}
                  <div className="flex justify-between text-[10px] font-mono text-primary-main/40" dir="ltr">
                    <span>X-AXIS // 0.00</span>
                    <span>1.240</span>
                    <span>2.480</span>
                    <span>MAX WIDTH</span>
                  </div>
                  
                  {/* Staggered overlapping isometric blocks representing planning to delivery */}
                  <div className="flex flex-col gap-4 items-center justify-center py-6 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-primary-main/20 -translate-y-1/2 pointer-events-none" />
                    
                    {/* Isometric block 1 */}
                    <div className="w-5/6 bg-surface-primary border border-border rounded-lg p-3 shadow-md hover:border-primary-main/40 transition-colors z-10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary-bg flex items-center justify-center text-primary-main">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div className="text-start flex-1">
                        <span className="text-[10px] font-mono text-primary-main block">{isAr ? "المرحلة الأولى" : "PHASE 01"}</span>
                        <span className="text-xs font-bold text-text-primary">{t("public.heroVisual.step1")}</span>
                      </div>
                      <div className="text-[10px] font-mono text-text-tertiary">100%</div>
                    </div>

                    {/* Isometric block 2 */}
                    <div className="w-5/6 bg-surface-primary border border-primary-main/40 rounded-lg p-3 shadow-md hover:border-primary-main/60 transition-colors z-10 flex items-center gap-3 translate-x-4 lg:translate-x-8">
                      <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <div className="text-start flex-1">
                        <span className="text-[10px] font-mono text-amber-500 block">{isAr ? "المرحلة الثانية" : "PHASE 02"}</span>
                        <span className="text-xs font-bold text-text-primary">{t("public.heroVisual.step3")}</span>
                      </div>
                      <div className="text-[10px] font-mono text-text-tertiary">IN PROGRESS</div>
                    </div>

                    {/* Isometric block 3 */}
                    <div className="w-5/6 bg-surface-primary border border-border rounded-lg p-3 shadow-md hover:border-primary-main/40 transition-colors z-10 flex items-center gap-3 -translate-x-4 lg:-translate-x-8">
                      <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="text-start flex-1">
                        <span className="text-[10px] font-mono text-emerald-500 block">{isAr ? "المرحلة الثالثة" : "PHASE 03"}</span>
                        <span className="text-xs font-bold text-text-primary">{t("public.heroVisual.step5")}</span>
                      </div>
                      <div className="text-[10px] font-mono text-text-tertiary">PENDING</div>
                    </div>

                  </div>

                  {/* Bottom line with axis labels */}
                  <div className="flex justify-between text-[10px] font-mono text-primary-main/40" dir="ltr">
                    <span>Y-AXIS // B-402</span>
                    <span>COORD // 24.7136</span>
                    <span>SCALE 1:15</span>
                  </div>

                </div>
              </div>
            </AnimatedSection>
            
          </div>
        </div>
      </section>

      {/* 2. Trust Strip */}
      <section className="bg-surface-secondary py-10 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {trustItems.map(({ icon: Icon, key }, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-bg text-primary-main shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-bold text-text-primary text-sm sm:text-base">
                  {t(`public.trust.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Services / Capabilities Section */}
      <section id="services" className="py-20 bg-bg-app border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-primary-main text-sm font-extrabold uppercase tracking-wider mb-2">
              {isAr ? "خدماتنا" : "Our Services"}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
              {t("public.modules.title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              {t("public.modules.subtitle")}
            </p>
          </div>
          
          {/* Featured Large Service Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {featuredServices.map(({ icon: Icon, key, color }, idx) => (
              <AnimatedSection key={idx} className="h-full" delay={100 * (idx + 1)}>
                <Card className={`border border-border bg-surface-primary hover:border-primary-main hover:shadow-lg transition-all duration-300 group h-full overflow-hidden relative`}>
                  {/* Decorative background accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient from-primary-main/5 to-transparent pointer-events-none rounded-full" />
                  <CardContent className="p-8 flex flex-col justify-between h-full items-start text-start">
                    <div className="w-full">
                      <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} transition-all duration-300 group-hover:scale-110`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-bold text-text-primary mb-4">
                        {t(`public.modules.${key}.title`)}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed mb-6">
                        {t(`public.modules.${key}.desc`)}
                      </p>
                    </div>
                    <Button asChild variant="link" className="p-0 text-primary-main group-hover:text-primary-dark transition-colors font-semibold">
                      <Link to="/contact" className="flex items-center gap-1">
                        {isAr ? "طلب الخدمة" : "Request Service"}
                        <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isAr ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>

          {/* Supporting Smaller Service Cards */}
          <AnimatedSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" delay={200}>
            {supportingServices.map(({ icon: Icon, key }, idx) => (
              <Card key={idx} className="border-border bg-surface-primary hover:border-primary-main hover:shadow-sm transition-all duration-300 group">
                <CardContent className="p-6 flex flex-col items-start text-start justify-between h-full min-h-[160px]">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-secondary group-hover:bg-primary-main group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary mb-2">
                      {t(`public.modules.${key}.title`)}
                    </h4>
                    <p className="text-text-tertiary text-xs leading-relaxed line-clamp-2">
                      {t(`public.modules.${key}.desc`)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* 4. Project Delivery Journey Timeline */}
      <section className="py-20 bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-primary-main text-sm font-extrabold uppercase tracking-wider mb-2">
              {isAr ? "منهجية العمل" : "Workflow"}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
              {t("public.methodology.title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              {t("public.methodology.subtitle")}
            </p>
          </div>

          {/* Connected timeline layout */}
          <div className="relative mt-12">
            
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 hidden lg:block z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              {journeySteps.map(({ key, number }, idx) => (
                <AnimatedSection key={idx} className="h-full" delay={100 * (idx + 1)}>
                  <div className="flex flex-col items-center lg:items-start text-center lg:text-start group">
                    {/* Circle Node */}
                    <div className="w-14 h-14 rounded-full bg-surface border border-border group-hover:border-primary-main flex items-center justify-center shadow-md relative z-10 transition-colors duration-300">
                      <span className="text-lg font-mono font-extrabold text-primary-main group-hover:text-primary-dark">
                        {number}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary-main transition-colors duration-300">
                        {t(`public.methodology.steps.${key}.title`)}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto lg:mx-0">
                        {t(`public.methodology.steps.${key}.desc`)}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Quality & Safety Split visual section */}
      <section className="py-20 bg-bg-app border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Visual/Blueprint Placeholder panel */}
            <AnimatedSection className="lg:col-span-6 relative aspect-video w-full bg-surface-secondary border border-border rounded-2xl overflow-hidden p-6 shadow-lg flex flex-col justify-center items-center gap-4 group" delay={150}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />
              <div className="absolute inset-0 bg-primary-main/5 mix-blend-color" />
              {/* CSS Grid Pattern simulating safety plan layout */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f008_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f008_1px,transparent_1px)] bg-[size:16px_16px]" />
              
              <div className="z-20 text-center space-y-2 text-white opacity-90 group-hover:opacity-100 transition-opacity">
                <HardHat className="w-12 h-12 mx-auto text-primary-main drop-shadow-md" />
                <span className="text-lg font-bold block">{isAr ? "موقع عمل آمن ونظيف" : "Safe & Secure Construction Sites"}</span>
                <span className="text-xs font-mono block opacity-80">SAFETY-FIRST PROTOCOLS</span>
              </div>
            </AnimatedSection>

            {/* Right Column: Checklists */}
            <AnimatedSection className="lg:col-span-6 text-start flex flex-col gap-6" delay={300}>
              <div className="text-primary-main text-sm font-extrabold uppercase tracking-wider">
                {isAr ? "الجودة والسلامة المهنية" : "Quality & HSE"}
              </div>
              <h2 className="text-3xl font-extrabold text-text-primary leading-tight">
                {t("public.qualitySafety.title")}
              </h2>
              <p className="text-text-secondary text-base leading-relaxed">
                {t("public.qualitySafety.subtitle")}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-3 bg-surface border border-border p-4 rounded-xl shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-text-primary text-sm">
                      {t(`public.qualitySafety.checklists.${index}`)}
                    </span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* 6. Project Showcase Placeholder Section */}
      <section className="py-20 bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-primary-main text-sm font-extrabold uppercase tracking-wider mb-2">
              {isAr ? "معرض المشاريع" : "Project Showcase"}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
              {t("public.showcase.title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              {t("public.showcase.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {showcaseCategories.map(({ key, count, desc }, idx) => (
              <AnimatedSection key={idx} className="h-full" delay={150 * (idx + 1)}>
                <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface-secondary shadow-md hover:-translate-y-2 transition-all duration-300 h-full flex flex-col justify-between">
                  {/* Photo Placeholder Panel */}
                  <div className="w-full aspect-video bg-surface-primary flex flex-col items-center justify-center p-6 border-b border-border group-hover:bg-surface-hover transition-colors relative">
                    <div className="absolute inset-0 bg-primary-main/5 mix-blend-color pointer-events-none" />
                    <span className="text-3xl font-extrabold font-mono text-text-tertiary mb-1">
                      {count}+
                    </span>
                    <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-wider">
                      {isAr ? "مشروع مكتمل" : "Projects Completed"}
                    </span>
                  </div>
                  {/* Details */}
                  <div className="p-6 text-start flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary-main transition-colors">
                        {t(`public.showcase.categories.${key}`)}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed mb-4">
                        {desc}
                      </p>
                    </div>
                    <Link to="/contact" className="text-xs font-bold text-primary-main hover:text-primary-dark transition-colors inline-flex items-center gap-1 mt-2">
                      {isAr ? "استفسر عن المشاريع" : "Inquire About Projects"}
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isAr ? "rotate-180" : ""}`} />
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          
          <div className="mt-12 text-center text-xs text-text-tertiary font-medium">
            * {isAr ? "صور ومواصفات المشاريع الحقيقية سيتم إضافتها وتحديثها قريباً." : "Real project photos and specifications will be added and updated soon."}
          </div>
        </div>
      </section>

      {/* 7. Coordination Section */}
      <section className="py-20 bg-bg-app border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-primary-main text-sm font-extrabold uppercase tracking-wider mb-2">
              {isAr ? "الهيكل التشغيلي" : "Operational Structure"}
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
              {t("public.coordination.title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              {t("public.coordination.subtitle")}
            </p>
          </div>
          
          {/* Visual connected grid layout for coordination */}
          <div className="relative p-8 border border-border rounded-3xl bg-surface-primary shadow-sm overflow-hidden">
            {/* Visual background architectural drawing line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t border-dashed border-primary-main/20 -translate-y-1/2 hidden lg:block pointer-events-none" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
              {coordinationTeams.map(({ key, icon: Icon }, idx) => (
                <AnimatedSection key={idx} className="h-full" delay={100 * (idx + 1)}>
                  <Card className="border-border bg-surface-primary hover:border-primary-main hover:-translate-y-1 transition-all duration-300 group shadow-xs h-full w-full min-w-0">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-bg text-primary-main flex items-center justify-center group-hover:bg-primary-main group-hover:text-white transition-colors duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-base text-text-primary group-hover:text-primary-main transition-colors">
                        {t(`public.coordination.roles.${key}`)}
                      </h4>
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        {isAr ? "تنسيق ومتابعة" : "Coordination & Follow-up"}
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <CTASection />
      
    </div>
  );
}
