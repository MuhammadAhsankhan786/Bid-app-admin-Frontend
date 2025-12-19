# PowerShell Script to Set Admin Token
# Usage: .\set-token.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Admin Token Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To get your admin token:" -ForegroundColor White
Write-Host "1. Open admin panel in browser and login" -ForegroundColor Gray
Write-Host "2. Press F12 to open browser console" -ForegroundColor Gray
Write-Host "3. Type: localStorage.getItem('token')" -ForegroundColor Gray
Write-Host "4. Copy the token that appears" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Paste your admin token here"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "ERROR: No token provided. Exiting..." -ForegroundColor Red
    exit 1
}

$token = $token.Trim()
$tokenFilePath = Join-Path $PSScriptRoot ".admin_token"

try {
    $token | Out-File -FilePath $tokenFilePath -Encoding utf8 -NoNewline
    Write-Host ""
    Write-Host "SUCCESS: Token saved successfully!" -ForegroundColor Green
    Write-Host "   Saved to: $tokenFilePath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Now you can run: npm run test:apis" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "ERROR: Could not save token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

