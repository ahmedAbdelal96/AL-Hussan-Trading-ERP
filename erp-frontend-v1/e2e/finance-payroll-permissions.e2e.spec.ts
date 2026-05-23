import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:9000/api/v1";
const SUPERADMIN_EMAIL = process.env.E2E_EMAIL || "superadmin@erp.sys";
const SUPERADMIN_PASSWORD = process.env.E2E_PASSWORD || "Admin@123456";

type LoginResponse = {
  tokens?: { accessToken?: string; refreshToken?: string };
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

test("Authorization UAT - Finance/Payroll permissions matrix", async ({
  request,
  page,
}) => {
  test.setTimeout(240000);
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

  const permsPayload = await apiGet<PaginatedResponse<PermissionEntity>>(
    request,
    token,
    "/rbac/permissions?page=1&limit=300",
  );
  const permissions = Array.isArray(permsPayload.data) ? permsPayload.data : [];

  const byName = (permissionName: string) =>
    permissions.find((p) => (p.permission || `${p.resource}:${p.action}`) === permissionName);

  const financeRead = byName("finance:read");
  const financeApprove = byName("finance:approve");
  const payrollRead = byName("payroll:read");
  const payrollApprove = byName("payroll:approve");
  const payrollProcess = byName("payroll:process");

  expect(financeRead).toBeTruthy();
  expect(financeApprove).toBeTruthy();
  expect(payrollRead).toBeTruthy();
  expect(payrollApprove).toBeTruthy();
  expect(payrollProcess).toBeTruthy();

  const tempPassword = "TempPass123";

  const financeReaderEmail = `e2e.finance.reader.${runId}@erp.sys`;
  const financeApproverEmail = `e2e.finance.approver.${runId}@erp.sys`;
  const payrollReaderEmail = `e2e.payroll.reader.${runId}@erp.sys`;
  const payrollApproverEmail = `e2e.payroll.approver.${runId}@erp.sys`;
  const payrollProcessorEmail = `e2e.payroll.processor.${runId}@erp.sys`;

  const createdUsers: UserEntity[] = [];
  const createUser = async (email: string, firstName: string): Promise<UserEntity> => {
    const user = await apiPost<UserEntity>(request, token, "/users", {
      email,
      password: tempPassword,
      firstName,
      lastName: "UAT",
      roleIds: [userRole!.id],
    });
    createdUsers.push(user);
    return user;
  };

  const grant = async (userId: string, permissionId: string, reason: string) => {
    await apiPost(
      request,
      token,
      "/rbac/users/custom-permissions/grant",
      { userId, permissionId, reason },
      [200, 201],
    );
  };

  const financeReader = await createUser(financeReaderEmail, "FinanceReader");
  const financeApproverUser = await createUser(financeApproverEmail, "FinanceApprover");
  const payrollReader = await createUser(payrollReaderEmail, "PayrollReader");
  const payrollApproverUser = await createUser(payrollApproverEmail, "PayrollApprover");
  const payrollProcessorUser = await createUser(payrollProcessorEmail, "PayrollProcessor");

  await grant(financeReader.id, financeRead!.id, "E2E finance read-only");
  await grant(financeApproverUser.id, financeRead!.id, "E2E finance approvals scope");
  await grant(financeApproverUser.id, financeApprove!.id, "E2E finance approvals scope");
  await grant(payrollReader.id, payrollRead!.id, "E2E payroll read-only");
  await grant(payrollApproverUser.id, payrollRead!.id, "E2E payroll approver scope");
  await grant(payrollApproverUser.id, payrollApprove!.id, "E2E payroll approver scope");
  await grant(payrollProcessorUser.id, payrollRead!.id, "E2E payroll processing scope");
  await grant(payrollProcessorUser.id, payrollProcess!.id, "E2E payroll processing scope");

  try {
    // -----------------------------------------------------------------------
    // Finance read-only: can access costs, cannot access approvals.
    // -----------------------------------------------------------------------
    await uiLogin(page, financeReaderEmail, tempPassword);
    await page.goto("/finance/costs");
    await expect(page).toHaveURL(/\/finance\/costs/);
    await page.goto("/finance/approvals");
    await page.waitForURL(/\/403/);
    await expect(page).toHaveURL(/\/403/);

    // -----------------------------------------------------------------------
    // Finance approver: can access approvals page.
    // -----------------------------------------------------------------------
    await uiLogin(page, financeApproverEmail, tempPassword);
    await page.goto("/finance/approvals");
    await expect(page).toHaveURL(/\/finance\/approvals/);
    await expect(page.getByText(/Approvals|الموافقات/i)).toHaveCount(1);

    // -----------------------------------------------------------------------
    // Payroll read-only: can access deductions, cannot access process.
    // Also verify no deleted endpoint is requested in active view.
    // -----------------------------------------------------------------------
    const requestedUrls: string[] = [];
    page.on("request", (req) => {
      requestedUrls.push(req.url());
    });

    await uiLogin(page, payrollReaderEmail, tempPassword);
    await page.goto("/payroll/deductions");
    await expect(page).toHaveURL(/\/payroll\/deductions/);
    await page.waitForTimeout(1500);
    const calledDeletedDeductions = requestedUrls.some((url) =>
      url.includes("/payroll/deductions/deleted"),
    );
    expect(calledDeletedDeductions).toBeFalsy();

    await page.goto("/payroll/process");
    await page.waitForURL(/\/403/);
    await expect(page).toHaveURL(/\/403/);

    // -----------------------------------------------------------------------
    // Payroll approver: can access deductions and stays authorized for approval surfaces.
    // -----------------------------------------------------------------------
    await uiLogin(page, payrollApproverEmail, tempPassword);
    await page.goto("/payroll/deductions");
    await expect(page).toHaveURL(/\/payroll\/deductions/);
    // Page-level check that module is accessible with approval scope.
    await expect(page.getByText(/Deductions|الخصومات/i).first()).toBeVisible();

    // -----------------------------------------------------------------------
    // Payroll processor: can access payroll process page.
    // -----------------------------------------------------------------------
    await uiLogin(page, payrollProcessorEmail, tempPassword);
    await page.goto("/payroll/process");
    await expect(page).toHaveURL(/\/payroll\/process/);
    await expect(page.getByText(/Process|معالجة|Preview|معاينة/i).first()).toBeVisible();
  } finally {
    // Cleanup all temporary users
    for (const tempUser of createdUsers) {
      const latest = await apiGet<UserEntity>(request, token, `/users/${tempUser.id}`);
      await apiDelete(request, token, `/users/${tempUser.id}`, {
        rowVersion: latest.rowVersion,
      });
    }
  }
});

