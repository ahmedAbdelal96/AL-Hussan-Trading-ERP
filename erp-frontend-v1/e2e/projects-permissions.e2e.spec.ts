import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:9000/api/v1";
const SUPERADMIN_EMAIL = process.env.E2E_EMAIL || "superadmin@erp.sys";
const SUPERADMIN_PASSWORD = process.env.E2E_PASSWORD || "Admin@123456";

type LoginResponse = {
  user?: Record<string, unknown>;
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  data?: LoginResponse;
};

type RoleEntity = { id: string; name: string };
type PermissionEntity = {
  id: string;
  permission?: string;
  resource?: string;
  action?: string;
};
type UserEntity = { id: string; email: string; rowVersion: number };
type ProjectEntity = { id: string; rowVersion: number; name: string };
type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function unwrap<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const candidate = payload as {
      data?: T;
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
    const isPaginatedEnvelope =
      typeof candidate.total === "number" ||
      typeof candidate.page === "number" ||
      typeof candidate.limit === "number" ||
      typeof candidate.totalPages === "number";
    if (!isPaginatedEnvelope && candidate.data) return candidate.data;
  }
  return payload as T;
}

async function loginApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password, rememberMe: false },
  });
  expect(response.ok(), `Login failed: ${await response.text()}`).toBeTruthy();
  const payload = unwrap<LoginResponse>(await response.json());
  const accessToken = payload.tokens?.accessToken || payload.accessToken;
  const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;
  expect(accessToken).toBeTruthy();
  expect(refreshToken).toBeTruthy();
  return { accessToken: accessToken!, refreshToken: refreshToken! };
}

async function apiGet<T>(
  request: APIRequestContext,
  token: string,
  path: string,
): Promise<T> {
  const response = await request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `GET ${path} failed: ${await response.text()}`).toBeTruthy();
  return unwrap<T>(await response.json());
}

