import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Assume these icons are imported from an icon library
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PlugInIcon,
} from "@/components/icons";
import {
  ShieldCheck,
  DollarSign,
  Package,
  Wrench,
  FileBarChart,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/context/SidebarContext";
import { useLanguage } from "@/store/languageStore";
import { translations } from "@/i18n/translations";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS, SYSTEM_ROLES } from "@/config/permissions.constants";
import { REPORT_CATEGORY_PERMISSIONS } from "@/config/reports-access.constants";

type NavItem = {
  name: string;
  nameKey: keyof typeof translations.ar.sidebar;
  icon: React.ReactNode;
  path?: string;
  roles?: string[]; // Required role(s) to see this item (ANY role)
  permissions?: string[]; // Required permission(s) to see this item (ALL permissions)
  subItems?: {
    name: string;
    nameKey: keyof typeof translations.ar.sidebar | string; // Allow string for dividers
    path: string;
    pro?: boolean;
    new?: boolean;
    roles?: string[]; // Required role(s) to see this subitem (ANY)
    permissions?: string[]; // Required permission(s) to see this subitem (ALL)
    isDivider?: boolean; // Mark as divider element
  }[];
};

const operationsItems: NavItem[] = [
  // ========== DASHBOARD ==========
  {
    icon: <GridIcon />,
    name: "Dashboard",
    nameKey: "dashboard",
    subItems: [
      { name: "Home Page", nameKey: "homePage", path: "/", pro: false },
    ],
  },

  // ========== EMPLOYEES MODULE ==========
  {
    name: "Employees",
    nameKey: "employees",
    icon: <User className="h-4 w-4" />,
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.HR_MANAGER,
      SYSTEM_ROLES.HR_STAFF,
    ],
    permissions: [PERMISSIONS.EMPLOYEE_READ],
    subItems: [
      {
        name: "Dashboard",
        nameKey: "employeesDashboard",
        path: "/employees/dashboard",
        permissions: [PERMISSIONS.EMPLOYEE_READ],
      },
      {
        name: "Employees List",
        nameKey: "employeesList",
        path: "/employees",
        permissions: [PERMISSIONS.EMPLOYEE_READ],
      },
    ],
  },

  // ========== SITES MODULE ==========
  {
    name: "Sites",
    nameKey: "sites",
    icon: <ShieldCheck className="h-4 w-4" />,
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.OPS_MANAGER,
      SYSTEM_ROLES.OPS_STAFF,
    ],
    permissions: [PERMISSIONS.SITE_READ],
    subItems: [
      {
        name: "Sites Dashboard",
        nameKey: "sitesDashboard",
        path: "/sites/dashboard",
        permissions: [PERMISSIONS.SITE_READ],
      },
      {
        name: "Sites List",
        nameKey: "sites",
        path: "/sites",
        permissions: [PERMISSIONS.SITE_READ],
      },
      {
        name: "Deleted Sites",
        nameKey: "deletedSites",
        path: "/sites/deleted",
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.OPS_MANAGER,
        ],
        permissions: [PERMISSIONS.SITE_DELETE],
      },
    ],
  },

  // ========== PROJECTS MODULE ==========
  {
    name: "Projects",
    nameKey: "projects",
    icon: <ShieldCheck className="h-4 w-4" />,
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.OPS_MANAGER,
      SYSTEM_ROLES.OPS_STAFF,
    ],
    subItems: [
      {
        name: "Dashboard",
        nameKey: "projectsDashboard",
        path: "/projects/dashboard",
        permissions: [PERMISSIONS.PROJECT_READ],
      },
      {
        name: "Projects List",
        nameKey: "projectsList",
        path: "/projects",
        permissions: [PERMISSIONS.PROJECT_READ],
      },
    ],
    permissions: [PERMISSIONS.PROJECT_READ],
  },

  // ========== ASSETS MODULE ==========
  {
    icon: <Package className="h-4 w-4" />,
    name: "Assets",
    nameKey: "assets",
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.OPS_MANAGER,
      SYSTEM_ROLES.OPS_STAFF,
    ],
    subItems: [
      {
        name: "Dashboard",
        nameKey: "assetsDashboard",
        path: "/assets/dashboard",
        permissions: [PERMISSIONS.ASSET_READ],
      },
      {
        name: "Assets List",
        nameKey: "assetsList",
        path: "/assets",
        permissions: [PERMISSIONS.ASSET_READ],
      },
    ],
    permissions: [PERMISSIONS.ASSET_READ],
  },

  // ========== MAINTENANCE MODULE ==========
  {
    icon: <Wrench className="h-4 w-4" />,
    name: "Maintenance",
    nameKey: "maintenance",
    subItems: [
      {
        name: "Dashboard",
        nameKey: "maintenanceDashboard",
        path: "/maintenance/dashboard",
        permissions: [PERMISSIONS.MAINTENANCE_READ],
      },
      {
        name: "Maintenance List",
        nameKey: "maintenanceList",
        path: "/maintenance",
        permissions: [PERMISSIONS.MAINTENANCE_READ],
      },
    ],
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.OPS_MANAGER,
      SYSTEM_ROLES.OPS_STAFF,
    ],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
  },

  // ========== USER PROFILE ==========
  {
    icon: <User className="h-4 w-4" />,
    name: "My Profile",
    nameKey: "myProfile",
    path: "/profile",
  },
];

