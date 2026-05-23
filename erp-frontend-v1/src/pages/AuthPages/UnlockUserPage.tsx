import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { LockOpen, Loader, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnlockAccount } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

const UnlockUserPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const [userId, setUserId] = useState("");
  const unlockMutation = useUnlockAccount();

  // Authorization check - SUPERADMIN only
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/");
    }
  }, [isSuperAdmin, navigate]);

  // If not authorized, show access denied message
  if (!isSuperAdmin) {
    return (
      <PageShell
        size="narrow"
        density="compact"
        className="flex items-center justify-center min-h-[50vh]"
      >
        <Card className="p-8 max-w-md text-center">
          <ShieldAlert className="size-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">غير مصرح</h2>
          <p className="text-muted-foreground">
            هذه الصفحة متاحة فقط للمسؤول الأعلى (SUPERADMIN)
          </p>
        </Card>
      </PageShell>
    );
  }

  const handleUnlock = () => {
    if (!userId.trim()) {
      alert("Please enter a user ID");
      return;
    }

    if (confirm(`Are you sure you want to unlock this user account?`)) {
      unlockMutation.mutate(userId);
      setUserId("");
    }
  };

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title="Unlock User Account"
        description="Unlock locked user accounts - SUPERADMIN فقط"
        icon={<LockOpen className="size-5" />}
      />

      <Card className="p-6">
        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="Enter user ID to unlock"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <Button
            onClick={handleUnlock}
            disabled={!userId.trim() || unlockMutation.isPending}
            className="w-full"
          >
            {unlockMutation.isPending ? (
              <>
                <Loader className="inline mr-2 animate-spin" size={18} />
                Unlocking...
              </>
            ) : (
              <>
                <LockOpen className="inline mr-2" size={18} />
                Unlock Account
              </>
            )}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
};

export default UnlockUserPage;