async function apiPost<T>(
  request: APIRequestContext,
  token: string,
  path: string,
  body: unknown,
  expectedStatus: number | number[] = [200, 201],
): Promise<T> {
  const response = await request.post(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
  const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  expect(
    allowed.includes(response.status()),
    `POST ${path} failed (${response.status()}): ${await response.text()}`,
  ).toBeTruthy();
  return unwrap<T>(await response.json());
}

async function apiDelete(
  request: APIRequestContext,
  token: string,
  path: string,
  body?: unknown,
  expectedStatus: number | number[] = [200, 201],
): Promise<void> {
  const response = await request.delete(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
  const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  expect(
    allowed.includes(response.status()),
    `DELETE ${path} failed (${response.status()}): ${await response.text()}`,
  ).toBeTruthy();
}

async function clearBrowserAuth(page: Page) {
  await page.context().clearCookies();
  await page.goto("/signin");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto("/signin");
}

async function uiLogin(page: Page, email: string, password: string) {
  await clearBrowserAuth(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes("/signin"));
}

test("Projects UAT - permissions and UI action visibility", async ({
  request,
  page,
}) => {
  test.setTimeout(180000);
  const runId = Date.now().toString();

  const superAuth = await loginApi(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  const token = superAuth.accessToken;

  const rolesPayload = await apiGet<PaginatedResponse<RoleEntity>>(
    request,
    token,
    "/rbac/roles?page=1&limit=100",
  );
  const roles = Array.isArray(rolesPayload.data) ? rolesPayload.data : [];
  const userRole = roles.find((r) => r.name?.toUpperCase() === "USER");
  expect(userRole).toBeTruthy();

  const permissionsPayload = await apiGet<PaginatedResponse<PermissionEntity>>(
    request,
    token,
    "/rbac/permissions?page=1&limit=200",
  );
  const permissions = Array.isArray(permissionsPayload.data) ? permissionsPayload.data : [];
  const projectReadPermission = permissions.find((p) => {
    const permissionName = p.permission || `${p.resource}:${p.action}`;
    return permissionName === "project:read";
  });
  expect(projectReadPermission).toBeTruthy();

  const noAccessEmail = `e2e.projects.noaccess.${runId}@erp.sys`;
  const readOnlyEmail = `e2e.projects.readonly.${runId}@erp.sys`;
  const tempPassword = "TempPass123";

  const noAccessUser = await apiPost<UserEntity>(request, token, "/users", {
    email: noAccessEmail,
    password: tempPassword,
    firstName: "Projects",
    lastName: "NoAccess",
    roleIds: [userRole!.id],
  });

  const readOnlyUser = await apiPost<UserEntity>(request, token, "/users", {
    email: readOnlyEmail,
    password: tempPassword,
    firstName: "Projects",
    lastName: "ReadOnly",
    roleIds: [userRole!.id],
  });

  await apiPost(
    request,
    token,
    "/rbac/users/custom-permissions/grant",
    {
      userId: readOnlyUser.id,
      permissionId: projectReadPermission!.id,
      reason: "E2E projects UI access validation",
    },
    [200, 201],
  );

  const projectsList = await apiGet<PaginatedResponse<ProjectEntity>>(
    request,
    token,
    "/projects?page=1&limit=1",
  );

  let projectForCheck: ProjectEntity | null =
    Array.isArray(projectsList.data) && projectsList.data.length > 0
      ? projectsList.data[0]
      : null;

  let createdProject: ProjectEntity | null = null;
  if (!projectForCheck) {
    createdProject = await apiPost<ProjectEntity>(request, token, "/projects", {
      name: `E2E Projects ${runId}`,
      description: "E2E projects permission scenario",
      status: "PLANNING",
      budget: 100000,
    });
    projectForCheck = createdProject;
  }

  expect(projectForCheck).toBeTruthy();
  const projectId = projectForCheck!.id;

  // Case A: user without projects permission must be denied.
  await uiLogin(page, noAccessEmail, tempPassword);
  await page.goto("/projects");
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  // Case B: read-only user can view pages but cannot mutate.
  await uiLogin(page, readOnlyEmail, tempPassword);
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/projects/);

  await page.goto("/projects/create");
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  await page.goto(`/projects/${projectId}`);
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
  await expect(page.locator(`a[href="/projects/edit/${projectId}"]`)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Change status|تغيير الحالة/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Upload Documents|رفع مستندات/i }),
  ).toHaveCount(0);

  await page.goto(`/projects/${projectId}/progress`);
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/progress$`));
  await expect(
    page.getByRole("button", { name: /Update Progress|تحديث التقدم/i }),
  ).toHaveCount(0);

  await page.goto(`/projects/edit/${projectId}`);
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  // Case C: superadmin can mutate and sees actions.
  await uiLogin(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/projects/);

  await page.goto(`/projects/${projectId}`);
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}$`));
  await expect(page.locator(`a[href="/projects/edit/${projectId}"]`)).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /Change status|تغيير الحالة/i }),
  ).toHaveCount(1);

  await page.goto(`/projects/${projectId}/progress`);
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/progress$`));
  await expect(
    page.getByRole("button", { name: /Update Progress|تحديث التقدم/i }),
  ).toHaveCount(1);

  // Cleanup users.
  const cleanupNoAccess = await apiGet<UserEntity>(request, token, `/users/${noAccessUser.id}`);
  await apiDelete(request, token, `/users/${noAccessUser.id}`, {
    rowVersion: cleanupNoAccess.rowVersion,
  });

  const cleanupReadOnly = await apiGet<UserEntity>(request, token, `/users/${readOnlyUser.id}`);
  await apiDelete(request, token, `/users/${readOnlyUser.id}`, {
    rowVersion: cleanupReadOnly.rowVersion,
  });

  if (createdProject) {
    const cleanupProject = await apiGet<ProjectEntity>(request, token, `/projects/${createdProject.id}`);
    await apiDelete(request, token, `/projects/${createdProject.id}`, {
      rowVersion: cleanupProject.rowVersion,
    });
  }
});