const financeItems: NavItem[] = [
  // ========== FINANCE MODULE ==========
  {
    icon: <DollarSign className="h-4 w-4" />,
    name: "Finance",
    nameKey: "finance",
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.FIN_MANAGER,
      SYSTEM_ROLES.FIN_STAFF,
    ],
    permissions: [PERMISSIONS.FINANCE_READ],
    subItems: [
      {
        name: "Dashboard",
        nameKey: "financeDashboard",
        path: "/finance",
        permissions: [PERMISSIONS.FINANCE_READ],
      },
      {
        name: "Cost Categories",
        nameKey: "costCategories",
        path: "/finance/categories",
        permissions: [PERMISSIONS.FINANCE_READ],
      },
      {
        name: "Costs",
        nameKey: "costs",
        path: "/finance/costs",
        permissions: [PERMISSIONS.FINANCE_READ],
      },
      {
        name: "Allocated Costs",
        nameKey: "allocatedCosts",
        path: "/finance/allocated-costs",
        permissions: [PERMISSIONS.FINANCE_READ],
      },
      {
        name: "Approvals",
        nameKey: "approvals",
        path: "/finance/approvals",
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.FIN_MANAGER,
        ],
        permissions: [PERMISSIONS.FINANCE_APPROVE],
      },
    ],
  },

  // ========== PAYROLL MODULE ==========
  {
    icon: <DollarSign className="h-4 w-4" />,
    name: "Payroll",
    nameKey: "payroll",
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.HR_MANAGER,
      SYSTEM_ROLES.HR_STAFF,
    ],
    permissions: [PERMISSIONS.PAYROLL_READ],
    subItems: [
      {
        name: "Dashboard",
        nameKey: "payrollDashboard",
        path: "/payroll",
        pro: false,
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ],
        permissions: [PERMISSIONS.PAYROLL_READ],
      },
      {
        name: "Allowance Types",
        nameKey: "allowanceTypes",
        path: "/payroll/allowance-types",
        pro: false,
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ],
        permissions: [PERMISSIONS.PAYROLL_READ],
      },
      { name: "divider", nameKey: "divider1", path: "", isDivider: true },
      {
        name: "Employee Allowances",
        nameKey: "employeeAllowances",
        path: "/payroll/allowances",
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ],
        permissions: [PERMISSIONS.PAYROLL_READ],
      },
      {
        name: "Loans",
        nameKey: "employeeLoans",
        path: "/payroll/loans",
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ],
        permissions: [PERMISSIONS.PAYROLL_READ],
      },
      {
        name: "Deductions",
        nameKey: "employeeDeductions",
        path: "/payroll/deductions",
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.ADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ],
        permissions: [PERMISSIONS.PAYROLL_READ],
      },
      { name: "divider", nameKey: "divider2", path: "", isDivider: true },
      {
        name: "Payroll Processing",
        nameKey: "payrollProcessing",
        path: "/payroll/process",
        permissions: [PERMISSIONS.PAYROLL_PROCESS],
      },
      {
        name: "Payslips",
        nameKey: "payslips",
        path: "/payroll/payslips",
        pro: false,
        roles: [
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.HR_MANAGER,
          SYSTEM_ROLES.FIN_MANAGER,
          SYSTEM_ROLES.HR_STAFF,
        ],
        permissions: [PERMISSIONS.PAYROLL_READ],
      },
    ],
  },
];

