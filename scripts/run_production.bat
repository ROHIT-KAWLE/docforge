@echo off
echo ===================================================
echo Starting DocForge Personal Document Toolbox (Production)
echo ===================================================
echo.

:: Clear any stale process listening on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Clearing stale process on port 8000 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo Local URL:   http://localhost:8000
echo Network URL: Accessible from phone/tablet on same Wi-Fi
echo.

cd /d "%~dp0\.."
"C:\Users\yogit\AppData\Local\Programs\Python\Python311\python.exe" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
pause
