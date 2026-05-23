import { expect, test, type APIRequestContext } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:9000/api/v1";
const E2E_EMAIL = process.env.E2E_EMAIL || "superadmin@erp.sys";
const E2E_PASSWORD = process.env.E2E_PASSWORD || "Admin@123456";

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

type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  baseSalary?: number;
  status: string;
};

type Loan = {
  id: string;
  employeeId: string;
  amount: number;
  remainingAmount: number;
  paidInstallments: number;
  installments: number;
  installmentAmount: number;
  rowVersion: number;
  status: string;
};

type Deduction = {
  id: string;
  loanId?: string;
  employeeId: string;
  deductionDate: string;
  amount: number;
  status: string;
  deductionType: string;
  repaymentSource?: "MANUAL" | "PAYROLL_PROCESS";
  deletedAt?: string | null;
};

function unwrap<T>(payload: T | { data?: T }): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: T }).data
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

async function apiGet<T>(
  request: APIRequestContext,
  token: string,
  path: string,
): Promise<T> {
  const response = await request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `GET ${path} failed`).toBeTruthy();
  return unwrap<T>(await response.json());
}

async function apiPost<T>(
  request: APIRequestContext,
  token: string,
  path: string,
  body: unknown,
  expectedStatus: number | number[] = 201,
): Promise<T> {
  const response = await request.post(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
  const allowed = Array.isArray(expectedStatus)
    ? expectedStatus
    : [expectedStatus];
  expect(
    allowed.includes(response.status()),
    `POST ${path} failed: ${await response.text()}`,
  ).toBeTruthy();
  return unwrap<T>(await response.json());
}

async function login(request: APIRequestContext): Promise<{
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
}> {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: {
      email: E2E_EMAIL,
      password: E2E_PASSWORD,
    },
  });
  expect(response.ok(), `Login failed: ${await response.text()}`).toBeTruthy();

  const payload = unwrap<LoginResponse>(await response.json());
  const accessToken = payload.tokens?.accessToken || payload.accessToken;
  const refreshToken = payload.tokens?.refreshToken || payload.refreshToken;
  const user = (payload.user || {}) as Record<string, unknown>;

  expect(accessToken, "Missing access token").toBeTruthy();
  expect(refreshToken, "Missing refresh token").toBeTruthy();
  return {
    accessToken: accessToken!,
    refreshToken: refreshToken!,
    user,
  };
}

function generateNationalId(runId: string, idx: number): string {
  const suffix = (parseInt(runId.slice(-8), 10) + idx).toString().padStart(9, "0");
  return `2${suffix.slice(0, 9)}`;
}

async function ensureEmployees(
  request: APIRequestContext,
  token: string,
  runId: string,
): Promise<Employee[]> {
  const created: Employee[] = [];
  for (let i = 1; i <= 3; i++) {
    const employee = await apiPost<Employee>(
      request,
      token,
      "/employees",
      {
        firstName: `E2E${i}`,
        lastName: `Payroll${runId.slice(-4)}`,
        nationalId: generateNationalId(runId, i),
        email: `e2e.payroll.${runId}.${i}@erp.sys`,
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        hireDate: "2025-01-01",
        baseSalary: 12000 + i * 1000,
        currency: "SAR",
      },
      201,
    );
    created.push(employee);
  }
  return created;
}

test("Payroll loans E2E: monthly distribution and accelerated repayment", async ({
  request,
  page,
}) => {
  test.setTimeout(120000);
  const runId = Date.now().toString();
  const auth = await login(request);
  const token = auth.accessToken;

  const employees = await ensureEmployees(request, token, runId);
  expect(employees).toHaveLength(3);

  const loanScenarios = [
    { amount: 12000, installments: 12, startDate: "2026-01-01" },
    { amount: 6000, installments: 6, startDate: "2026-01-01" },
    { amount: 24000, installments: 12, startDate: "2026-01-01" },
  ];

  const loans: Loan[] = [];
  for (let i = 0; i < 3; i++) {
    const created = await apiPost<Loan>(request, token, "/payroll/loans", {
      employeeId: employees[i].id,
      amount: loanScenarios[i].amount,
      installments: loanScenarios[i].installments,
      startDate: loanScenarios[i].startDate,
      purpose: `E2E Loan ${runId} #${i + 1}`,
      notes: "Playwright E2E scenario",
    });

    const approved = await apiPost<Loan>(
      request,
      token,
      `/payroll/loans/${created.id}/approve`,
      { notes: "E2E approve", rowVersion: created.rowVersion },
      [200, 201],
    );
    loans.push(approved);
  }

  for (const loan of loans) {
    const paid = await apiPost<Loan>(
      request,
      token,
      `/payroll/loans/${loan.id}/pay`,
      {
        deductionDate: "2026-03-31",
        notes: "E2E manual repayment March",
        rowVersion: loan.rowVersion,
      },
      201,
    );
    expect(paid.paidInstallments).toBe(1);
  }

  const duplicate = await request.post(`${API_BASE}/payroll/loans/${loans[0].id}/pay`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      deductionDate: "2026-03-15",
      notes: "E2E duplicate same month",
      rowVersion: 3,
    },
  });
  expect(duplicate.status()).toBe(400);

  const refreshedLoan = await apiGet<Loan>(request, token, `/payroll/loans/${loans[0].id}`);
  const accelerated = await apiPost<Loan>(
    request,
    token,
    `/payroll/loans/${loans[0].id}/pay`,
    {
      deductionDate: "2026-04-01",
      notes: "E2E accelerated next month",
      rowVersion: refreshedLoan.rowVersion,
    },
    201,
  );
  expect(accelerated.paidInstallments).toBe(2);

  const processResult = await apiPost<{
    totalProcessed: number;
    successful: number;
    failed: number;
  }>(request, token, "/payroll/process", {
    payPeriodMonth: 5,
    payPeriodYear: 2026,
    payDate: "2026-05-31",
    employeeIds: employees.map((e) => e.id),
    notes: `E2E payroll run ${runId}`,
  });

  expect(processResult.totalProcessed).toBe(3);
  expect(processResult.successful).toBe(3);
  expect(processResult.failed).toBe(0);

  for (const loan of loans) {
    const list = await apiGet<{
      data: Deduction[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(
      request,
      token,
      `/payroll/deductions?loanId=${loan.id}&page=1&limit=100&sortBy=deductionDate&sortOrder=asc`,
    );
    const dataRows = Array.isArray((list as { data?: Deduction[] }).data)
      ? (list as { data: Deduction[] }).data
      : (Array.isArray(list) ? list : []);
    const rows = dataRows.filter((d) => d.deductionType === "LOAN_REPAYMENT");
    const mayRows = rows.filter((d) => d.deductionDate.startsWith("2026-05"));
    expect(mayRows.length).toBe(1);
    expect(mayRows[0].repaymentSource).toBe("PAYROLL_PROCESS");
  }

  // Frontend smoke validation with real UI login.
  await page.goto("/signin");
  await page.locator('input[type="email"]').fill(E2E_EMAIL);
  await page.locator('input[type="password"]').fill(E2E_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.includes("/signin"));

  await page.goto("/payroll/loans");
  await expect(page).toHaveURL(/\/payroll\/loans/);
  await page.goto("/payroll/deductions");
  await expect(page).toHaveURL(/\/payroll\/deductions/);
});
