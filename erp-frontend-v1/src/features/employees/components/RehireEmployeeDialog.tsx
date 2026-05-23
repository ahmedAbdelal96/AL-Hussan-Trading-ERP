import { useState } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRehireEmployee } from "@/hooks/useEmployees";
import { useActiveDepartments } from "@/hooks/useDepartments";
import { useActivePositions } from "@/hooks/usePositions";
import type { EmployeeEntity } from "@/types/employees.types";
import { parseMoneyInput } from "@/lib/money";

interface RehireEmployeeDialogProps {
  employee: EmployeeEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RehireEmployeeDialog({
  employee,
  open,
  onOpenChange,
}: RehireEmployeeDialogProps) {
  const { t } = useTranslation();
  const rehireMutation = useRehireEmployee();

  const today = new Date().toISOString().split("T")[0];
  const [rehireDate, setRehireDate] = useState(today);
  const [rehireReason, setRehireReason] = useState("");
  const [baseSalary, setBaseSalary] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>(
    employee.departmentId ?? "",
  );
  const [positionId, setPositionId] = useState<string>(
    employee.positionId ?? "",
  );

  const { data: departments = [] } = useActiveDepartments();
  const { data: positions = [] } = useActivePositions(
    departmentId || undefined,
  );

  const handleSubmit = async () => {
    await rehireMutation.mutateAsync({
      id: employee.id,
      data: {
        rehireDate,
        rehireReason: rehireReason.trim() || undefined,
        baseSalary: baseSalary ? parseMoneyInput(baseSalary) : undefined,
        departmentId: departmentId || undefined,
        positionId: positionId || undefined,
      },
    });
    onOpenChange(false);
    // Reset
    setRehireReason("");
    setBaseSalary("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            {t("employees.rehire.title", {
              defaultValue: "إعادة توظيف الموظف",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("employees.rehire.description", {
              defaultValue: `إعادة توظيف ${employee.fullName} وتفعيل حسابه من جديد`,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Rehire Date */}
          <div className="space-y-1.5">
            <Label htmlFor="rehireDate">
              {t("employees.rehire.fields.rehireDate", {
                defaultValue: "تاريخ إعادة التوظيف *",
              })}
            </Label>
            <Input
              id="rehireDate"
              type="date"
              value={rehireDate}
              onChange={(e) => setRehireDate(e.target.value)}
              required
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <Label>
              {t("employees.fields.department", { defaultValue: "القسم" })}
            </Label>
            <Select
              value={departmentId}
              onValueChange={(val) => {
                setDepartmentId(val);
                setPositionId("");
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("employees.rehire.keepExisting", {
                    defaultValue: "الاحتفاظ بالقسم الحالي",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nameAr ?? d.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label>
              {t("employees.fields.position", {
                defaultValue: "المسمى الوظيفي",
              })}
            </Label>
            <Select
              value={positionId}
              onValueChange={setPositionId}
              disabled={!departmentId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("employees.rehire.keepExisting", {
                    defaultValue: "الاحتفاظ بالمسمى الحالي",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nameAr ?? p.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Base Salary */}
          <div className="space-y-1.5">
            <Label htmlFor="baseSalary">
              {t("employees.rehire.fields.baseSalary", {
                defaultValue: "الراتب الجديد (اختياري)",
              })}
            </Label>
            <Input
              id="baseSalary"
              type="number"
              min={0}
              step={0.01}
              placeholder={`${employee.baseSalary ?? 0}`}
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            />
          </div>

          {/* Rehire Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="rehireReason">
              {t("employees.rehire.fields.reason", {
                defaultValue: "سبب إعادة التوظيف (اختياري)",
              })}
            </Label>
            <Textarea
              id="rehireReason"
              rows={2}
              placeholder={t("employees.rehire.fields.reasonPlaceholder", {
                defaultValue: "مشروع جديد، تغيير في الاحتياجات...",
              })}
              value={rehireReason}
              onChange={(e) => setRehireReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={rehireMutation.isPending}
          >
            {t("common.cancel", { defaultValue: "إلغاء" })}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!rehireDate || rehireMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {rehireMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <UserCheck className="mr-2 h-4 w-4" />
            {t("employees.rehire.confirm", {
              defaultValue: "تأكيد إعادة التوظيف",
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
