$ErrorActionPreference = 'Stop'

$base = 'http://localhost:9000/api/v1'
$email = 'superadmin@erp.sys'
$pass = 'Admin@123456'

function ApiGet($path, $token, $query=@{}) {
  $qs = if ($query.Keys.Count -gt 0) { '?' + (($query.GetEnumerator() | ForEach-Object { "{0}={1}" -f [uri]::EscapeDataString($_.Key), [uri]::EscapeDataString([string]$_.Value) }) -join '&') } else { '' }
  Invoke-RestMethod -Method Get -Uri ($base + $path + $qs) -Headers @{ Authorization = "Bearer $token" }
}

function ApiPost($path, $token, $body) {
  Invoke-RestMethod -Method Post -Uri ($base + $path) -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10)
}

$login = Invoke-RestMethod -Method Post -Uri ($base + '/auth/login') -ContentType 'application/json' -Body (@{ email=$email; password=$pass } | ConvertTo-Json)
$token = $login.tokens.accessToken
if (-not $token) { throw 'Login token not found' }

$employeesResp = ApiGet '/employees' $token @{ page = 1; pageSize = 50; status = 'ACTIVE' }
$employees = @($employeesResp.data | Select-Object -First 3)
if ($employees.Count -lt 3) { throw "Need at least 3 active employees for UAT" }

$loanScenarios = @(
  @{ amount = 12000; installments = 12; startDate = '2026-01-01'; purpose = '???? ????' },
  @{ amount =  6000; installments =  6; startDate = '2026-02-01'; purpose = '???? ?????' },
  @{ amount = 24000; installments = 12; startDate = '2026-01-01'; purpose = '???? ?????' }
)

$loans = @()
for ($i=0; $i -lt 3; $i++) {
  $emp = $employees[$i]
  $scenario = $loanScenarios[$i]

  $created = ApiPost '/payroll/loans' $token @{
    employeeId = $emp.id
    amount = $scenario.amount
    installments = $scenario.installments
    startDate = $scenario.startDate
    purpose = $scenario.purpose
    notes = 'UAT payroll loan scenario'
  }

  $approved = ApiPost ("/payroll/loans/{0}/approve" -f $created.id) $token @{
    notes = 'UAT approval'
    rowVersion = $created.rowVersion
  }

  $loans += [pscustomobject]@{
    employeeId = $emp.id
    employeeNumber = $emp.employeeNumber
    loanId = $approved.id
    amount = $approved.amount
    installmentAmount = $approved.installmentAmount
    installments = $approved.installments
    paidInstallmentsBefore = $approved.paidInstallments
    rowVersion = $approved.rowVersion
  }
}

$manualPayments = @()
foreach ($loan in $loans) {
  $pay = ApiPost ("/payroll/loans/{0}/pay" -f $loan.loanId) $token @{
    deductionDate = '2026-03-31'
    notes = 'UAT manual repayment March'
    rowVersion = $loan.rowVersion
  }
  $manualPayments += [pscustomobject]@{
    loanId = $loan.loanId
    paidInstallmentsAfter = $pay.paidInstallments
    remainingAmount = $pay.remainingAmount
    status = $pay.status
    rowVersion = $pay.rowVersion
  }
}

$accelResult = $null
try {
  $loan1 = $manualPayments[0]
  $second = ApiPost ("/payroll/loans/{0}/pay" -f $loan1.loanId) $token @{
    deductionDate = '2026-03-15'
    notes = 'UAT accelerated second repayment same month'
    rowVersion = $loan1.rowVersion
  }
  $accelResult = [pscustomobject]@{ allowed = $true; message = 'Unexpectedly allowed'; data = $second }
} catch {
  $msg = $_.Exception.Message
  $accelResult = [pscustomobject]@{ allowed = $false; message = $msg }
}

$processResult = ApiPost '/payroll/process' $token @{
  payPeriodMonth = 3
  payPeriodYear = 2026
  payDate = '2026-03-31'
  employeeIds = @($employees.id)
  notes = 'UAT payroll processing March 2026'
}

$deductionEvidence = @()
foreach ($loan in $loans) {
  $ded = ApiGet '/payroll/deductions' $token @{ loanId = $loan.loanId; page = 1; limit = 50; sortBy = 'deductionDate'; sortOrder='asc' }
  $loanRepay = @($ded.data | Where-Object { $_.deductionType -eq 'LOAN_REPAYMENT' -and $_.status -eq 'APPROVED' -and -not $_.deletedAt })
  $marchCount = @($loanRepay | Where-Object { ([datetime]$_.deductionDate).Month -eq 3 -and ([datetime]$_.deductionDate).Year -eq 2026 }).Count

  $deductionEvidence += [pscustomobject]@{
    loanId = $loan.loanId
    totalApprovedRepaymentRows = $loanRepay.Count
    march2026RepaymentRows = $marchCount
    sources = (($loanRepay | Select-Object -ExpandProperty repaymentSource -ErrorAction SilentlyContinue | Sort-Object -Unique) -join ', ')
  }
}

$result = [pscustomobject]@{
  employees = $employees | Select-Object id, employeeNumber, firstName, lastName
  loans = $loans
  manualPayments = $manualPayments
  acceleratedAttempt = $accelResult
  payrollProcess = $processResult | Select-Object totalProcessed, successful, failed, totalGrossSalary, totalDeductions, totalNetSalary
  deductionEvidence = $deductionEvidence
}

$result | ConvertTo-Json -Depth 10
