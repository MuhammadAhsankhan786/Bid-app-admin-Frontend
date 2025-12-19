# PowerShell Script to Run Admin API Tests
# Usage: .\run-api-test.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Admin Panel API Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if token is provided
$token = $env:ADMIN_TOKEN

if (-not $token) {
    Write-Host "WARNING: Admin token not found in environment variable ADMIN_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please provide your admin token:" -ForegroundColor White
    Write-Host "1. Login to admin panel in browser" -ForegroundColor Gray
    Write-Host "2. Open browser console (F12)" -ForegroundColor Gray
    Write-Host "3. Run: localStorage.getItem('token')" -ForegroundColor Gray
    Write-Host "4. Copy the token" -ForegroundColor Gray
    Write-Host ""
    $token = Read-Host "Enter your admin token (or press Enter to skip)"
    
    if ($token) {
        $env:ADMIN_TOKEN = $token
        Write-Host "SUCCESS: Token set!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "WARNING: Running without token - some APIs may fail" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "SUCCESS: Admin token found in environment" -ForegroundColor Green
    Write-Host ""
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Run the test
Write-Host "Starting API tests..." -ForegroundColor Cyan
Write-Host ""
npm run test:apis

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check ADMIN_API_TEST_REPORT.md for detailed results" -ForegroundColor Green
Write-Host ""