const reportsItems: NavItem[] = [
  // ========== REPORTS MODULE ==========
  {
    icon: <FileBarChart className="h-4 w-4" />,
    name: "Reports",
    nameKey: "reportsHub",
    roles: [
      SYSTEM_ROLES.SUPERADMIN,
      SYSTEM_ROLES.ADMIN,
      SYSTEM_ROLES.FIN_MANAGER,
      SYSTEM_ROLES.HR_MANAGER,
      SYSTEM_ROLES.OPS_MANAGER,
    ],
    permissions: [PERMISSIONS.REPORT_READ],
    subItems: [
      {
        name: "Reports Center",
        nameKey: "reportsCenter",
        path: "/reports",
        permissions: [PERMISSIONS.REPORT_READ],
      },
      {
        name: "Finance Reports",
        nameKey: "financeReports",
        path: "/reports/category/finance",
        permissions: [REPORT_CATEGORY_PERMISSIONS.finance],
      },
      {
        name: "Projects Reports",
        nameKey: "projectsReports",
        path: "/reports/category/projects",
        permissions: [REPORT_CATEGORY_PERMISSIONS.projects],
      },
      {
        name: "Employees Reports",
        nameKey: "employeesReports",
        path: "/reports/category/employees",
        permissions: [REPORT_CATEGORY_PERMISSIONS.employees],
      },
      {
        name: "Payroll Reports",
        nameKey: "payrollReports",
        path: "/reports/category/payroll",
        permissions: [REPORT_CATEGORY_PERMISSIONS.payroll],
      },
      {
        name: "Assets Reports",
        nameKey: "assetsReports",
        path: "/reports/category/assets",
        permissions: [REPORT_CATEGORY_PERMISSIONS.assets],
      },
      {
        name: "Maintenance Reports",
        nameKey: "maintenanceReports",
        path: "/reports/category/maintenance",
        permissions: [REPORT_CATEGORY_PERMISSIONS.maintenance],
      },
      {
        name: "Sites Reports",
        nameKey: "sitesReports",
        path: "/reports/category/sites",
        permissions: [REPORT_CATEGORY_PERMISSIONS.sites],
      },
      {
        name: "Users Reports",
        nameKey: "usersReports",
        path: "/reports/category/users",
        roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN],
        permissions: [REPORT_CATEGORY_PERMISSIONS.users],
      },
      {
        name: "Executive Reports",
        nameKey: "executiveReports",
        path: "/reports/category/executive",
        roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN],
        permissions: [REPORT_CATEGORY_PERMISSIONS.executive],
      },
    ],
  },
];

