@echo off
title DocForge Personal Toolbox
color 0B
cls

echo ========================================================
echo               DOCFORGE PERSONAL TOOLBOX
echo ========================================================
echo.
echo  Your Master Password is set to:  SHIRO
echo.
echo  Access from this PC:
echo    http://localhost:8000
echo.
echo  Access from your Phone / Tablet / Laptop (same Wi-Fi):
echo    http://192.168.1.10:8000
echo.
echo ========================================================
echo.

:: Check if port 8000 is already active
netstat -aon | findstr :8000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] DocForge server is already running on port 8000!
) else (
    echo [STARTING] Launching DocForge backend...
    cd /d "%~dp0"
    start /b "DocForge" "C:\Users\yogit\AppData\Local\Programs\Python\Python311\python.exe" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
    timeout /t 2 >nul
)

echo.
echo Opening DocForge in your browser...
start http://localhost:8000

echo.
echo Keep this window open or minimize it. Press any key to stop DocForge.
pause >nul

echo Stopping DocForge...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo DocForge stopped.
