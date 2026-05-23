/**
 * Sign In Page
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/i18n/useTranslation";
import { Eye, EyeOff, LogIn, Mail, Lock, Shield, Sparkles } from "lucide-react";
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
import { HelpSteps } from "@/components/common/HelpSteps";
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
        <div className="flex w-full items-center justify-center p-4 py-10 sm:p-8 lg:w-1/2 lg:py-12">
          <div className="w-full max-w-lg">
            <Card className="border border-[var(--border)] bg-[var(--surface)] shadow-xl">
              <CardHeader className="space-y-4 pb-6 pt-8">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary-main" />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {t("auth.login.enterprise.badge")}
                    </span>
                  </div>
                  <Shield className="h-5 w-5 text-primary-main" />
                </div>

                <div className="space-y-1.5">
                  <CardTitle className="text-3xl font-bold text-[var(--text-primary)]">
                    {t("auth.login.title")}
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--text-secondary)] sm:text-base">
                    {t("auth.login.subtitle")}
                  </CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-2 text-center text-xs">
                  <div className="rounded-lg bg-[var(--surface)] px-2 py-2 font-medium text-[var(--text-secondary)]">
                    {t("auth.login.enterprise.tagSecure")}
                  </div>
                  <div className="rounded-lg bg-[var(--surface)] px-2 py-2 font-medium text-[var(--text-secondary)]">
                    {t("auth.login.enterprise.tagAudited")}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-8 sm:px-8">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                            <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
                            {t("auth.login.email")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder={t("auth.login.emailPlaceholder")}
                              disabled={loginMutation.isPending}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage className="mt-1.5 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                            <Lock className="h-4 w-4 text-[var(--text-tertiary)]" />
                            {t("auth.login.password")}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder={t(
                                  "auth.login.passwordPlaceholder",
                                )}
                                disabled={loginMutation.isPending}
                                className="h-11 pr-11 rtl:pr-3 rtl:pl-11"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-9 w-9 rounded-md transition-colors hover:bg-surface-hover rtl:right-auto rtl:left-1"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loginMutation.isPending}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="mt-1.5 text-xs" />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center pt-1">
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
                              className="cursor-pointer text-sm font-normal text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                            >
                              {t("auth.login.rememberMe")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    {loginMutation.isError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                        <p className="text-sm text-red-700 dark:text-red-400">
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

                    <Button
                      type="submit"
                      size="lg"
                      className="mt-2 h-11 w-full rounded-lg bg-primary-main text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <div className="flex items-center justify-center">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent ltr:mr-2 rtl:ml-2" />
                          {t("auth.common.loading")}
                        </div>
                      ) : (
                        <>
                          <LogIn className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
                          {t("auth.login.submit")}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="mt-5">
              <HelpSteps
                title={t("auth.login.helpSteps.title")}
                steps={[
                  t("auth.login.helpSteps.step1"),
                  t("auth.login.helpSteps.step2"),
                  t("auth.login.helpSteps.step3"),
                  t("auth.login.helpSteps.step4"),
                  t("auth.login.helpSteps.step5"),
                ]}
                collapsible={true}
                defaultOpen={false}
                compact={true}
              />
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
