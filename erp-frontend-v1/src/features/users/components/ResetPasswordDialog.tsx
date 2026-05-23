import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Key, AlertCircle } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useResetUserPassword } from "@/hooks/useAuth";
import type { UserEntity } from "@/types/users.types";
import type { ResetUserPasswordFormValues } from "@/types/auth.types";

// Validation Schema
const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, "auth.resetUserPassword.validation.newPasswordRequired")
      .min(8, "auth.resetUserPassword.validation.newPasswordMin")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "auth.resetUserPassword.validation.newPasswordStrong",
      ),
    confirmPassword: z
      .string()
      .min(1, "auth.resetUserPassword.validation.confirmPasswordRequired"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "auth.resetUserPassword.validation.passwordsNotMatch",
    path: ["confirmPassword"],
  });

interface ResetPasswordDialogProps {
  user: UserEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResetPasswordDialog = ({
  user,
  open,
  onOpenChange,
}: ResetPasswordDialogProps) => {
  const { t } = useTranslation();
  const resetPasswordMutation = useResetUserPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetUserPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: ResetUserPasswordFormValues) => {
    try {
      await resetPasswordMutation.mutateAsync({
        userId: user.id,
        passwordData: values,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by the hook
      console.error("Reset password error:", error);
    }
  };

  const getUserFullName = () => `${user.firstName} ${user.lastName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              {t("auth.resetUserPassword.title", {
                defaultValue: "إعادة تعيين كلمة المرور",
              })}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {t("auth.resetUserPassword.description", {
              user: getUserFullName(),
              email: user.email,
              defaultValue: `إعادة تعيين كلمة المرور للمستخدم: ${getUserFullName()}`,
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Info Alert */}
        <Alert className="border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            {t("auth.resetUserPassword.info", {
              defaultValue:
                "سيتم إلغاء جميع جلسات المستخدم النشطة وسيحتاج لتسجيل الدخول مرة أخرى",
            })}
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* New Password */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("auth.resetUserPassword.newPassword", {
                      defaultValue: "كلمة المرور الجديدة",
                    })}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder={t(
                          "auth.resetUserPassword.newPasswordPlaceholder",
                          {
                            defaultValue: "أدخل كلمة المرور الجديدة",
                          },
                        )}
                        disabled={resetPasswordMutation.isPending}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    {t("auth.resetUserPassword.passwordRequirements", {
                      defaultValue:
                        "8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، رمز خاص",
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("auth.resetUserPassword.confirmPassword", {
                      defaultValue: "تأكيد كلمة المرور",
                    })}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t(
                          "auth.resetUserPassword.confirmPasswordPlaceholder",
                          {
                            defaultValue: "أعد إدخال كلمة المرور",
                          },
                        )}
                        disabled={resetPasswordMutation.isPending}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={resetPasswordMutation.isPending}
              >
                {t("common.cancel", { defaultValue: "إلغاء" })}
              </Button>
              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="gap-2"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("common.saving", { defaultValue: "جاري الحفظ..." })}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    {t("auth.resetUserPassword.submit", {
                      defaultValue: "إعادة تعيين",
                    })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
