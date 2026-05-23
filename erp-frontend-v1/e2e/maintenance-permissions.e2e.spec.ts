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

type RoleEntity = {
  id: string;
  name: string;
};

type PermissionEntity = {
  id: string;
  permission?: string;
  resource?: string;
  action?: string;
};

type UserEntity = {
  id: string;
  email: string;
  rowVersion: number;
};

type AssetEntity = {
  id: string;
  rowVersion: number;
};

type MaintenanceEntity = {
  id: string;
  maintenanceNumber: string;
  rowVersion: number;
  status: string;
  assetId: string;
};

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

    if (!isPaginatedEnvelope && candidate.data) {
      return candidate.data;
    }
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
  expect(accessToken, "Missing access token").toBeTruthy();
  expect(refreshToken, "Missing refresh token").toBeTruthy();
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

test("Maintenance UAT - full UI flow and permissions coverage", async ({
  request,
  page,
}) => {
  test.setTimeout(180000);

  const runId = Date.now().toString();
  const superAuth = await loginApi(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  const token = superAuth.accessToken;

  const rolesPayload = await apiGet<PaginatedResponse<RoleEntity>>(request, token, "/rbac/roles?page=1&limit=100");
  const roles = Array.isArray(rolesPayload.data) ? rolesPayload.data : [];
  const userRole = roles.find((r) => r.name?.toUpperCase() === "USER");
  expect(userRole, "USER role must exist for E2E setup").toBeTruthy();

  const permissionsPayload = await apiGet<PaginatedResponse<PermissionEntity>>(
    request,
    token,
    "/rbac/permissions?page=1&limit=200",
  );
  const permissions = Array.isArray(permissionsPayload.data) ? permissionsPayload.data : [];
  const maintenanceReadPermission = permissions.find((p) => {
    const permissionName = p.permission || `${p.resource}:${p.action}`;
    return permissionName === "maintenance:read";
  });
  expect(maintenanceReadPermission, "maintenance:read permission must exist").toBeTruthy();

  // Create two dedicated users:
  // 1) no-maintenance access
  // 2) maintenance read-only (via custom permission grant)
  const noAccessEmail = `e2e.maintenance.noaccess.${runId}@erp.sys`;
  const readOnlyEmail = `e2e.maintenance.readonly.${runId}@erp.sys`;
  const tempPassword = "TempPass123";

  const noAccessUser = await apiPost<UserEntity>(request, token, "/users", {
    email: noAccessEmail,
    password: tempPassword,
    firstName: "Maintenance",
    lastName: "NoAccess",
    roleIds: [userRole!.id],
  });

  const readOnlyUser = await apiPost<UserEntity>(request, token, "/users", {
    email: readOnlyEmail,
    password: tempPassword,
    firstName: "Maintenance",
    lastName: "ReadOnly",
    roleIds: [userRole!.id],
  });

  await apiPost(
    request,
    token,
    "/rbac/users/custom-permissions/grant",
    {
      userId: readOnlyUser.id,
      permissionId: maintenanceReadPermission!.id,
      reason: "E2E maintenance UI access validation",
    },
    [200, 201],
  );

  // Ensure there is at least one maintenance item for details-page permission checks.
  const maintenanceList = await apiGet<PaginatedResponse<MaintenanceEntity>>(
    request,
    token,
    "/maintenance?page=1&limit=1",
  );

  let maintenanceForCheck: MaintenanceEntity | null =
    Array.isArray(maintenanceList.data) && maintenanceList.data.length > 0
      ? maintenanceList.data[0]
      : null;

  let createdAsset: AssetEntity | null = null;
  let createdMaintenance: MaintenanceEntity | null = null;

  if (!maintenanceForCheck) {
    const asset = await apiPost<AssetEntity>(request, token, "/assets", {
      name: `E2E Maintenance Asset ${runId}`,
      assetType: "EQUIPMENT",
      category: "E2E",
      manufacturer: "E2E",
      model: "M-01",
      serialNumber: `E2E-MNT-${runId}`,
      purchaseDate: "2026-01-01",
      purchasePrice: 10000,
      currentLocation: "E2E Yard",
      status: "AVAILABLE",
    });
    createdAsset = asset;

    const created = await apiPost<MaintenanceEntity>(request, token, "/maintenance", {
      assetId: asset.id,
      maintenanceType: "CORRECTIVE",
      priority: "MEDIUM",
      title: `E2E Maintenance ${runId}`,
      description: "E2E setup request",
      scheduledDate: "2026-03-15",
      estimatedCost: 750,
    });
    createdMaintenance = created;
    maintenanceForCheck = created;
  }

  expect(maintenanceForCheck, "No maintenance request available for permission checks").toBeTruthy();
  const maintenanceId = maintenanceForCheck!.id;

  // ---------------------------------------------------------------------------
  // Case A: User without maintenance permission must be denied route access
  // ---------------------------------------------------------------------------
  await uiLogin(page, noAccessEmail, tempPassword);
  await page.goto("/maintenance");
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  // ---------------------------------------------------------------------------
  // Case B: Read-only user can view, but cannot see write/delete actions
  // ---------------------------------------------------------------------------
  await uiLogin(page, readOnlyEmail, tempPassword);
  await page.goto("/maintenance");
  await expect(page).toHaveURL(/\/maintenance/);

  // Should not access create page
  await page.goto("/maintenance/create");
  await page.waitForURL(/\/403/);
  await expect(page).toHaveURL(/\/403/);

  // Should access details page but with no write/delete actions
  await page.goto(`/maintenance/${maintenanceId}`);
  await expect(page).toHaveURL(new RegExp(`/maintenance/${maintenanceId}$`));

  await expect(page.locator(`a[href="/maintenance/edit/${maintenanceId}"]`)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Delete|حذف/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Start Work|بدء/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Complete|إكمال|مكتمل/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Upload|رفع مستند/i })).toHaveCount(0);

  // ---------------------------------------------------------------------------
  // Case C: Superadmin can access and sees maintenance actions
  // ---------------------------------------------------------------------------
  await uiLogin(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  await page.goto("/maintenance");
  await expect(page).toHaveURL(/\/maintenance/);

  await expect(page.getByRole("link", { name: /Create|إنشاء/i })).toHaveCount(1);
  await page.goto(`/maintenance/${maintenanceId}`);
  await expect(page).toHaveURL(new RegExp(`/maintenance/${maintenanceId}$`));
  await expect(page.locator(`a[href="/maintenance/edit/${maintenanceId}"]`)).toHaveCount(1);

  // Cleanup temp users and temporary records.
  const cleanupNoAccess = await apiGet<UserEntity>(request, token, `/users/${noAccessUser.id}`);
  await apiDelete(request, token, `/users/${noAccessUser.id}`, {
    rowVersion: cleanupNoAccess.rowVersion,
  });

  const cleanupReadOnly = await apiGet<UserEntity>(request, token, `/users/${readOnlyUser.id}`);
  await apiDelete(request, token, `/users/${readOnlyUser.id}`, {
    rowVersion: cleanupReadOnly.rowVersion,
  });

  if (createdMaintenance) {
    const latestM = await apiGet<MaintenanceEntity>(request, token, `/maintenance/${createdMaintenance.id}`);
    await apiDelete(request, token, `/maintenance/${createdMaintenance.id}`, {
      rowVersion: latestM.rowVersion,
    });
  }

  if (createdAsset) {
    const latestA = await apiGet<AssetEntity>(request, token, `/assets/${createdAsset.id}`);
    await apiDelete(request, token, `/assets/${createdAsset.id}`, {
      rowVersion: latestA.rowVersion,
    });
  }
});
