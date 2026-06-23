param(
  [Parameter(Mandatory = $true)]
  [string]$SourceZip,

  [Parameter(Mandatory = $true)]
  [string]$DatabaseDump,

  [string]$AppDir = "C:\apps\noxh-an-dong",
  [string]$IncomingDir = "C:\backups\noxh-an-dong\incoming",
  [string]$EnvBackup = "C:\Windows\Temp\noxh-env.backup",
  [string]$ServiceName = "noxh-an-dong"
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

$env:Path = "C:\PostgreSQL\pgsql\bin;C:\Program Files\nodejs;C:\Program Files\Git\cmd;C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links;$env:Path"

Write-Host "== Phase 2 deploy from local zip =="
Write-Host "Source zip  : $SourceZip"
Write-Host "DB dump     : $DatabaseDump"
Write-Host "App dir     : $AppDir"
Write-Host "Incoming dir: $IncomingDir"

if (-not (Test-Path $SourceZip)) { throw "Missing source zip: $SourceZip" }
if (-not (Test-Path $DatabaseDump)) { throw "Missing database dump: $DatabaseDump" }

$envFile = Join-Path $AppDir ".env"
if (-not (Test-Path $envFile)) { throw "Missing production .env at $envFile" }

New-Item -ItemType Directory -Force -Path $IncomingDir | Out-Null
Copy-Item -LiteralPath $envFile -Destination $EnvBackup -Force

try {
  if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Write-Host "Stopping service $ServiceName"
    Stop-Service -Name $ServiceName -Force
  } else {
    Write-Warning "Service $ServiceName not found. Continue without stopping service."
  }

  $stagingDir = "$AppDir.__incoming"
  Remove-Item -LiteralPath $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

  Write-Host "Extracting source zip"
  Expand-Archive -LiteralPath $SourceZip -DestinationPath $stagingDir -Force

  if (Test-Path $AppDir) {
    Remove-Item -LiteralPath $AppDir -Recurse -Force
  }
  Move-Item -LiteralPath $stagingDir -Destination $AppDir
  Copy-Item -LiteralPath $EnvBackup -Destination (Join-Path $AppDir ".env") -Force

  Set-Location $AppDir
  Load-DotEnv -Path (Join-Path $AppDir ".env")
  if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    throw "Missing DATABASE_URL after loading production .env"
  }

  Write-Host "Versions:"
  node -v
  npm -v

  Write-Host "npm ci"
  npm ci

  Write-Host "prisma generate"
  npm run prisma:generate

  Write-Host "prisma migrate deploy"
  npm run prisma:migrate:deploy

  Write-Host "build"
  npm run build

  Write-Host "restore database"
  pg_restore --clean --if-exists --no-owner --dbname "$env:DATABASE_URL" $DatabaseDump

  if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Write-Host "Starting service $ServiceName"
    Start-Service -Name $ServiceName
  }

  Write-Host "Deploy completed successfully."
  Write-Host "Remember: copy public\\uploads\\evidence separately if local DB references new evidence files."
}
catch {
  Write-Error $_
  if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    try { Start-Service -Name $ServiceName } catch {}
  }
  throw
}
