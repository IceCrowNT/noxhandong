$ErrorActionPreference = "Stop"

$serviceName = "postgresql-x64-17"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
  Write-Host "Stopping PostgreSQL Windows service: $serviceName"
  Stop-Service -Name $serviceName
  exit 0
}

$runtimeDir = Join-Path $env:USERPROFILE "apartment_fee_reviewer_runtime"
$pgBin = Join-Path $runtimeDir "postgresql-17\pgsql\bin"
$dataDir = Join-Path $runtimeDir "postgres-data"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"

if (-not (Test-Path -LiteralPath $pgCtl)) {
  throw "Cannot find PostgreSQL service '$serviceName' or portable pg_ctl.exe at $pgCtl."
}

if (-not (Test-Path -LiteralPath (Join-Path $dataDir "PG_VERSION"))) {
  throw "Cannot find portable PostgreSQL data directory at $dataDir."
}

Write-Host "Stopping PostgreSQL portable fallback..."
& $pgCtl -D $dataDir stop -m fast
