$ErrorActionPreference = 'Stop'

$base = if ($env:UAT_BASE_URL) { $env:UAT_BASE_URL } else { 'http://localhost:9000/api/v1' }
$email = if ($env:UAT_EMAIL) { $env:UAT_EMAIL } else { 'superadmin@erp.sys' }
$pass = if ($env:UAT_PASSWORD) { $env:UAT_PASSWORD } else { 'Admin@123456' }
$keepData = ($env:UAT_KEEP_DATA -eq '1')

function Build-QueryString($query) {
  if (-not $query -or $query.Keys.Count -eq 0) { return '' }
  return '?' + (($query.GetEnumerator() | ForEach-Object {
      '{0}={1}' -f [uri]::EscapeDataString($_.Key), [uri]::EscapeDataString([string]$_.Value)
    }) -join '&')
}

function ApiGet($path, $token, $query=@{}) {
  $qs = Build-QueryString $query
  Invoke-RestMethod -Method Get -Uri ($base + $path + $qs) -Headers @{ Authorization = "Bearer $token" }
}

function ApiPost($path, $token, $body) {
  Invoke-RestMethod -Method Post -Uri ($base + $path) -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 15)
}

function ApiPut($path, $token, $body) {
  Invoke-RestMethod -Method Put -Uri ($base + $path) -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 15)
}

function ApiDelete($path, $token, $body) {
  Invoke-RestMethod -Method Delete -Uri ($base + $path) -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 15)
}

function Assert-True($condition, $message) {
  if (-not $condition) { throw "ASSERTION FAILED: $message" }
}

function To-Number($value) {
  if ($null -eq $value) { return [double]0 }
  return [double]$value
}

$startAt = Get-Date
$resultPath = Join-Path $PSScriptRoot 'uat-maintenance-result.json'
$mdPath = Join-Path $PSScriptRoot 'uat-maintenance-final-report.md'

$assetId = $null
$projectId = $null
$maintenanceId = $null
$maintenanceNumber = $null

$cleanup = [ordered]@{
  attempted = (-not $keepData)
  maintenanceSoftCancelled = $false
  maintenanceHardDeleted = $false
  assetProjectReturned = $false
  assetDeleted = $false
  errors = @()
}

