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

test("Authorization UAT - Users/RBAC route and action protection", async ({
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
  expect(userRole, "USER role must exist for E2E setup").toBeTruthy();

  const permissionsPayload = await apiGet<PaginatedResponse<PermissionEntity>>(
    request,
    token,
    "/rbac/permissions?page=1&limit=200",
  );
  const permissions = Array.isArray(permissionsPayload.data) ? permissionsPayload.data : [];
  const userReadPermission = permissions.find((p) => {
    const permissionName = p.permission || `${p.resource}:${p.action}`;
    return permissionName === "user:read";
  });
  expect(userReadPermission, "user:read permission must exist").toBeTruthy();

  const limitedEmail = `e2e.authz.limited.${runId}@erp.sys`;
  const tempPassword = "TempPass123";

  const limitedUser = await apiPost<UserEntity>(request, token, "/users", {
    email: limitedEmail,
    password: tempPassword,
    firstName: "Authz",
    lastName: "Limited",
    roleIds: [userRole!.id],
  });

  await apiPost(
    request,
    token,
    "/rbac/users/custom-permissions/grant",
    {
      userId: limitedUser.id,
      permissionId: userReadPermission!.id,
      reason: "E2E authorization UAT for users read-only scope",
    },
    [200, 201],
  );

  // ---------------------------------------------------------------------------
  // Limited user: can view /users list, but cannot access critical routes.
  // ---------------------------------------------------------------------------
  await uiLogin(page, limitedEmail, tempPassword);
  await page.goto("/users");
  await expect(page).toHaveURL(/\/users$/);

  // Buttons that trigger critical ops must be hidden.
  await expect(
    page.getByRole("link", { name: /إضافة مستخدم|Add User/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /المستخدمين المحذوفين|Deleted Users/i }),
  ).toHaveCount(0);

  // Critical routes must redirect to 403 page.
  await page.goto("/users/create");
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  await page.goto("/users/deleted");
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  await page.goto("/rbac");
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  // ---------------------------------------------------------------------------
  // Superadmin: must have access to critical users/rbac surfaces.
  // ---------------------------------------------------------------------------
  await uiLogin(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);

  await page.goto("/users");
  await expect(page).toHaveURL(/\/users$/);
  await expect(
    page.getByRole("link", { name: /إضافة مستخدم|Add User/i }),
  ).not.toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /المستخدمين المحذوفين|Deleted Users/i }),
  ).not.toHaveCount(0);

  await page.goto("/users/deleted");
  await expect(page).toHaveURL(/\/users\/deleted/);

  await page.goto("/rbac");
  await expect(page).toHaveURL(/\/rbac/);

  // Cleanup temporary user
  const cleanupLimited = await apiGet<UserEntity>(request, token, `/users/${limitedUser.id}`);
  await apiDelete(request, token, `/users/${limitedUser.id}`, {
    rowVersion: cleanupLimited.rowVersion,
  });
});
