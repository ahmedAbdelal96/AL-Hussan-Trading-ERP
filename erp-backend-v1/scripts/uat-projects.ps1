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

function UploadProjectDocument($projectId, $token, $filePath, $documentType, $documentName, $notes) {
  $url = $base + "/projects/$projectId/documents"
  $curlArgs = @(
    '-sS',
    '-X', 'POST',
    '-H', "Authorization: Bearer $token",
    '-F', "files=@$filePath;type=image/png",
    '-F', "documentType=$documentType",
    '-F', "documentName=$documentName",
    '-F', "notes=$notes",
    $url
  )
  $responseText = & curl.exe @curlArgs

  if (-not $responseText) {
    throw 'Document upload failed: empty response'
  }

  try {
    return $responseText | ConvertFrom-Json
  } catch {
    throw "Document upload returned invalid JSON: $responseText"
  }
}

function Assert-True($condition, $message) {
  if (-not $condition) { throw "ASSERTION FAILED: $message" }
}

function To-Number($value) {
  if ($null -eq $value) { return [double]0 }
  return [double]$value
}

$startAt = Get-Date
$resultPath = Join-Path $PSScriptRoot 'uat-projects-result.json'
$mdPath = Join-Path $PSScriptRoot 'uat-projects-final-report.md'
$tempDocPath = Join-Path $PSScriptRoot 'uat-projects-temp-document.png'

$projectId = $null
$projectCode = $null
$assetId = $null
$tempEmployeeId = $null
$tempEmployeeRowVersion = $null
$employeeAssignmentId = $null
$assetAssignmentId = $null
$documentId = $null

$cleanup = [ordered]@{
  attempted = (-not $keepData)
  documentDeleted = $false
  assetReturned = $false
  employeeUnassigned = $false
  projectDeleted = $false
  assetDeleted = $false
  tempFileDeleted = $false
  errors = @()
}