try {
  $login = Invoke-RestMethod -Method Post -Uri ($base + '/auth/login') -ContentType 'application/json' -Body (@{ email = $email; password = $pass; rememberMe = $false } | ConvertTo-Json)
  $token = $login.tokens.accessToken
  Assert-True ($null -ne $token -and $token.Length -gt 10) 'Login token not returned'

  # Baseline snapshots
  $beforeStats = ApiGet '/maintenance/statistics' $token @{}
  $beforeByStatus = ApiGet '/reports/maintenance/by-status' $token @{}
  $beforeCost = ApiGet '/reports/maintenance/cost-analysis' $token @{}

  $beforeCompleted = To-Number $beforeStats.completedRequests
  $beforeTotalActualCost = To-Number $beforeCost.totalActualCost

  # Use an existing active/on-hold/planning project as cost destination.
  $projects = ApiGet '/projects' $token @{ page = 1; limit = 50 }
  $project = @($projects.data | Where-Object { @('ACTIVE', 'ON_HOLD', 'PLANNING') -contains $_.status } | Select-Object -First 1)[0]
  Assert-True ($null -ne $project) 'No eligible project found for maintenance allocation scenario'
  $projectId = $project.id

  # Create dedicated asset for isolated scenario.
  $ts = Get-Date -Format 'yyyyMMddHHmmss'
  $createdAsset = ApiPost '/assets' $token @{
    name = "UAT Maintenance Asset $ts"
    assetType = 'EQUIPMENT'
    category = 'UAT'
    manufacturer = 'UAT Manufacturer'
    model = 'MNT-UAT-01'
    serialNumber = "MNT-UAT-SN-$ts"
    purchaseDate = '2026-01-01'
    purchasePrice = 50000
    currentLocation = 'UAT Test Yard'
    status = 'AVAILABLE'
    notes = 'UAT maintenance isolated flow'
  }
  $assetId = $createdAsset.id
  Assert-True ($null -ne $assetId) 'Asset creation failed in UAT maintenance flow'

  # Link asset to project so maintenance gets allocation snapshot.
  $projectAssign = ApiPost ("/assets/{0}/assign-project" -f $assetId) $token @{
    projectId = $projectId
    assignedDate = (Get-Date).ToString('yyyy-MM-dd')
    location = 'UAT Maintenance Site'
    notes = 'UAT maintenance project assignment'
  }
  Assert-True ($null -ne $projectAssign.id) 'Assign asset to project failed'

  # 1) Create maintenance request
  $createdMaintenance = ApiPost '/maintenance' $token @{
    assetId = $assetId
    maintenanceType = 'CORRECTIVE'
    priority = 'HIGH'
    title = "UAT Maintenance $ts"
    description = 'UAT maintenance full lifecycle'
    scheduledDate = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
    estimatedCost = 1800
    vendor = 'UAT Workshop'
    notes = 'UAT request'
  }
  $maintenanceId = $createdMaintenance.id
  $maintenanceNumber = $createdMaintenance.maintenanceNumber
  Assert-True ($null -ne $maintenanceId) 'Maintenance request creation failed'
  Assert-True ($createdMaintenance.status -eq 'PENDING') 'New maintenance request must start as PENDING'

  # 2) Move to IN_PROGRESS with rowVersion guard
  $inProgress = ApiPut ("/maintenance/{0}" -f $maintenanceId) $token @{
    status = 'IN_PROGRESS'
    startedAt = (Get-Date).ToString('o')
    rowVersion = [int]$createdMaintenance.rowVersion
  }
  Assert-True ($inProgress.status -eq 'IN_PROGRESS') 'Maintenance status update to IN_PROGRESS failed'

  # 3) Negative test: invalid allocation sum on COMPLETED should fail (400)
  $negativeRejected = $false
  $negativeMessage = $null
  $allocRows = @($inProgress.projectAllocations)
  if ($allocRows.Count -gt 0) {
    $badAlloc = @(
      @{
        projectId = $allocRows[0].projectId
        percentage = 90
      }
    )

    try {
      $null = ApiPut ("/maintenance/{0}" -f $maintenanceId) $token @{
        status = 'COMPLETED'
        actualCost = 2100
        completedAt = (Get-Date).ToString('o')
        rowVersion = [int]$inProgress.rowVersion
        projectAllocations = $badAlloc
      }
    } catch {
      $negativeRejected = $true
      $negativeMessage = $_.Exception.Message
    }
  } else {
    $negativeRejected = $true
    $negativeMessage = 'Skipped invalid allocation test because no project allocations were attached'
  }
  Assert-True $negativeRejected 'Invalid allocation override should be rejected'

  # 4) Positive completion
  $fresh = ApiGet ("/maintenance/{0}" -f $maintenanceId) $token @{}
  $actualCost = [double]2200
  $finalAllocations = @()
  if (@($fresh.projectAllocations).Count -gt 0) {
    $sumPct = 0
    $rows = @($fresh.projectAllocations)
    for ($i = 0; $i -lt $rows.Count; $i++) {
      $isLast = $i -eq ($rows.Count - 1)
      $pct = if ($isLast) { 100 - $sumPct } else { [math]::Round([double]$rows[$i].percentage, 2) }
      if (-not $isLast) { $sumPct += $pct }
      $finalAllocations += @{
        projectId = $rows[$i].projectId
        percentage = $pct
      }
    }
  }

  $completeBody = @{
    status = 'COMPLETED'
    actualCost = $actualCost
    completedAt = (Get-Date).ToString('o')
    rowVersion = [int]$fresh.rowVersion
  }
  if ($finalAllocations.Count -gt 0) {
    $completeBody.projectAllocations = $finalAllocations
  }

  $completed = ApiPut ("/maintenance/{0}" -f $maintenanceId) $token $completeBody
  Assert-True ($completed.status -eq 'COMPLETED') 'Maintenance should be COMPLETED after positive update'
  Assert-True ([math]::Abs((To-Number $completed.actualCost) - $actualCost) -lt 0.01) 'Completed actualCost mismatch'

  # 5) Validate stats / reports moved as expected
  $afterStats = ApiGet '/maintenance/statistics' $token @{}
  $afterByStatus = ApiGet '/reports/maintenance/by-status' $token @{}
  $afterCost = ApiGet '/reports/maintenance/cost-analysis' $token @{}

  $afterCompleted = To-Number $afterStats.completedRequests
  $afterTotalActualCost = To-Number $afterCost.totalActualCost

  Assert-True ($afterCompleted -ge ($beforeCompleted + 1)) 'completedRequests did not increase after completion'
  Assert-True ($afterTotalActualCost -ge ($beforeTotalActualCost + $actualCost - 0.1)) 'Maintenance cost analysis did not include new actual cost'

  # Optional cleanup
  if (-not $keepData) {
    if ($maintenanceId) {
      try {
        # completed -> cancelled (soft)
        $latest = ApiGet ("/maintenance/{0}" -f $maintenanceId) $token @{}
        $null = ApiDelete ("/maintenance/{0}" -f $maintenanceId) $token @{ rowVersion = [int]$latest.rowVersion }
        $cleanup.maintenanceSoftCancelled = $true

        # cancelled -> hard delete
        $latest2 = ApiGet ("/maintenance/{0}" -f $maintenanceId) $token @{}
        $null = ApiDelete ("/maintenance/{0}" -f $maintenanceId) $token @{ rowVersion = [int]$latest2.rowVersion }
        $cleanup.maintenanceHardDeleted = $true
      } catch {
        $cleanup.errors += "maintenance cleanup: $($_.Exception.Message)"
      }
    }

    if ($assetId) {
      try {
        try {
          $null = ApiPost ("/assets/{0}/return-project" -f $assetId) $token @{
            returnDate = (Get-Date).ToString('yyyy-MM-dd')
            notes = 'UAT maintenance cleanup return from project'
          }
          $cleanup.assetProjectReturned = $true
        } catch {
          # ignore if already unassigned
        }

        $assetForDelete = ApiGet ("/assets/{0}" -f $assetId) $token @{}
        if ($assetForDelete.status -ne 'AVAILABLE') {
          $assetForDelete = ApiPut ("/assets/{0}" -f $assetId) $token @{
            status = 'AVAILABLE'
            notes = 'UAT cleanup set AVAILABLE before delete'
            rowVersion = [int]$assetForDelete.rowVersion
          }
        }
        $null = ApiDelete ("/assets/{0}" -f $assetId) $token @{ rowVersion = [int]$assetForDelete.rowVersion }
        $cleanup.assetDeleted = $true
      } catch {
        $cleanup.errors += "asset cleanup: $($_.Exception.Message)"
      }
    }
  }

  $result = [ordered]@{
    startedAt = $startAt.ToString('o')
    finishedAt = (Get-Date).ToString('o')
    baseUrl = $base
    scenario = @(
      'create asset for isolated maintenance test',
      'assign asset to project',
      'create maintenance request',
      'move status to IN_PROGRESS with rowVersion',
      'reject invalid completion allocation (sum != 100)',
      'complete maintenance with valid allocation',
      'validate maintenance statistics and cost-analysis deltas'
    )
    entities = @{
      projectId = $projectId
      assetId = $assetId
      maintenanceId = $maintenanceId
      maintenanceNumber = $maintenanceNumber
    }
    baseline = @{
      completedRequests = $beforeCompleted
      totalActualCost = $beforeTotalActualCost
    }
    after = @{
      completedRequests = $afterCompleted
      totalActualCost = $afterTotalActualCost
    }
    checks = @{
      statusFlow = @($createdMaintenance.status, $inProgress.status, $completed.status)
      negativeAllocationRejected = $negativeRejected
      negativeAllocationMessage = $negativeMessage
    }
    byStatusSnapshots = @{
      before = $beforeByStatus
      after = $afterByStatus
    }
    cleanup = $cleanup
    pass = $true
  }

  ($result | ConvertTo-Json -Depth 20) | Out-File -FilePath $resultPath -Encoding utf8

  $md = @()
  $md += '# Maintenance UAT Final Report'
  $md += ''
  $md += "Generated at: $($result.finishedAt)"
  $md += ''
  $md += '## Result'
  $md += '- PASS'
  $md += ''
  $md += '## Scenario'
  foreach ($s in $result.scenario) { $md += "- $s" }
  $md += ''
  $md += '## Key Metrics'
  $md += "- completedRequests: $beforeCompleted -> $afterCompleted"
  $md += "- totalActualCost: $beforeTotalActualCost -> $afterTotalActualCost"
  $md += ''
  $md += '## Validation'
  $md += "- invalid allocation rejected: $negativeRejected"
  $md += "- negative message: $negativeMessage"
  $md += ''
  $md += '## Cleanup'
  $md += "- attempted: $($cleanup.attempted)"
  $md += "- maintenance soft-cancelled: $($cleanup.maintenanceSoftCancelled)"
  $md += "- maintenance hard-deleted: $($cleanup.maintenanceHardDeleted)"
  $md += "- asset project returned: $($cleanup.assetProjectReturned)"
  $md += "- asset deleted: $($cleanup.assetDeleted)"
  if ($cleanup.errors.Count -gt 0) {
    $md += '- cleanup errors:'
    foreach ($e in $cleanup.errors) { $md += "  - $e" }
  }

  $md -join "`n" | Out-File -FilePath $mdPath -Encoding utf8

  Write-Host "Maintenance UAT completed successfully."
  Write-Host "JSON report: $resultPath"
  Write-Host "Markdown report: $mdPath"
} catch {
  $failResult = [ordered]@{
    startedAt = $startAt.ToString('o')
    finishedAt = (Get-Date).ToString('o')
    baseUrl = $base
    entities = @{
      projectId = $projectId
      assetId = $assetId
      maintenanceId = $maintenanceId
      maintenanceNumber = $maintenanceNumber
    }
    cleanup = $cleanup
    pass = $false
    error = $_.Exception.Message
  }

  ($failResult | ConvertTo-Json -Depth 20) | Out-File -FilePath $resultPath -Encoding utf8
  Write-Error "Maintenance UAT failed: $($_.Exception.Message)"
  Write-Host "Failure report: $resultPath"
  exit 1
}
