@echo off
echo 🚀 Flow App Builder - Installation Script
echo ==========================================
echo.

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install Node.js and npm first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ npm found
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Installation complete!
    echo.
    echo 🎯 To start the application, run:
    echo    npm run dev
    echo.
    echo 📖 Then open your browser to: http://localhost:3000
    echo.
) else (
    echo.
    echo ❌ Installation failed. Please check the error messages above.
    pause
    exit /b 1
)

pause
