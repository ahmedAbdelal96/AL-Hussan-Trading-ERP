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
  Invoke-RestMethod -Method Post -Uri ($base + $path) -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10)
}

function ApiPut($path, $token, $body) {
  Invoke-RestMethod -Method Put -Uri ($base + $path) -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10)
}

function ApiDelete($path, $token, $body) {
  Invoke-RestMethod -Method Delete -Uri ($base + $path) -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 10)
}

function Assert-True($condition, $message) {
  if (-not $condition) { throw "ASSERTION FAILED: $message" }
}

$startAt = Get-Date
$resultPath = Join-Path $PSScriptRoot 'uat-assets-result.json'
$mdPath = Join-Path $PSScriptRoot 'uat-assets-final-report.md'

$assetId = $null
$finalAssetSnapshot = $null
$createdProjectForUat = $null

try {
  $login = Invoke-RestMethod -Method Post -Uri ($base + '/auth/login') -ContentType 'application/json' -Body (@{ email = $email; password = $pass; rememberMe = $false } | ConvertTo-Json)
  $token = $login.tokens.accessToken
  Assert-True ($null -ne $token -and $token.Length -gt 10) 'Login token not returned'

  # Baseline reports before UAT actions
  $beforeStatus = ApiGet '/reports/assets/by-status' $token @{ includeAlerts = 'true' }
  $beforeUtil = ApiGet '/reports/assets/utilization' $token @{ includeIdleAssets = 'true'; includeOperations = 'true' }
  $beforeOverview = ApiGet '/reports/assets/overview' $token @{}

  $beforeTotalAssets = [int]($beforeStatus.totalAssets)
  $beforeInUseCount = [int](($beforeStatus.breakdown | Where-Object { $_.status -eq 'IN_USE' } | Select-Object -First 1).assetCount)
  if ($null -eq $beforeInUseCount) { $beforeInUseCount = 0 }
  $beforeUnderMaintenanceCount = [int](($beforeStatus.breakdown | Where-Object { $_.status -eq 'UNDER_MAINTENANCE' } | Select-Object -First 1).assetCount)
  if ($null -eq $beforeUnderMaintenanceCount) { $beforeUnderMaintenanceCount = 0 }
  $beforeOperationalCount = $beforeInUseCount + $beforeUnderMaintenanceCount

  # Reference data for assignments
  $projectResp = ApiGet '/projects' $token @{ page = 1; limit = 20 }
  $project = @($projectResp.data | Where-Object { $_.deletedAt -eq $null } | Select-Object -First 1)[0]
  if ($null -eq $project) {
    $tsForProject = Get-Date -Format 'yyyyMMddHHmmss'
    $createdProjectForUat = ApiPost '/projects' $token @{
      name = "UAT Asset Project $tsForProject"
      status = 'ACTIVE'
      plannedStartDate = (Get-Date).ToString('yyyy-MM-dd')
      budget = 500000
      notes = 'Auto-created by assets UAT script'
    }
    $project = $createdProjectForUat
  }
  Assert-True ($null -ne $project) 'No project found and fallback project creation failed'

  $employeesResp = ApiGet '/employees' $token @{ page = 1; pageSize = 50; status = 'ACTIVE' }
  $employee = @($employeesResp.data | Select-Object -First 1)[0]
  Assert-True ($null -ne $employee) 'No active employee found for assignment scenario'

  $ts = Get-Date -Format 'yyyyMMddHHmmss'
  $createPayload = @{
    name = "UAT Operational Asset $ts"
    assetType = "EQUIPMENT"
    category = "UAT Equipment"
    manufacturer = "Test Manufacturer"
    model = "UAT-Model"
    serialNumber = "UAT-SN-$ts"
    purchaseDate = "2026-01-15"
    purchasePrice = 125000
    warrantyExpiry = "2028-01-15"
    currentLocation = "UAT Yard"
    status = "AVAILABLE"
    notes = "UAT assets module scenario"
  }

  # 1) Create asset
  $created = ApiPost '/assets' $token $createPayload
  $assetId = $created.id
  Assert-True ($null -ne $assetId) 'Asset creation did not return id'
  Assert-True ($created.status -eq 'AVAILABLE') 'Created asset should start as AVAILABLE'
  Assert-True ([int]$created.rowVersion -ge 1) 'Created asset rowVersion should be >= 1'

  # 2) Assign to project (asset must be AVAILABLE)
  $projectAssign = ApiPost ("/assets/{0}/assign-project" -f $assetId) $token @{
    projectId = $project.id
    assignedDate = (Get-Date).ToString('yyyy-MM-dd')
    location = 'UAT Project Location'
    notes = 'UAT project assignment'
  }
  Assert-True ($null -ne $projectAssign.id) 'Project assignment failed'

  # 3) Update status to IN_USE (row version guarded)
  $updated = ApiPut ("/assets/{0}" -f $assetId) $token @{
    status = 'IN_USE'
    notes = 'UAT moved to IN_USE'
    rowVersion = [int]$created.rowVersion
  }
  Assert-True ($updated.status -eq 'IN_USE') 'Asset status update to IN_USE failed'
  Assert-True ([int]$updated.rowVersion -gt [int]$created.rowVersion) 'rowVersion should increase after update'

  # 4) Assign employee
  $employeeAssign = ApiPost ("/assets/{0}/assign-employee" -f $assetId) $token @{
    employeeId = $employee.id
    assignmentType = 'PRIMARY_DRIVER'
    isPrimary = $true
    assignedDate = (Get-Date).ToString('yyyy-MM-dd')
    notes = 'UAT employee assignment'
  }
  Assert-True ($null -ne $employeeAssign.id) 'Employee assignment failed'

  # 5) Create maintenance request
  $maintenance = ApiPost ("/assets/{0}/maintenance" -f $assetId) $token @{
    title = 'UAT Preventive Maintenance'
    maintenanceType = 'PREVENTIVE'
    priority = 'MEDIUM'
    description = 'UAT maintenance workflow verification'
    scheduledDate = (Get-Date).AddDays(2).ToString('yyyy-MM-dd')
    estimatedCost = 1500
    vendor = 'UAT Workshop'
    notes = 'UAT maintenance request'
  }
  Assert-True ($null -ne $maintenance.id) 'Maintenance request creation failed'

  # 6) Verify entity-level views
  $assetDetails = ApiGet ("/assets/{0}" -f $assetId) $token @{}
  $assetProjects = ApiGet ("/assets/{0}/projects" -f $assetId) $token @{}
  $assetEmployees = ApiGet ("/assets/{0}/employees" -f $assetId) $token @{ activeOnly = 'true' }
  $assetMaintenance = ApiGet ("/assets/{0}/maintenance" -f $assetId) $token @{}

  Assert-True (
    @('IN_USE', 'UNDER_MAINTENANCE') -contains $assetDetails.status
  ) 'Asset details should be in an operational lifecycle status after update/maintenance'
  Assert-True (@($assetProjects).Count -ge 1) 'Asset project history should include at least one row'
  Assert-True (@($assetEmployees).Count -ge 1) 'Asset employees should include at least one active assignment'
  Assert-True (@($assetMaintenance).Count -ge 1) 'Asset maintenance history should include created request'

  # 7) Verify reports reflect expected delta
  $afterStatus = ApiGet '/reports/assets/by-status' $token @{ includeAlerts = 'true' }
  $afterUtil = ApiGet '/reports/assets/utilization' $token @{ includeIdleAssets = 'true'; includeOperations = 'true' }
  $afterOverview = ApiGet '/reports/assets/overview' $token @{}

  $afterTotalAssets = [int]($afterStatus.totalAssets)
  $afterInUseCount = [int](($afterStatus.breakdown | Where-Object { $_.status -eq 'IN_USE' } | Select-Object -First 1).assetCount)
  if ($null -eq $afterInUseCount) { $afterInUseCount = 0 }
  $afterUnderMaintenanceCount = [int](($afterStatus.breakdown | Where-Object { $_.status -eq 'UNDER_MAINTENANCE' } | Select-Object -First 1).assetCount)
  if ($null -eq $afterUnderMaintenanceCount) { $afterUnderMaintenanceCount = 0 }
  $afterOperationalCount = $afterInUseCount + $afterUnderMaintenanceCount

  Assert-True (($afterTotalAssets -ge ($beforeTotalAssets + 1))) 'Total assets should increase after asset creation'
  Assert-True (($afterOperationalCount -ge ($beforeOperationalCount + 1))) 'Operational count (IN_USE + UNDER_MAINTENANCE) should increase after workflow'
  Assert-True ([int]$afterOverview.totalAssets -ge [int]$beforeOverview.totalAssets + 1) 'Overview totalAssets should increase'
  Assert-True ([int]$afterUtil.totalAssets -ge [int]$beforeUtil.totalAssets + 1) 'Utilization totalAssets should increase'

  $finalAssetSnapshot = $assetDetails

  # Optional cleanup
  $cleanup = [ordered]@{
    attempted = (-not $keepData)
    deleted = $false
    projectDeleted = $false
    error = $null
  }

  if (-not $keepData) {
    try {
      # Return from project first (if assigned), then move back to AVAILABLE to satisfy delete guard.
      try {
        $null = ApiPost ("/assets/{0}/return-project" -f $assetId) $token @{
          returnDate = (Get-Date).ToString('yyyy-MM-dd')
          notes = 'UAT cleanup return from project'
        }
      } catch {
        # Ignore if asset already unassigned.
      }

      $latestForDelete = ApiGet ("/assets/{0}" -f $assetId) $token @{}
      if ($latestForDelete.status -ne 'AVAILABLE') {
        $latestForDelete = ApiPut ("/assets/{0}" -f $assetId) $token @{
          status = 'AVAILABLE'
          notes = 'UAT cleanup set AVAILABLE before delete'
          rowVersion = [int]$latestForDelete.rowVersion
        }
      }

      $null = ApiDelete ("/assets/{0}" -f $assetId) $token @{ rowVersion = [int]$latestForDelete.rowVersion }
      $cleanup.deleted = $true
    } catch {
      $cleanup.error = $_.Exception.Message
    }

    if ($null -ne $createdProjectForUat -and $null -ne $createdProjectForUat.id) {
      try {
        $projectDetails = ApiGet ("/projects/{0}" -f $createdProjectForUat.id) $token @{}
        $projectRowVersion = [int]$projectDetails.rowVersion
        $null = ApiDelete ("/projects/{0}" -f $createdProjectForUat.id) $token @{ rowVersion = $projectRowVersion }
        $cleanup.projectDeleted = $true
      } catch {
        $msg = $_.Exception.Message
        if ($cleanup.error) {
          $cleanup.error = "$($cleanup.error) | project cleanup: $msg"
        } else {
          $cleanup.error = "project cleanup: $msg"
        }
      }
    }
  }

  $result = [ordered]@{
    startedAt = $startAt.ToString('o')
    finishedAt = (Get-Date).ToString('o')
    baseUrl = $base
    scenarios = @(
      'Create asset',
      'Update asset status with rowVersion',
      'Assign asset to project',
      'Assign employee to asset',
      'Create maintenance request',
      'Verify asset detail/history endpoints',
      'Verify reports delta (overview/by-status/utilization)'
    )
    baseline = @{
      totalAssets = $beforeTotalAssets
      inUseCount = $beforeInUseCount
      underMaintenanceCount = $beforeUnderMaintenanceCount
      operationalCount = $beforeOperationalCount
    }
    after = @{
      totalAssets = $afterTotalAssets
      inUseCount = $afterInUseCount
      underMaintenanceCount = $afterUnderMaintenanceCount
      operationalCount = $afterOperationalCount
    }
    entities = @{
      projectId = $project.id
      projectWasAutoCreated = ($null -ne $createdProjectForUat)
      employeeId = $employee.id
      assetId = $assetId
      maintenanceRequestId = $maintenance.id
      finalRowVersion = [int]$finalAssetSnapshot.rowVersion
    }
    cleanup = $cleanup
    status = 'PASS'
  }

  $result | ConvertTo-Json -Depth 12 | Set-Content -Path $resultPath -Encoding UTF8

  $md = @"
# Assets UAT Final Report

- Started: $($result.startedAt)
- Finished: $($result.finishedAt)
- Base URL: $($result.baseUrl)
- Status: **PASS**

## Scenarios Executed
$(($result.scenarios | ForEach-Object { "- $_" }) -join "`n")

## Baseline vs After
- Total assets: $($result.baseline.totalAssets) -> $($result.after.totalAssets)
- IN_USE count: $($result.baseline.inUseCount) -> $($result.after.inUseCount)
- UNDER_MAINTENANCE count: $($result.baseline.underMaintenanceCount) -> $($result.after.underMaintenanceCount)
- Operational count (IN_USE + UNDER_MAINTENANCE): $($result.baseline.operationalCount) -> $($result.after.operationalCount)

## Created Entities
- Asset ID: $($result.entities.assetId)
- Project ID: $($result.entities.projectId)
- Employee ID: $($result.entities.employeeId)
- Maintenance Request ID: $($result.entities.maintenanceRequestId)
- Final Asset Row Version: $($result.entities.finalRowVersion)

## Cleanup
- Attempted: $($result.cleanup.attempted)
- Deleted: $($result.cleanup.deleted)
- Error: $($result.cleanup.error)
"@

  Set-Content -Path $mdPath -Value $md -Encoding UTF8

  Write-Host '========================================'
  Write-Host 'Assets UAT: PASS'
  Write-Host '========================================'
  Write-Host "JSON: $resultPath"
  Write-Host "MD  : $mdPath"
}
catch {
  $err = $_.Exception.Message
  $failed = [ordered]@{
    startedAt = $startAt.ToString('o')
    finishedAt = (Get-Date).ToString('o')
    baseUrl = $base
    assetId = $assetId
    status = 'FAIL'
    error = $err
  }
  $failed | ConvertTo-Json -Depth 8 | Set-Content -Path $resultPath -Encoding UTF8

  $md = @"
# Assets UAT Final Report

- Started: $($failed.startedAt)
- Finished: $($failed.finishedAt)
- Base URL: $($failed.baseUrl)
- Status: **FAIL**
- Asset ID (if created): $($failed.assetId)

## Error
$($failed.error)
"@
  Set-Content -Path $mdPath -Value $md -Encoding UTF8
  Write-Host '========================================'
  Write-Host 'Assets UAT: FAIL'
  Write-Host '========================================'
  Write-Host "JSON: $resultPath"
  Write-Host "MD  : $mdPath"
  throw
}
