/**
 * Users Module Routes
 *
 * Security: EXPLICIT roles + permissions (Best Practice)
 * - Roles: SUPERADMIN, IT_ADMIN, ADMIN
 * - Permissions: user:read, user:write, user:delete, user:reset_password
 */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { SYSTEM_ROLES, PERMISSIONS } from "@/config/permissions.constants";

const UsersListPage = lazy(() =>
  import("@/pages/users/UsersListPage").then((m) => ({
    default: m.UsersListPage,
  })),
);
const DeletedUsersPage = lazy(() =>
  import("@/pages/users/DeletedUsersPage").then((m) => ({
    default: m.DeletedUsersPage,
  })),
);
const UserFormPage = lazy(() =>
  import("@/pages/users/UserFormPage").then((m) => ({
    default: m.UserFormPage,
  })),
);
const UserProfilePage = lazy(() =>
  import("@/pages/users/UserProfilePage").then((m) => ({
    default: m.UserProfilePage,
  })),
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export const usersRoutes: RouteObject[] = [
  {
    path: "users",
    element: (
      <ProtectedRoute
        roles={[
          SYSTEM_ROLES.SUPERADMIN,
          SYSTEM_ROLES.IT_ADMIN,
          SYSTEM_ROLES.ADMIN,
        ]}
        permissions={[PERMISSIONS.USER_READ]}
      />
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <UsersListPage />
          </Suspense>
        ),
      },
      {
        path: "deleted",
        element: (
          <ProtectedRoute roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN]} />
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <DeletedUsersPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "create",
        element: (
          <ProtectedRoute roles={[SYSTEM_ROLES.SUPERADMIN, SYSTEM_ROLES.IT_ADMIN]} />
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <UserFormPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "edit/:id",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.IT_ADMIN,
              SYSTEM_ROLES.ADMIN,
            ]}
            permissions={[PERMISSIONS.USER_WRITE]}
          />
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <UserFormPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: ":id",
        element: (
          <ProtectedRoute
            roles={[
              SYSTEM_ROLES.SUPERADMIN,
              SYSTEM_ROLES.IT_ADMIN,
              SYSTEM_ROLES.ADMIN,
            ]}
            permissions={[PERMISSIONS.USER_READ]}
          />
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <UserProfilePage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
];
