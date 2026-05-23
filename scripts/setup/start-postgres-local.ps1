$ErrorActionPreference = "Stop"

$serviceName = "postgresql-x64-17"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
  if ($service.Status -ne "Running") {
    Write-Host "Starting PostgreSQL Windows service: $serviceName"
    Start-Service -Name $serviceName
    $service.WaitForStatus("Running", "00:00:30")
  } else {
    Write-Host "PostgreSQL Windows service is already running: $serviceName"
  }

  Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, OwningProcess
  exit 0
}

$runtimeDir = Join-Path $env:USERPROFILE "apartment_fee_reviewer_runtime"
$pgBin = Join-Path $runtimeDir "postgresql-17\pgsql\bin"
$dataDir = Join-Path $runtimeDir "postgres-data"
$logFile = Join-Path $runtimeDir "postgres.log"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"

if (-not (Test-Path -LiteralPath $pgCtl)) {
  throw "Cannot find PostgreSQL service '$serviceName' or portable pg_ctl.exe at $pgCtl."
}

if (-not (Test-Path -LiteralPath (Join-Path $dataDir "PG_VERSION"))) {
  throw "Cannot find portable PostgreSQL data directory at $dataDir."
}

$listening = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if ($listening) {
  Write-Host "PostgreSQL is already listening on port 5432."
  $listening | Select-Object LocalAddress, LocalPort, OwningProcess
  exit 0
}

Write-Host "Starting PostgreSQL portable fallback..."
& $pgCtl -D $dataDir -l $logFile start
Start-Sleep -Seconds 3

$listening = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $listening) {
  Write-Host "Port 5432 is not listening after start. Recent log:"
  Get-Content -Tail 40 -LiteralPath $logFile
  exit 1
}

Write-Host "PostgreSQL portable started. Log: $logFile"
$listening | Select-Object LocalAddress, LocalPort, OwningProcess
