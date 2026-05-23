/**
 * ============================================================================
 * REPORTS HUB PAGE - Central Reports Dashboard
 * ============================================================================
 *
 * Main landing page for the reports system.
 * Displays module cards for all report modules.
 *
 * @page ReportsHubPage
 * @version 3.0.0
 */

import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  DollarSign,
  Briefcase,
  Package,
  Users,
  Wallet,
  MapPin,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";
import { useLanguage } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermissions";
import {
  REPORT_CATEGORY_PERMISSIONS,
  REPORT_CATEGORY_ROLES,
} from "@/config/reports-access.constants";
import { PageShell } from "@/components/common/PageShell";

type ReportCategory =
  | "finance"
  | "projects"
  | "employees"
  | "payroll"
  | "sites"
  | "assets"
  | "maintenance"
  | "users"
  | "executive";

// Single source of truth for report routes/count per module.
const MODULE_REPORT_ROUTES: Record<ReportCategory, string[]> = {
  finance: [
    "finance/dashboard",
    "finance/pending-overdue",
    "finance/by-project",
    "finance/tax",
  ],
  projects: [
    "projects/dashboard",
    "projects/budget-delays",
    "projects/completed",
    "projects/cost-breakdown",
    "projects/labor-cost",
    "projects/asset-utilization",
  ],
  employees: [
    "employees/dashboard",
    "employees/hr-analytics",
    "employees/assignment",
    "employees/contract-expiry",
  ],
  payroll: [
    "payroll/dashboard",
    "payroll/by-department",
    "payroll/details",
    "payroll/comparison",
  ],
  sites: ["sites/dashboard", "sites/performance", "sites/profitability"],
  assets: ["assets/dashboard", "assets/analytics"],
  maintenance: [
    "maintenance/dashboard",
    "maintenance/analytics",
    "maintenance/mtbf-mttr",
    "maintenance/cost-per-asset",
    "maintenance/budget-vs-actual",
  ],
  users: ["users/security", "users/rbac"],
  executive: ["executive/dashboard", "executive/pnl"],
};

const REPORT_COUNTS: Record<ReportCategory, number> = Object.fromEntries(
  Object.entries(MODULE_REPORT_ROUTES).map(([category, routes]) => [
    category,
    routes.length,
  ]),
) as Record<ReportCategory, number>;

// ============================================================================
// MODULE CARDS CONFIG
// ============================================================================

type ModuleCard = {
  category: ReportCategory;
  icon: React.ReactNode;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  gradient: string;
  iconBg: string;
};

