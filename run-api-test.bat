@echo off
REM Batch Script to Run Admin API Tests
REM Usage: run-api-test.bat

echo ========================================
echo Admin Panel API Testing Script
echo ========================================
echo.

REM Check if token is provided
if "%ADMIN_TOKEN%"=="" (
    echo ⚠️  Admin token not found in environment variable ADMIN_TOKEN
    echo.
    echo Please provide your admin token:
    echo 1. Login to admin panel in browser
    echo 2. Open browser console (F12)
    echo 3. Run: localStorage.getItem('token')
    echo 4. Copy the token
    echo.
    set /p ADMIN_TOKEN="Enter your admin token (or press Enter to skip): "
    
    if "%ADMIN_TOKEN%"=="" (
        echo ⚠️  Running without token - some APIs may fail
        echo.
    ) else (
        echo ✅ Token set!
        echo.
    )
) else (
    echo ✅ Admin token found in environment
    echo.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Run the test
echo 🚀 Starting API tests...
echo.
call npm run test:apis

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo 📄 Check ADMIN_API_TEST_REPORT.md for detailed results
echo.
pause

