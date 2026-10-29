@echo off
title RGIT AI Smart Attendance - Stop Hosting Servers
color 0C

echo ============================================================
echo   RGIT BANGALORE - STOPPING HOSTING SERVERS
echo ============================================================
echo.

echo [1/2] Terminating process on Port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
    echo   [Stopped] PID %%a
)

echo [2/2] Terminating process on Port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
    echo   [Stopped] PID %%a
)

echo.
echo ============================================================
echo        ALL RGIT ATTENDANCE SERVERS ARE NOW STOPPED!
echo ============================================================

if "%1"=="--quiet" exit /b

:STOP_MENU
echo.
echo   [1] Start Hosting Again (Launch All Servers)
echo   [2] Launch Visual Desktop Control Panel (GUI Buttons)
echo   [3] Exit Window
echo ============================================================
echo.
set /p sopt="Press a number button [1-3] and press Enter: "

if "%sopt%"=="1" (
    call "%~dp0START_HOSTING.bat"
    exit /b
)
if "%sopt%"=="2" (
    start "" "%~dp0HOST_CONTROL_PANEL.bat"
    exit /b
)
if "%sopt%"=="3" (
    exit /b
)

goto STOP_MENU
