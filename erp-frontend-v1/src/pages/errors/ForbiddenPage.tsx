import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldOff, Home, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

/**
 * ForbiddenPage — 403 Access Denied
 *
 * Shown when:
 * 1. ProtectedRoute detects the user lacks required roles/permissions
 * 2. An API call returns 403 (intercepted in axiosConfig)
 *
 * The error message / missing permission can be passed via:
 *   - sessionStorage key "forbidden_message"
 */
export default function ForbiddenPage() {
  const navigate = useNavigate();

  // Read once on mount using lazy state initializer
  const [message] = useState<string | null>(() => {
    const stored = sessionStorage.getItem("forbidden_message");
    if (stored) {
      sessionStorage.removeItem("forbidden_message");
      return stored;
    }
    return null;
  });

  // Try to extract the missing permission from the backend message
  // e.g. "Access denied. Required: permissions: site:read. Missing permissions: site:read"
  const missingPerms = message
    ?.match(/Missing permissions?:\s*([^\n.]+)/i)?.[1]
    ?.trim();
  const requiredPerms = message
    ?.match(/Required:.*?permissions?:\s*([^.]+)/i)?.[1]
    ?.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
      {/* Big icon */}
      <div className="relative mb-6">
        <div className="h-28 w-28 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <ShieldOff className="h-14 w-14 text-red-500" />
        </div>
        <div className="absolute -top-1 -right-1 h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-sm">
          <Lock className="h-4.5 w-4.5 text-orange-500" />
        </div>
      </div>

      {/* Status code */}
      <p className="text-6xl font-extrabold text-red-500/30 dark:text-red-400/20 mb-2 select-none tracking-tight">
        403
      </p>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        ليس لديك صلاحية للوصول
      </h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        تم رفض طلبك لأن حسابك لا يمتلك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
        إذا كنت تعتقد أن ذلك خطأ، تواصل مع مسؤول النظام.
      </p>

      {/* Missing permissions badge */}
      {(missingPerms || requiredPerms) && (
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {(missingPerms ?? requiredPerms ?? "")
            .split(",")
            .map((p: string) => p.trim())
            .filter(Boolean)
            .map((perm: string) => (
              <Badge
                key={perm}
                className={getStatusBadgeClass("danger", "font-mono text-xs")}
              >
                <Lock className="h-3 w-3 mr-1" />
                {perm}
              </Badge>
            ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            الذهاب للرئيسية
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          الرجوع للخلف
        </Button>
      </div>

      {/* Raw message (dev helper, small) */}
      {message && (
        <p className="mt-8 text-xs text-muted-foreground/50 font-mono max-w-md break-words">
          {message}
        </p>
      )}
    </div>
  );
}
