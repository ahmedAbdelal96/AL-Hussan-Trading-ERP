/**
 * Quick Site Status Change Dialog
 *
 * Allows quickly changing site operational status without opening full edit form.
 * Pattern mirrors the employee QuickStatusChangeDialog.
 */

import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useUpdateSite } from "@/hooks/useSites";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { SiteStatus } from "@/types/sites.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";

interface QuickSiteStatusChangeDialogProps {
  siteId: string;
  siteName: string;
  currentStatus: SiteStatus;
  rowVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickSiteStatusChangeDialog = ({
  siteId,
  siteName,
  currentStatus,
  rowVersion,
  open,
  onOpenChange,
}: QuickSiteStatusChangeDialogProps) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateSite();
  const [newStatus, setNewStatus] = useState<SiteStatus>(currentStatus);

  const statusOptions = Object.values(SiteStatus);

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        id: siteId,
        data: { status: newStatus, rowVersion },
      });
      onOpenChange(false);
    } catch {
      // toast shown by mutation hook
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) setNewStatus(currentStatus); // reset on close
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {t("sites.quickActions.changeStatus.title", {
              defaultValue: "تغيير حالة الموقع",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("sites.quickActions.changeStatus.description", {
              defaultValue: `الموقع: ${siteName}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>
              {t("sites.quickActions.changeStatus.currentStatus", {
                defaultValue: "الحالة الحالية",
              })}
            </Label>
            <div>
              <Badge className={getStatusBadgeClass(getStatusTone(currentStatus))}>
                {t(`sites.status.${currentStatus}`)}
              </Badge>
            </div>
          </div>

          {/* New Status */}
          <div className="space-y-2">
            <Label htmlFor="site-status">
              {t("sites.quickActions.changeStatus.newStatus", {
                defaultValue: "الحالة الجديدة",
              })}
            </Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as SiteStatus)}
            >
              <SelectTrigger id="site-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`sites.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending || newStatus === currentStatus}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />
                {t("common.saving")}
              </>
            ) : (
              t("common.save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
