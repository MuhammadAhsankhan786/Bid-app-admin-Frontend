@echo off
REM Quick script to run admin panel dev server
REM Uses full path to npm since it's not in PATH

echo.
echo ========================================
echo Starting Admin Panel Dev Server
echo ========================================
echo.

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    "C:\Program Files\nodejs\npm.cmd" install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting dev server...
"C:\Program Files\nodejs\npm.cmd" run dev

pause

