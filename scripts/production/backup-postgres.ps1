param(
  [string]$OutputDir = $env:BACKUP_DIR
)

$ErrorActionPreference = "Stop"

function Load-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
      return
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -le 0) {
      return
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim()
    if ($value.Length -ge 2) {
      $first = $value[0]
      $last = $value[$value.Length - 1]
      if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }

    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

Load-DotEnv -Path (Join-Path (Get-Location) ".env")

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = $env:BACKUP_DIR
}

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
$temporaryFile = Join-Path $env:TEMP "apartment_fee_reviewer-$timestamp.dump"
$pgDumpDatabaseUrl = $env:DATABASE_URL `
  -replace "([?&])schema=[^&]+&?", '$1' `
  -replace "[?&]$", ""

& $pgDump.Source $pgDumpDatabaseUrl `
  --format=custom `
  --no-owner `
  --no-privileges `
  --file=$temporaryFile

if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $temporaryFile)) {
  Write-Error "pg_dump failed; backup file was not created."
}

Move-Item -LiteralPath $temporaryFile -Destination $outputFile -Force

Write-Host "PostgreSQL backup written to: $outputFile"
Write-Host "Restore test command:"
Write-Host "pg_restore --clean --if-exists --no-owner --dbname=`"`$env:DATABASE_URL`" `"$outputFile`""
