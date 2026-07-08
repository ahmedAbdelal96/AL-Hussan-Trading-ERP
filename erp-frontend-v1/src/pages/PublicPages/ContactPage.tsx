import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "@/i18n/useTranslation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AnimatedSection from "@/components/common/AnimatedSection";
import { MapPin, Mail, Phone, Clock, MessageSquare, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form schema (basic validation)
  const contactSchema = z.object({
    fullName: z.string().min(2, "Required"),
    companyName: z.string().min(2, "Required"),
    phone: z.string().min(5, "Required"),
    email: z.string().email("Invalid email"),
    employeeCount: z.string().min(1, "Required"),
    inquiryType: z.string().min(1, "Required"),
    message: z.string().min(10, "Required"),
  });

  type ContactFormValues = z.infer<typeof contactSchema>;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      phone: "",
      email: "",
      employeeCount: "",
      inquiryType: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Form Data Submitted (Frontend Only):", data);
      setIsSubmitting(false);
      setIsSuccess(true);
      form.reset();
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-app text-text-primary">
      {/* Header Banner */}
      <section className="bg-surface border-b border-border py-12">
        <AnimatedSection className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-start" delay={150}>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary-main">
            {t("public.contact.hero.title")}
          </h1>
          <p className="mt-4 text-base text-text-secondary max-w-3xl leading-relaxed">
            {t("public.contact.hero.subtitle")}
          </p>
        </AnimatedSection>
      </section>

      {/* Main Grid Content */}
      <section className="py-12 flex-grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <AnimatedSection className="lg:col-span-8" delay={100}>
              <Card className="border-border shadow-xs bg-surface-primary">
                <CardContent className="p-8">
                  {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                      <CheckCircle2 className="w-16 h-16 text-success" />
                      <h2 className="text-xl font-bold text-text-primary">{t("public.contact.form.successTitle")}</h2>
                      <p className="text-text-secondary text-base">{t("public.contact.form.successMessage")}</p>
                      <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-6">
                        {t("public.contact.form.submitAnother")}
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-start">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Full Name */}
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-text-secondary">
                            {t("public.contact.form.fullName")} <span className="text-error">*</span>
                          </label>
                          <Input {...form.register("fullName")} className="bg-background text-start" placeholder={t("public.contact.form.fullNamePlaceholder")} />
                          {form.formState.errors.fullName && <span className="text-[10px] text-error">{t("public.contact.form.required")}</span>}
                        </div>

                        {/* Company Name */}
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-text-secondary">
                            {t("public.contact.form.company")} <span className="text-error">*</span>
                          </label>
                          <Input {...form.register("companyName")} className="bg-background text-start" placeholder={t("public.contact.form.companyPlaceholder")} />
                          {form.formState.errors.companyName && <span className="text-[10px] text-error">{t("public.contact.form.required")}</span>}
                        </div>

                        {/* Mobile Number */}
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-text-secondary">
                            {t("public.contact.form.phone")} <span className="text-error">*</span>
                          </label>
                          <Input {...form.register("phone")} className="bg-background text-start" dir="ltr" placeholder="+966" />
                          {form.formState.errors.phone && <span className="text-[10px] text-error">{t("public.contact.form.required")}</span>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-text-secondary">
                            {t("public.contact.form.email")} <span className="text-error">*</span>
                          </label>
                          <Input type="email" {...form.register("email")} className="bg-background text-start" dir="ltr" placeholder="example@company.com" />
                          {form.formState.errors.email && (
                            <span className="text-[10px] text-error">
                              {form.formState.errors.email.message === "Invalid email" ? t("public.contact.form.invalidEmail") : t("public.contact.form.required")}
                            </span>
                          )}
                        </div>

                        {/* Number of Employees */}
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-text-secondary">
                            {t("public.contact.form.employeeCount")}
                          </label>
                          <select 
                            {...form.register("employeeCount")}
                            className="flex h-9 w-full rounded border border-border bg-background text-text-primary px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-main"
                          >
                            <option value="">{t("public.contact.form.selectEmployeeCount")}</option>
                            <option value="lessThan50">{t("public.contact.employeeOptions.lessThan50")}</option>
                            <option value="from50To200">{t("public.contact.employeeOptions.from50To200")}</option>
                            <option value="from200To500">{t("public.contact.employeeOptions.from200To500")}</option>
                            <option value="moreThan500">{t("public.contact.employeeOptions.moreThan500")}</option>
                          </select>
                        </div>

                        {/* Inquiry Type */}
                        <div className="space-y-1.5 flex flex-col">
                          <label className="text-xs font-semibold text-text-secondary">
                            {t("public.contact.form.inquiryType")} <span className="text-error">*</span>
                          </label>
                          <select 
                            {...form.register("inquiryType")} 
                            className="flex h-9 w-full rounded border border-border bg-background text-text-primary px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-primary-main"
                          >
                            <option value="">{t("public.contact.form.selectInquiryType")}</option>
                            <option value="demo">{t("public.contact.inquiryOptions.demo")}</option>
                            <option value="system">{t("public.contact.inquiryOptions.system")}</option>
                            <option value="support">{t("public.contact.inquiryOptions.support")}</option>
                            <option value="partnership">{t("public.contact.inquiryOptions.partnership")}</option>
                          </select>
                          {form.formState.errors.inquiryType && <span className="text-[10px] text-error">{t("public.contact.form.required")}</span>}
                        </div>

                      </div>

                      {/* Message */}
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-xs font-semibold text-text-secondary">
                          {t("public.contact.form.message")} <span className="text-error">*</span>
                        </label>
                        <Textarea {...form.register("message")} className="min-h-[120px] bg-background text-start" placeholder={t("public.contact.form.messagePlaceholder")} />
                        {form.formState.errors.message && <span className="text-[10px] text-error">{t("public.contact.form.required")}</span>}
                      </div>

                      {/* Footer submit row */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                        <p className="text-xs text-text-tertiary">
                          {t("public.contact.form.privacyNote")}
                        </p>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-primary-main hover:bg-primary-dark text-white px-8">
                          {isSubmitting ? t("public.contact.form.submitting") : t("public.contact.form.submit")}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* Sidebar Column */}
            <AnimatedSection className="lg:col-span-4 space-y-6 text-start" delay={250}>
              
              {/* Contact Info Card */}
              <Card className="border-border shadow-xs bg-surface-primary">
                <CardContent className="p-6 space-y-6">
                  <h3 className="font-bold text-lg text-primary-main border-b border-border pb-3">
                    {t("public.contact.infoTitle")}
                  </h3>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-main mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-text-primary">
                        {t("public.contact.info.addressTitle")}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        {t("public.contact.info.addressValue")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary-main mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-text-primary">
                        {t("public.contact.info.emailTitle")}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1" dir="ltr">
                        {t("public.contact.info.emailValue")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary-main mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-text-primary">
                        {t("public.contact.info.phoneTitle")}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1" dir="ltr">
                        {t("public.contact.info.phoneValue")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary-main mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-text-primary">
                        {t("public.contact.info.hoursTitle")}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        {t("public.contact.info.hoursValue")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Promo Card */}
              <Card className="border-primary/20 bg-primary-bg/10 dark:bg-primary-bg/20 p-6 text-center space-y-4 shadow-sm">
                <div className="mx-auto w-12 h-12 bg-white dark:bg-surface-secondary rounded-full flex items-center justify-center text-primary-main shadow-xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-primary-main">{t("public.contact.customSystem.title")}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{t("public.contact.customSystem.text")}</p>
                <Button asChild size="sm" className="w-full bg-primary-main hover:bg-primary-dark text-white">
                  <Link to="/contact">{t("public.contact.customSystem.btn")}</Link>
                </Button>
              </Card>
            </AnimatedSection>

          </div>
        </div>
      </section>
    </div>
  );
}
