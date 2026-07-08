/**
 * Sign In Page
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n/useTranslation";
import { Eye, EyeOff, LogIn, Mail, Lock, Building2, Home } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLogin } from "@/hooks/useAuth";
import type { LoginFormValues } from "@/types/auth.types";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "auth.login.validation.emailRequired")
    .email("auth.login.validation.emailInvalid"),
  password: z
    .string()
    .min(1, "auth.login.validation.passwordRequired")
    .min(8, "auth.login.validation.passwordMin"),
  rememberMe: z.boolean().optional(),
});

export default function SignIn() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <>
      <PageMeta
        title={t("auth.login.title")}
        description={t("auth.login.subtitle")}
      />

      <AuthLayout>
        <div className="w-full max-w-[520px] px-4 py-2 flex flex-col items-center gap-5 z-10 select-none">
          
          {/* Strong Brand Header above the card */}
          <div className="flex flex-col items-center text-center gap-2 mb-1 w-full">
            <div className="flex items-center justify-center gap-3">
              <div className="rounded-xl bg-primary-main/10 p-2.5 border border-primary-main/20 shadow-xs">
                <Building2 className="h-6 w-6 text-primary-main" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t("auth.login.brandTitle")}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[380px] px-2 font-medium">
              {t("auth.login.brandSubtitle")}
            </p>
          </div>

          {/* Premium Centered Login Card */}
          <Card className="relative w-full border-t-4 border-t-primary-main bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 dark:bg-[#101B2A] dark:border-blue-400/20 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] dark:ring-1 dark:ring-white/5 rounded-2xl overflow-hidden transition-all duration-300 dark:[--input-bg:#0B1220] dark:[--input-border:rgba(148,163,184,0.22)]">
            {/* Subtle glow border for dark mode */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-blue-400/10 dark:block hidden" />
            
            <CardHeader className="space-y-3 pb-2 pt-6 px-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-main/10 bg-primary-main/5 dark:border-primary-light/10 dark:bg-primary-light/5 px-3 py-1 text-xs font-semibold text-primary-main dark:text-primary-light">
                  <span>{t("auth.login.badge")}</span>
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-main dark:text-slate-400 dark:hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>{t("auth.login.backHome")}</span>
                </Link>
              </div>

              <div className="space-y-1 text-start">
                <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t("auth.login.title")}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t("auth.login.subtitle")}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 pt-4 relative z-10">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-[#E5EEF8]">
                          <Mail className="h-4 w-4 text-slate-400 dark:text-[#8EA0B8]" />
                          {t("auth.login.email")}
                        </FormLabel>
                        <FormControl>
                          <div dir="ltr" className="relative w-full">
                            <Input
                              {...field}
                              type="email"
                              placeholder={t("auth.login.emailPlaceholder")}
                              disabled={loginMutation.isPending}
                              className="h-12 w-full text-left pl-4 pr-4 border-slate-200 dark:border-white/10 bg-slate-100 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[3px] focus-visible:ring-blue-500/15 focus-visible:border-blue-500 hover:border-slate-300 dark:bg-[#0B1220] dark:text-[#E5EEF8] dark:placeholder:text-[#8EA0B8] dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/15 transition-all duration-200 rounded-lg [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0px_1000px_#0B1220_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#E5EEF8]"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium" />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-[#E5EEF8]">
                          <Lock className="h-4 w-4 text-slate-400 dark:text-[#8EA0B8]" />
                          {t("auth.login.password")}
                        </FormLabel>
                        <FormControl>
                          <div dir="ltr" className="relative w-full">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder={t("auth.login.passwordPlaceholder")}
                              disabled={loginMutation.isPending}
                              className="h-12 w-full text-left pl-4 pr-11 border-slate-200 dark:border-white/10 bg-slate-100 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[3px] focus-visible:ring-blue-500/15 focus-visible:border-blue-500 hover:border-slate-300 dark:bg-[#0B1220] dark:text-[#E5EEF8] dark:placeholder:text-[#8EA0B8] dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/15 transition-all duration-200 rounded-lg [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0px_1000px_#0B1220_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#E5EEF8]"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-md transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 focus:bg-slate-200/50 dark:focus:bg-slate-800/50 focus:outline-none"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={loginMutation.isPending}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-slate-400 dark:text-[#8EA0B8]" />
                              ) : (
                                <Eye className="h-4 w-4 text-slate-400 dark:text-[#8EA0B8]" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium" />
                      </FormItem>
                    )}
                  />

                  {/* Remember me */}
                  <div className="flex items-center justify-between pt-1">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 rtl:space-x-reverse">
                          <FormControl>
                            <Checkbox
                              id="rememberMe"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor="rememberMe"
                            className="cursor-pointer text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white"
                          >
                            {t("auth.login.rememberMe")}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Error display */}
                  {loginMutation.isError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 dark:border-red-900/30 dark:bg-red-950/20">
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                        {(
                          loginMutation.error as {
                            response?: { data?: { message?: string } };
                          }
                        )?.response?.data?.message ||
                          (loginMutation.error as Error)?.message ||
                          t("auth.login.error")}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-3.5 h-12 w-full rounded-lg bg-primary-main text-white shadow-md transition-all duration-200 hover:bg-primary-dark hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] text-sm font-bold"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent ltr:mr-2 rtl:ml-2" />
                        {t("auth.common.loading")}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <LogIn className="h-4.5 w-4.5" />
                        <span>{t("auth.login.submit")}</span>
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

        </div>
      </AuthLayout>
    </>
  );
}
