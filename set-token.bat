@echo off
REM Simple batch script to set admin token
REM Usage: set-token.bat

echo ========================================
echo Admin Token Setup
echo ========================================
echo.
echo To get your admin token:
echo 1. Open admin panel in browser and login
echo 2. Press F12 to open browser console
echo 3. Type: localStorage.getItem("token")
echo 4. Copy the token that appears
echo.

call npm run set-token

pause