try {
  Write-Host '[UAT-Projects] Step 0: login'
  $login = Invoke-RestMethod -Method Post -Uri ($base + '/auth/login') -ContentType 'application/json' -Body (@{ email = $email; password = $pass; rememberMe = $false } | ConvertTo-Json)
  $token = $login.tokens.accessToken
  Assert-True ($null -ne $token -and $token.Length -gt 10) 'Login token not returned'

  Write-Host '[UAT-Projects] Step 1: baseline stats'
  $beforeStats = ApiGet '/projects/statistics' $token @{}
  $beforeReportsOverview = ApiGet '/reports/projects/overview' $token @{}

  Write-Host '[UAT-Projects] Step 2: create isolated employee'
  $ts = Get-Date -Format 'yyyyMMddHHmmss'
  $createdEmployee = ApiPost '/employees' $token @{
    firstName = 'UAT'
    lastName = "Project$($ts.Substring($ts.Length - 4))"
    nationalId = "2$($ts.Substring($ts.Length - 9))"
    email = "uat.projects.employee.$ts@erp.sys"
    employmentType = 'FULL_TIME'
    status = 'ACTIVE'
    hireDate = '2025-01-01'
    baseSalary = 10000
    currency = 'SAR'
  }
  $tempEmployeeId = $createdEmployee.id
  $tempEmployeeRowVersion = [int]$createdEmployee.rowVersion
  Assert-True ($null -ne $tempEmployeeId) 'Employee creation failed for projects UAT'

  Write-Host '[UAT-Projects] Step 3: create isolated asset'
  $createdAsset = ApiPost '/assets' $token @{
    name = "UAT Project Asset $ts"
    assetType = 'EQUIPMENT'
    category = 'UAT Equipment'
    manufacturer = 'UAT'
    model = 'PRJ-UAT'
    serialNumber = "PRJ-UAT-$ts"
    purchaseDate = '2026-01-01'
    purchasePrice = 25000
    currentLocation = 'UAT Yard'
    status = 'AVAILABLE'
    notes = 'UAT projects module isolated scenario'
  }
  $assetId = $createdAsset.id
  Assert-True ($null -ne $assetId) 'Asset creation failed'

  Write-Host '[UAT-Projects] Step 4: create project'
  $createdProject = ApiPost '/projects' $token @{
    name = "UAT Project Full Flow $ts"
    description = 'UAT full flow for projects module'
    clientName = 'UAT Client'
    clientPhone = '+966500000000'
    clientEmail = "uat.projects.$ts@erp.sys"
    status = 'PLANNING'
    plannedStartDate = (Get-Date).ToString('yyyy-MM-dd')
    budget = 500000
    notes = 'Created by UAT script'
  }
  $projectId = $createdProject.id
  $projectCode = $createdProject.projectCode
  Assert-True ($null -ne $projectId) 'Project creation failed'
  Assert-True ($createdProject.status -eq 'PLANNING') 'Project initial status should be PLANNING'

  Write-Host '[UAT-Projects] Step 5: update project'
  $updatedProject = ApiPut ("/projects/{0}" -f $projectId) $token @{
    description = 'Description updated by UAT'
    notes = 'UAT update phase'
    rowVersion = [int]$createdProject.rowVersion
  }
  Assert-True ($updatedProject.description -eq 'Description updated by UAT') 'Project update did not persist'

  Write-Host '[UAT-Projects] Step 6: stale rowVersion guard'
  $staleRejected = $false
  try {
    $null = ApiPut ("/projects/{0}" -f $projectId) $token @{
      notes = 'stale rowVersion update attempt'
      rowVersion = [int]$createdProject.rowVersion
    }
  } catch {
    $staleRejected = $true
  }
  Assert-True $staleRejected 'Stale rowVersion update should be rejected'

  Write-Host '[UAT-Projects] Step 7: update progress'
  $progressed = ApiPut ("/projects/{0}/progress" -f $projectId) $token @{
    completionPercentage = 25
    progressNotes = 'Progress reached 25%'
  }
  Assert-True ((To-Number $progressed.completionPercentage) -eq 25) 'Progress update failed'

  Write-Host '[UAT-Projects] Step 8: assign employee'
  $assignedEmployee = ApiPost ("/projects/{0}/employees" -f $projectId) $token @{
    employeeId = $tempEmployeeId
    role = 'ENGINEER'
    percentage = 100
    assignedDate = (Get-Date).ToString('yyyy-MM-dd')
    notes = 'UAT employee assignment'
  }
  $employeeAssignmentId = $assignedEmployee.id
  Assert-True ($null -ne $employeeAssignmentId) 'Employee assignment failed'

  Write-Host '[UAT-Projects] Step 9: assign asset'
  $assignedAsset = ApiPost ("/projects/{0}/assets" -f $projectId) $token @{
    assetId = $assetId
    location = 'UAT Site'
    assignedDate = (Get-Date).ToString('yyyy-MM-dd')
    notes = 'UAT asset assignment'
  }
  $assetAssignmentId = $assignedAsset.id
  Assert-True ($null -ne $assetAssignmentId) 'Asset assignment failed'

  Write-Host '[UAT-Projects] Step 10: list assignments'
  $projectEmployees = ApiGet ("/projects/{0}/employees" -f $projectId) $token @{ activeOnly = 'true' }
  $projectAssets = ApiGet ("/projects/{0}/assets" -f $projectId) $token @{ activeOnly = 'true' }
  Assert-True (@($projectEmployees).Count -ge 1) 'Project employees list should include assignment'
  Assert-True (@($projectAssets).Count -ge 1) 'Project assets list should include assignment'

  Write-Host '[UAT-Projects] Step 11: documents full flow'
  $tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9Ww1QAAAAASUVORK5CYII='
  [IO.File]::WriteAllBytes($tempDocPath, [Convert]::FromBase64String($tinyPngBase64))
  $uploadResp = UploadProjectDocument $projectId $token $tempDocPath 'REPORT' "UAT Document $ts" 'UAT docs flow'
  $uploadedDoc = @($uploadResp | Select-Object -First 1)[0]
  $documentId = $uploadedDoc.id
  Assert-True ($null -ne $documentId) 'Project document upload failed'

  $docs = ApiGet ("/projects/{0}/documents" -f $projectId) $token @{}
  Assert-True ((@($docs | Where-Object { $_.id -eq $documentId }).Count) -eq 1) 'Uploaded document not found in project documents list'

  $download = Invoke-WebRequest -UseBasicParsing -Method Get -Uri ($base + "/projects/$projectId/documents/$documentId/download") -Headers @{ Authorization = "Bearer $token" }
  Assert-True ($download.StatusCode -eq 200) 'Document download should return 200'
  Assert-True ($download.Content.Length -gt 0) 'Downloaded document is empty'

  $null = ApiDelete ("/projects/{0}/documents/{1}" -f $projectId, $documentId) $token @{}
  $cleanup.documentDeleted = $true
  $documentId = $null

  Write-Host '[UAT-Projects] Step 12: reports endpoints'
  $reportsByStatus = ApiGet '/reports/projects/by-status' $token @{}
  $reportsOverview = ApiGet '/reports/projects/overview' $token @{}
  Assert-True ($null -ne $reportsByStatus) 'Reports by-status endpoint failed in UAT'
  Assert-True ($null -ne $reportsOverview) 'Reports overview endpoint failed in UAT'

  if (-not $keepData) {
    try {
      if ($assetAssignmentId) {
        $null = ApiDelete ("/projects/{0}/assets/{1}" -f $projectId, $assetAssignmentId) $token @{}
        $cleanup.assetReturned = $true
      }
    } catch {
      $cleanup.errors += "asset unassign cleanup: $($_.Exception.Message)"
    }

    try {
      if ($employeeAssignmentId) {
        $null = ApiDelete ("/projects/{0}/employees/{1}" -f $projectId, $employeeAssignmentId) $token @{}
        $cleanup.employeeUnassigned = $true
      }
    } catch {
      $cleanup.errors += "employee unassign cleanup: $($_.Exception.Message)"
    }

    try {
      if ($projectId) {
        $projectForDelete = ApiGet ("/projects/{0}" -f $projectId) $token @{}
        $null = ApiDelete ("/projects/{0}" -f $projectId) $token @{ rowVersion = [int]$projectForDelete.rowVersion }
        $cleanup.projectDeleted = $true
      }
    } catch {
      $cleanup.errors += "project delete cleanup: $($_.Exception.Message)"
    }

    try {
      if ($tempEmployeeId) {
        if (-not $tempEmployeeRowVersion) {
          $employeeForDelete = ApiGet ("/employees/{0}" -f $tempEmployeeId) $token @{}
          $tempEmployeeRowVersion = [int]$employeeForDelete.rowVersion
        }
        $null = ApiDelete ("/employees/{0}" -f $tempEmployeeId) $token @{ rowVersion = $tempEmployeeRowVersion }
      }
    } catch {
      $cleanup.errors += "employee delete cleanup: $($_.Exception.Message)"
    }

    try {
      if ($assetId) {
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
      }
    } catch {
      $cleanup.errors += "asset delete cleanup: $($_.Exception.Message)"
    }
  }

  if (Test-Path $tempDocPath) {
    Remove-Item -Path $tempDocPath -Force
    $cleanup.tempFileDeleted = $true
  }

  $afterStats = ApiGet '/projects/statistics' $token @{}
  $afterReportsOverview = ApiGet '/reports/projects/overview' $token @{}

  $result = [ordered]@{
    startedAt = $startAt.ToString('o')
    finishedAt = (Get-Date).ToString('o')
    baseUrl = $base
    scenario = @(
      'create isolated asset',
      'create project',
      'update project with rowVersion',
      'reject stale rowVersion update',
      'update project progress',
      'assign employee to project',
      'assign asset to project',
      'validate project employees/assets endpoints',
      'upload/list/download/delete project documents',
      'validate project reports endpoints',
      'cleanup created entities'
    )
    entities = @{
      projectId = $projectId
      projectCode = $projectCode
      assetId = $assetId
      employeeAssignmentId = $employeeAssignmentId
      assetAssignmentId = $assetAssignmentId
      tempEmployeeId = $tempEmployeeId
    }
    baseline = @{
      projectsStats = $beforeStats
      reportsOverview = $beforeReportsOverview
    }
    after = @{
      projectsStats = $afterStats
      reportsOverview = $afterReportsOverview
    }
    checks = @{
      staleRowVersionRejected = $staleRejected
      projectProgress = 25
      employeeAssignmentsCount = @($projectEmployees).Count
      assetAssignmentsCount = @($projectAssets).Count
    }
    cleanup = $cleanup
    pass = $true
  }

  ($result | ConvertTo-Json -Depth 30) | Out-File -FilePath $resultPath -Encoding utf8

  $md = @()
  $md += '# Projects UAT Final Report'
  $md += ''
  $md += "Generated at: $($result.finishedAt)"
  $md += ''
  $md += '## Result'
  $md += '- PASS'
  $md += ''
  $md += '## Scenario'
  foreach ($s in $result.scenario) { $md += "- $s" }
  $md += ''
  $md += '## Validation'
  $md += "- stale rowVersion rejected: $staleRejected"
  $md += "- employee assignments count: $(@($projectEmployees).Count)"
  $md += "- asset assignments count: $(@($projectAssets).Count)"
  $md += '- document flow: upload/list/download/delete PASSED'
  $md += ''
  $md += '## Cleanup'
  $md += "- attempted: $($cleanup.attempted)"
  $md += "- document deleted: $($cleanup.documentDeleted)"
  $md += "- asset returned: $($cleanup.assetReturned)"
  $md += "- employee unassigned: $($cleanup.employeeUnassigned)"
  $md += "- project deleted: $($cleanup.projectDeleted)"
  $md += "- asset deleted: $($cleanup.assetDeleted)"
  $md += "- temp file deleted: $($cleanup.tempFileDeleted)"
  if ($cleanup.errors.Count -gt 0) {
    $md += '- cleanup errors:'
    foreach ($e in $cleanup.errors) { $md += "  - $e" }
  }

  $md -join "`n" | Out-File -FilePath $mdPath -Encoding utf8

  Write-Host 'Projects UAT completed successfully.'
  Write-Host "JSON report: $resultPath"
  Write-Host "Markdown report: $mdPath"
} catch {
  if (Test-Path $tempDocPath) {
    Remove-Item -Path $tempDocPath -Force
    $cleanup.tempFileDeleted = $true
  }

  $errMessage = $_.Exception.Message
  try {
    if ($_.Exception.Response) {
      $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      $body = $reader.ReadToEnd()
      if ($body) {
        $errMessage = "$errMessage | response: $body"
      }
    }
  } catch {}

  $failResult = [ordered]@{
    startedAt = $startAt.ToString('o')
    finishedAt = (Get-Date).ToString('o')
    baseUrl = $base
    entities = @{
      projectId = $projectId
      projectCode = $projectCode
      assetId = $assetId
      tempEmployeeId = $tempEmployeeId
      employeeAssignmentId = $employeeAssignmentId
      assetAssignmentId = $assetAssignmentId
      documentId = $documentId
    }
    cleanup = $cleanup
    pass = $false
    error = $errMessage
  }

  ($failResult | ConvertTo-Json -Depth 20) | Out-File -FilePath $resultPath -Encoding utf8
  Write-Error "Projects UAT failed: $errMessage"
  Write-Host "Failure report: $resultPath"
  exit 1
}



