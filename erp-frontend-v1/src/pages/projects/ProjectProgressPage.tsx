/**
 * Project Progress Page
 *
 * Displays detailed progress tracking for a specific project including:
 * - Overall completion percentage
 * - Timeline visualization
 * - Task completion status
 * - Budget vs actual spending
 * - Team productivity metrics
 * - Recent activities and updates
 *
 * @page ProjectProgressPage
 */

import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Users, DollarSign, CheckCircle2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PageShell } from "@/components/common/PageShell";
import { useProject, useUpdateProjectProgress } from "@/hooks/useProjects";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions.constants";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import { canUpdateProjectProgress } from "@/types/projects.types";

/**
 * ProjectProgressPage Component
 */
export const ProjectProgressPage = () => {
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { id } = useParams<{ id: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const canUpdateProgress = hasPermission(PERMISSIONS.PROJECT_WRITE);

  // Progress update form schema
  const progressUpdateSchema = z.object({
    completionPercentage: z
      .number()
      .min(0, t("projects.progress.validation.minPercentage"))
      .max(100, t("projects.progress.validation.maxPercentage")),
    progressNotes: z.string().optional(),
  });

  type ProgressUpdateFormValues = z.infer<typeof progressUpdateSchema>;

  // Fetch project data
  const {
    data: project,
    isLoading,
    error,
  } = useProject(id || "", { enabled: !!id });
  // Update mutation
  const updateMutation = useUpdateProjectProgress();

  // Form for progress update
  const form = useForm<ProgressUpdateFormValues>({
    resolver: zodResolver(progressUpdateSchema),
    defaultValues: {
      completionPercentage: project?.completionPercentage || 0,
      progressNotes: project?.progressNotes || "",
    },
  });

  // Update form when project data loads
  useEffect(() => {
    if (!project) return;
    form.reset({
      completionPercentage: project.completionPercentage || 0,
      progressNotes: project.progressNotes || "",
    });
  }, [project?.completionPercentage, project?.progressNotes, form]);

  // Handle progress update
  const handleProgressUpdate = async (values: ProgressUpdateFormValues) => {
    if (
      !id ||
      !project ||
      !canUpdateProgress ||
      !canUpdateProjectProgress(project.status)
    ) {
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          completionPercentage: values.completionPercentage,
          progressNotes: values.progressNotes,
        },
      });
      setIsDialogOpen(false);
    } catch (error) {}
  };

  // Loading state
  if (isLoading) {
    return (
      <PageShell
        size="wide"
        density="compact"
        className="flex items-center justify-center min-h-screen"
      >
        <LoadingSpinner />
      </PageShell>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <PageShell size="narrow" density="compact">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4">
          <p className="font-semibold">{t("projects.list.error")}</p>
          <p className="text-sm mt-1">
            {(error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || t("projects.list.error")}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/projects")}
          >
            {t("projects.actions.back")}
          </Button>
        </div>
      </PageShell>
    );
  }

  // Get completion percentage from project data (handle null, undefined, and 0)
  const completionPercentage =
    project?.completionPercentage !== null &&
    project?.completionPercentage !== undefined
      ? project.completionPercentage
      : 0;
  const canEditProgress =
    !!project &&
    canUpdateProgress &&
    canUpdateProjectProgress(project.status);

  return (
    <PageShell size="wide" density="compact">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("projects.progress.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{project.name}</p>
        </div>

        {/* Update Progress Button */}
        {canEditProgress && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                {t("projects.progress.updateProgress")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {t("projects.progress.updateProgress")}
                </DialogTitle>
                <DialogDescription>
                  {t("projects.progress.updateDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleProgressUpdate)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="completionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("projects.fields.completionPercentage")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="progressNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("projects.fields.progressNotes")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder={t(
                              "projects.progress.notesPlaceholder",
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending
                        ? t("common.saving")
                        : t("common.save")}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.progress.overallProgress")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("projects.progress.completion")}
              </span>
              <span className="text-2xl font-bold">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>

          {/* Last Update Info */}
          {project.lastProgressUpdate && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {t("projects.fields.lastProgressUpdate")}:{" "}
                {new Date(project.lastProgressUpdate).toLocaleString(
                  language === "ar" ? "ar-SA" : "en-US",
                )}
              </p>
            </div>
          )}

          {/* Progress Notes */}
          {project.progressNotes && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">
                {t("projects.fields.progressNotes")}
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.progressNotes}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("projects.fields.status")}
                </p>
                <Badge
                  className={getStatusBadgeClass(getStatusTone(project.status))}
                >
                  {t(`projects.status.${project.status}`)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("projects.fields.budget")}
                </p>
                <p className="text-lg font-semibold">
                  {project.budget
                    ? `${project.budget.toLocaleString()} ${t("common.currency")}`
                    : t("common.notAvailable")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("projects.progress.teamSize")}
                </p>
                <p className="text-lg font-semibold">
                  {project.employeeCount ?? 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("projects.progress.tasksCompleted")}
                </p>
                <p className="text-lg font-semibold">
                  {/* TODO: Get actual tasks data from backend */}
                  {t("common.notAvailable")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.progress.timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.plannedStartDate && (
              <div className="flex justify-between items-center p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded">
                <div>
                  <p className="font-medium">
                    {t("projects.fields.plannedStartDate")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.plannedStartDate).toLocaleDateString(
                      language === "ar" ? "ar-SA" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            )}

            {project.actualStartDate && (
              <div className="flex justify-between items-center p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 rounded">
                <div>
                  <p className="font-medium">
                    {t("projects.fields.actualStartDate")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.actualStartDate).toLocaleDateString(
                      language === "ar" ? "ar-SA" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            )}

            {project.plannedEndDate && (
              <div className="flex justify-between items-center p-3 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20 rounded">
                <div>
                  <p className="font-medium">
                    {t("projects.fields.plannedEndDate")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.plannedEndDate).toLocaleDateString(
                      language === "ar" ? "ar-SA" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            )}

            {project.actualEndDate && (
              <div className="flex justify-between items-center p-3 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20 rounded">
                <div>
                  <p className="font-medium">
                    {t("projects.fields.actualEndDate")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.actualEndDate).toLocaleDateString(
                      language === "ar" ? "ar-SA" : "en-US",
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future sections */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.progress.upcomingFeatures")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li>• {t("projects.progress.taskManagement")}</li>
            <li>• {t("projects.progress.milestoneTracking")}</li>
            <li>• {t("projects.progress.budgetTracking")}</li>
            <li>• {t("projects.progress.teamActivity")}</li>
            <li>• {t("projects.progress.riskAssessment")}</li>
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
};
