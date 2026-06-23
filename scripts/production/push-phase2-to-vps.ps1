$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$SourceZip,

  [Parameter(Mandatory = $true)]
  [string]$DatabaseDump,

  [string]$SshUser = "Administrator",
  [string]$SshHost = "64.176.81.118",
  [string]$RemoteIncomingDir = "C:/backups/noxh-an-dong/incoming",
  [switch]$RunRemoteDeploy
)

if (-not (Test-Path $SourceZip)) { throw "Missing source zip: $SourceZip" }
if (-not (Test-Path $DatabaseDump)) { throw "Missing database dump: $DatabaseDump" }

$remoteTarget = "$SshUser@${SshHost}:$RemoteIncomingDir/"
$sourceName = Split-Path $SourceZip -Leaf
$dumpName = Split-Path $DatabaseDump -Leaf

Write-Host "Uploading source zip..."
scp $SourceZip $remoteTarget
if ($LASTEXITCODE -ne 0) { throw "scp source zip failed" }

Write-Host "Uploading database dump..."
scp $DatabaseDump $remoteTarget
if ($LASTEXITCODE -ne 0) { throw "scp database dump failed" }

Write-Host ""
Write-Host "Upload completed."
Write-Host "Source zip : $sourceName"
Write-Host "DB dump    : $dumpName"
Write-Host ""

$remoteCommand = @"
powershell -ExecutionPolicy Bypass -File C:\apps\noxh-an-dong\scripts\production\deploy-phase2-from-local-zip.ps1 -SourceZip `"$RemoteIncomingDir/$sourceName`" -DatabaseDump `"$RemoteIncomingDir/$dumpName`"
"@

Write-Host "Remote deploy command:"
Write-Host "ssh $SshUser@$SshHost $remoteCommand"

if ($RunRemoteDeploy) {
  Write-Host ""
  Write-Host "Running remote deploy..."
  ssh $SshUser@$SshHost $remoteCommand
  if ($LASTEXITCODE -ne 0) { throw "remote deploy failed" }
}