const adminItems: NavItem[] = [
  // ========== USERS MANAGEMENT ==========
  {
    name: "Users",
    nameKey: "users",
    icon: <ShieldCheck className="h-4 w-4" />,
    path: "/users",
    roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN, SYSTEM_ROLES.ADMIN],
    permissions: [PERMISSIONS.USER_READ],
    subItems: [
      {
        name: "All Users",
        nameKey: "allUsers",
        path: "/users",
        permissions: [PERMISSIONS.USER_READ],
      },
      {
        name: "Deleted Users",
        nameKey: "deletedUsers",
        path: "/users/deleted",
        roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN],
      },
    ],
  },

  // ========== SYSTEM ADMINISTRATION ==========
  {
    icon: <PlugInIcon />,
    name: "System Administration",
    nameKey: "systemAdministration",
    roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN, SYSTEM_ROLES.ADMIN],
    permissions: [PERMISSIONS.SETTINGS_READ],
    subItems: [
      // System Dashboard - All-in-one management
      {
        name: "System Dashboard",
        nameKey: "sessionsAndUsers",
        path: "/admin/dashboard",
        roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN],
      },
      // Audit Logs - Activity tracking
      {
        name: "Audit Logs",
        nameKey: "auditLogs",
        path: "/admin/audit-logs",
        roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.ADMIN],
      },
      // Divider
      { name: "divider", nameKey: "divider1", path: "", isDivider: true },
      // RBAC Management
      {
        name: "User Access Control",
        nameKey: "userAccessControl",
        path: "/rbac",
        pro: false,
        roles: [SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN],
      },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isRTL, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { can } = usePermissions();

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/signin");
  }, [logout, navigate]);

  const t = translations[language].sidebar;

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "finance" | "reports" | "admin";
    index: number;
  } | null>(() => {
    const savedSubmenu = localStorage.getItem("openSubmenu");
    if (savedSubmenu) {
      try {
        return JSON.parse(savedSubmenu);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    if (openSubmenu) {
      localStorage.setItem("openSubmenu", JSON.stringify(openSubmenu));
    } else {
      localStorage.removeItem("openSubmenu");
    }
  }, [openSubmenu]);

  useEffect(() => {
    let submenuMatched = false;
    const currentPath = location.pathname;

    const groupMap: [string, NavItem[]][] = [
      ["main", operationsItems],
      ["finance", financeItems],
      ["reports", reportsItems],
      ["admin", adminItems],
    ];
    groupMap.forEach(([menuType, items]) => {
      items.forEach((nav, index) => {
        if (nav.subItems) {
          const hasExactMatch = nav.subItems.some(
            (subItem) => !subItem.isDivider && isActive(subItem.path),
          );

          if (hasExactMatch) {
            setOpenSubmenu({
              type: menuType as "main" | "finance" | "reports" | "admin",
              index,
            });
            submenuMatched = true;
            return;
          }

          const hasPartialMatch = nav.subItems.some((subItem) => {
            if (subItem.isDivider) return false;
            const basePath = subItem.path.split("/").slice(0, 2).join("/"); // Example: /projects
            return (
              currentPath.startsWith(basePath + "/") || currentPath === basePath
            );
          });

          if (hasPartialMatch) {
            setOpenSubmenu({
              type: menuType as "main" | "finance" | "reports" | "admin",
              index,
            });
            submenuMatched = true;
          }
        }
      });
    });

    if (!submenuMatched) {
      setTimeout(() => setOpenSubmenu(null), 0);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "finance" | "reports" | "admin",
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "finance" | "reports" | "admin",
  ) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        // ===== AUTHORIZATION CHECK (OR Logic) =====
        // User needs ANY role OR ALL permissions
        const canViewItem = can({
          roles: nav.roles,
          permissions: nav.permissions,
        });

        if (!canViewItem) {
          return null; // Hide item if user doesn't have access
        }

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{t[nav.nameKey]}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ms-auto h-5 w-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-[var(--accent-primary-foreground)]"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{t[nav.nameKey]}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className={`mt-1 space-y-0.5 ${isRTL ? "mr-8" : "ml-8"}`}>
                  {nav.subItems.map((subItem, subIndex) => {
                    // Check if this is a divider
                    if (subItem.isDivider) {
                      return (
                        <li key={`divider-${subIndex}`} className="py-2">
                          <div className="border-t border-[var(--border)]"></div>
                        </li>
                      );
                    }

                    // ===== AUTHORIZATION CHECK FOR SUBITEMS =====
                    const canViewSubItem = can({
                      roles: subItem.roles,
                      permissions: subItem.permissions,
                    });

                    if (!canViewSubItem) {
                      return null; // Hide subitem if user doesn't have access
                    }

                    return (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {typeof subItem.nameKey === "string" &&
                          subItem.nameKey in t
                            ? t[subItem.nameKey as keyof typeof t]
                            : subItem.name}
                          <span
                            className={`flex items-center gap-1 ${
                              isRTL ? "mr-auto" : "ml-auto"
                            }`}
                          >
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 z-50 mt-16 flex h-screen flex-col bg-sidebar-bg px-4 text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-all duration-300 ease-in-out lg:mt-0
        ${isRTL ? "right-0 border-l border-[var(--border-subtle)]" : "left-0 border-r border-[var(--border-subtle)]"}
        ${
          isExpanded || isMobileOpen
            ? "w-[248px]"
            : isHovered
              ? "w-[248px]"
              : "w-[64px]"
        }
        ${
          isMobileOpen
            ? "translate-x-0"
            : isRTL
              ? "translate-x-full"
              : "-translate-x-full"
        }
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex border-b border-[var(--border-subtle)]/80 py-3 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-center"
        }`}
      >
        <Link to="/" className="flex items-center justify-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              src="/logo/logo-white.png"
              alt="ERP Logo"
              width={420}
              height={40}
              className="h-16 w-auto object-contain"
            />
          ) : (
            <img
              src="/logo/icon.png"
              alt="ERP Icon"
              width={30}
              height={30}
              className="h-[30px] w-[30px] rounded object-contain"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto pt-2 duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-0.5">
            <div>
              <h2
                className={`my-3 flex text-[10px] font-semibold uppercase leading-5 tracking-[0.1em] text-[var(--text-tertiary)] ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t.groupOperations
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(operationsItems, "main")}
            </div>
            {/* Finance Section */}
            {financeItems.some((item) =>
              can({ roles: item.roles, permissions: item.permissions }),
            ) && (
              <div>
                <h2
                  className={`my-3 flex text-[10px] font-semibold uppercase leading-5 tracking-[0.1em] text-[var(--text-tertiary)] ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    t.groupFinance
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(financeItems, "finance")}
              </div>
            )}
            {/* Reports Section */}
            {reportsItems.some((item) =>
              can({ roles: item.roles, permissions: item.permissions }),
            ) && (
              <div>
                <h2
                  className={`my-3 flex text-[10px] font-semibold uppercase leading-5 tracking-[0.1em] text-[var(--text-tertiary)] ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    t.groupReports
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(reportsItems, "reports")}
              </div>
            )}
            {/* Admin Section */}
            {adminItems.some((item) =>
              can({ roles: item.roles, permissions: item.permissions }),
            ) && (
              <div>
                <h2
                  className={`my-3 flex text-[10px] font-semibold uppercase leading-5 tracking-[0.1em] text-[var(--text-tertiary)] ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    t.groupAdmin
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(adminItems, "admin")}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Sign Out - Fixed at bottom */}
      <div className="mt-auto border-t border-[var(--border-subtle)] pb-4 pt-4">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors
            text-[var(--error)] hover:bg-[var(--error-bg)] hover:text-[var(--error)]
            ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {(isExpanded || isHovered || isMobileOpen) && (
            <span>{t.signOut}</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
