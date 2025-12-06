# Quick script to run admin panel dev server
# Uses full path to npm since it's not in PATH

Write-Host ""
Write-Host "========================================"
Write-Host "Starting Admin Panel Dev Server"
Write-Host "========================================"
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    & "C:\Program Files\nodejs\npm.cmd" install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Starting dev server..."
& "C:\Program Files\nodejs\npm.cmd" run dev