const MODULE_CARDS: ModuleCard[] = [
  {
    category: "finance",
    icon: <DollarSign className="h-6 w-6" />,
    title: "Financial Reports",
    titleAr: "التقارير المالية",
    description: "Dashboard, pending/overdue, and costs by project",
    descriptionAr: "المصروفات، الميزانية، تحليل التدفقات النقدية",
    gradient: "from-[#3b82f6] to-[#1d4ed8]",
    iconBg: "bg-blue-500",
  },
  {
    category: "projects",
    icon: <Briefcase className="h-6 w-6" />,
    title: "Projects Reports",
    titleAr: "تقارير المشاريع",
    description: "Dashboard, budget/delays, completed, cost/labor/assets",
    descriptionAr: "الحالة، الميزانية، الجدول الزمني، الإنجاز",
    gradient: "from-[#8b5cf6] to-[#6d28d9]",
    iconBg: "bg-purple-500",
  },
  {
    category: "employees",
    icon: <Users className="h-6 w-6" />,
    title: "Employees Reports",
    titleAr: "تقارير الموظفين",
    description: "Dashboard, HR analytics, assignment, contract expiry",
    descriptionAr: "الأعداد، دوران العمالة، الأعمار، توزيع الحالات",
    gradient: "from-[#14b8a6] to-[#0f766e]",
    iconBg: "bg-teal-500",
  },
  {
    category: "payroll",
    icon: <Wallet className="h-6 w-6" />,
    title: "Payroll Reports",
    titleAr: "تقارير الرواتب",
    description: "Dashboard, by department, details, and comparison",
    descriptionAr: "صافي الرواتب، البدلات، الخصومات، الاتجاهات، المقارنات",
    gradient: "from-[#f97316] to-[#c2410c]",
    iconBg: "bg-orange-500",
  },
  {
    category: "sites",
    icon: <MapPin className="h-6 w-6" />,
    title: "Sites Reports",
    titleAr: "تقارير المواقع",
    description: "Dashboard, performance, and profitability",
    descriptionAr: "الطاقة الاستيعابية، الحالة، الموقع، المشاريع، والأداء",
    gradient: "from-[#0ea5e9] to-[#0369a1]",
    iconBg: "bg-sky-500",
  },
  {
    category: "assets",
    icon: <Package className="h-6 w-6" />,
    title: "Assets Reports",
    titleAr: "تقارير الأصول",
    description: "Dashboard and analytics",
    descriptionAr: "النوع، الحالة، الموقع، الاستهلاك، الاستخدام",
    gradient: "from-[#f59e0b] to-[#b45309]",
    iconBg: "bg-amber-500",
  },
  {
    category: "maintenance",
    icon: <Wrench className="h-6 w-6" />,
    title: "Maintenance Reports",
    titleAr: "تقارير الصيانة",
    description:
      "Dashboard, analytics, MTBF/MTTR, cost per asset, budget vs actual",
    descriptionAr:
      "نظرة عامة، حسب النوع، الحالة، الأصل، التكلفة، الأداء، الوقائية",
    gradient: "from-[#f43f5e] to-[#be123c]",
    iconBg: "bg-rose-500",
  },
  {
    category: "users",
    icon: <Users className="h-6 w-6" />,
    title: "Users Reports",
    titleAr: "تقارير المستخدمين",
    description: "Security dashboard and RBAC report",
    descriptionAr:
      "نظرة عامة، نشاط الدخول، محاولات فاشلة، الجلسات، الصلاحيات، سجل التدقيق، الحسابات المقفلة، المنح",
    gradient: "from-[#8b5cf6] to-[#6d28d9]",
    iconBg: "bg-violet-500",
  },
  {
    category: "executive",
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Executive Reports",
    titleAr: "التقارير التنفيذية",
    description: "Executive dashboard and company P&L",
    descriptionAr:
      "لوحة مؤشرات متكاملة وتقرير أرباح وخسائر الشركة للإدارة العليا",
    gradient: "from-[#6366f1] to-[#4338ca]",
    iconBg: "bg-indigo-500",
  },
];

// ============================================================================
// CATEGORY PERMISSION MAPPING
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReportsHubPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { can } = usePermissions();

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  const accessibleCards = MODULE_CARDS.filter((card) =>
    can({
      roles: [...REPORT_CATEGORY_ROLES[card.category]],
      permissions: [REPORT_CATEGORY_PERMISSIONS[card.category]],
    }),
  );

  const accessibleReportsCount = accessibleCards.reduce(
    (sum, card) => sum + REPORT_COUNTS[card.category],
    0,
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleModuleClick = (category: ReportCategory) => {
    navigate(`/reports/category/${category}`);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageShell size="wide" density="compact" className="py-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          {isArabic ? "مركز التقارير" : "Reports Hub"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "اختر الموديول للوصول إلى التقارير المتخصصة"
            : "Select a module to access specialized reports"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "الموديولات المتاحة" : "Available Modules"}
                </p>
                <p className="text-3xl font-bold">{accessibleCards.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "التقارير المتاحة" : "Available Reports"}
                </p>
                <p className="text-3xl font-bold">{accessibleReportsCount}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards Grid */}
      {accessibleCards.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {isArabic
              ? "لا توجد تقارير متاحة لحسابك"
              : "No reports available for your account"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isArabic
              ? "تواصل مع المسؤول لطلب الصلاحيات المناسبة"
              : "Contact your administrator to request access"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accessibleCards.map((module) => {
            const count = REPORT_COUNTS[module.category];
            const title = isArabic ? module.titleAr : module.title;
            const description = isArabic
              ? module.descriptionAr
              : module.description;

            return (
              <Card
                key={module.category}
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 hover:border-primary/50"
                onClick={() => handleModuleClick(module.category)}
              >
                <CardHeader className="pb-4">
                  {/* Icon with gradient background */}
                  <div
                    className={`w-14 h-14 rounded-md bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="text-white">{module.icon}</div>
                  </div>

                  {/* Title */}
                  <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                    {title}
                  </CardTitle>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </p>
                </CardHeader>

                <CardContent>
                  {/* Report count and arrow */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={getStatusBadgeClass(
                          "neutral",
                          "font-semibold",
                        )}
                      >
                        {count}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {isArabic ? "تقرير" : "reports"}
                      </span>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground mt-8">
        {isArabic
          ? "اضغط على أي موديول لعرض التقارير المتاحة"
          : "Click on any module to view available reports"}
      </div>
    </PageShell>
  );
}
