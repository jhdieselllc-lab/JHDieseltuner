$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
New-Item -ItemType Directory -Force verification-results | Out-Null
$installDir = Join-Path $env:LOCALAPPDATA 'Programs\JH-Diesel-CI'
$installer = Get-ChildItem installable/JH-Diesel-Setup-*.exe | Select-Object -First 1
if (!$installer) { throw 'Installer was not produced' }
$installedExe = Join-Path $installDir 'JH Diesel Calibration Suite.exe'
$report = @{ installer = $installer.Name; install = $false; launch = $false; uninstall = $false }
try {
  $process = Start-Process -FilePath $installer.FullName -ArgumentList "/S /D=$installDir" -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Installer exited $($process.ExitCode)" }
  if (!(Test-Path $installedExe)) { throw 'Installed application executable is missing' }
  $report.install = $true
  node scripts/windows-smoke.cjs $installedExe
  if ($LASTEXITCODE -ne 0) { throw 'Installed application smoke test failed' }
  $report.launch = $true
} finally {
  $uninstaller = Join-Path $installDir 'Uninstall JH Diesel.exe'
  if (Test-Path $uninstaller) {
    # The uninstaller must preserve user-created files in the install folder.
    $sentinel = Join-Path $installDir 'user-file-keep.txt'
    Set-Content $sentinel 'Preserve this user-created file'
    $process = Start-Process -FilePath $uninstaller -ArgumentList "/S _?=$installDir" -Wait -PassThru
    $report.uninstall = ($process.ExitCode -eq 0) -and !(Test-Path $installedExe) -and (Test-Path $sentinel)
  }
  $report | ConvertTo-Json | Set-Content verification-results/install-uninstall.json
}
if (!$report.uninstall) { throw 'Uninstall failed or did not preserve the user-created file' }
