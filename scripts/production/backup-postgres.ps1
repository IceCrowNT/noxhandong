param(
  [string]$OutputDir = $env:BACKUP_DIR
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  Write-Error "Missing DATABASE_URL"
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path (Get-Location) ".local\db-backups"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  $candidatePaths = @(
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
    "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
  )

  foreach ($path in $candidatePaths) {
    if (Test-Path -LiteralPath $path) {
      $pgDump = @{ Source = $path }
      break
    }
  }
}

if (-not $pgDump) {
  Write-Error "Cannot find pg_dump. Add PostgreSQL bin folder to PATH or install PostgreSQL command line tools."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $OutputDir "apartment_fee_reviewer-$timestamp.dump"

& $pgDump.Source $env:DATABASE_URL `
  --format=custom `
  --no-owner `
  --no-privileges `
  --file=$outputFile

Write-Host "PostgreSQL backup written to: $outputFile"
Write-Host "Restore test command:"
Write-Host "pg_restore --clean --if-exists --no-owner --dbname=`"`$env:DATABASE_URL`" `"$outputFile`""
