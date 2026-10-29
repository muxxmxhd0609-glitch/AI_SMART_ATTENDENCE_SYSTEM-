@echo off
title RGIT AI Smart Attendance - Host Server Launcher
color 0A
setlocal enabledelayedexpansion

echo ============================================================
echo   RGIT BANGALORE - AI SMART ATTENDANCE (HOST LAUNCHER)
echo ============================================================
echo.
echo [1/2] Starting Python FastAPI Backend on Port 8000...
start "RGIT Backend (Port 8000)" cmd /k "title RGIT Backend (Port 8000) && python run_backend.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Vite React Frontend on Port 5173...
start "RGIT Frontend (Port 5173)" cmd /k "title RGIT Frontend (Port 5173) && cd frontend && npm run dev -- --host"

for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -InterfaceAlias 'Wi-Fi' -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress"') do set WIFI_IP=%%i
if "%WIFI_IP%"=="" for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress"') do set WIFI_IP=%%i
if "%WIFI_IP%"=="" set WIFI_IP=10.127.131.207

timeout /t 2 /nobreak >nul

:: Automatically open browser for the user
echo.
echo [OK] Automatically opening Web App in default browser...
start http://localhost:5173

:MENU
cls
echo ============================================================
echo        RGIT BANGALORE - AI SMART ATTENDANCE IS RUNNING!
echo ============================================================
echo.
echo   Local PC Access:     http://localhost:5173
echo   Mobile / Wi-Fi:      http://%WIFI_IP%:5173
echo   Swagger API Docs:    http://localhost:8000/docs
echo.
echo ============================================================
echo              CHOOSE AN ACTION BUTTON BELOW:
echo ============================================================
echo   [1] Open Web App in Browser (http://localhost:5173)
echo   [2] Open Mobile Wi-Fi Link (http://%WIFI_IP%:5173)
echo   [3] Open Swagger API Docs (http://localhost:8000/docs)
echo   [4] Launch Visual Desktop Control Panel (GUI Buttons)
echo   [5] Restart All Hosting Servers
echo   [6] Stop All Hosting Servers
echo   [7] Exit This Launcher Window (Keep Servers Running)
echo ============================================================
echo.
set /p opt="Press a number button [1-7] and press Enter: "

if "%opt%"=="1" (
    start http://localhost:5173
    goto MENU
)
if "%opt%"=="2" (
    start http://%WIFI_IP%:5173
    goto MENU
)
if "%opt%"=="3" (
    start http://localhost:8000/docs
    goto MENU
)
if "%opt%"=="4" (
    start "" "%~dp0HOST_CONTROL_PANEL.bat"
    goto MENU
)
if "%opt%"=="5" (
    echo Restarting servers...
    call "%~dp0STOP_HOSTING.bat" --quiet
    timeout /t 2 /nobreak >nul
    call "%~dp0START_HOSTING.bat"
    exit /b
)
if "%opt%"=="6" (
    call "%~dp0STOP_HOSTING.bat"
    exit /b
)
if "%opt%"=="7" (
    exit /b
)

goto MENU
