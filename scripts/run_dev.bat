@echo off
echo ===================================================
echo Starting DocForge in Development Mode
echo ===================================================
echo.

:: Clear any stale process listening on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Clearing stale process on port 8000 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

echo Starting FastAPI Backend (Port 8000)...
start "DocForge Backend" cmd /k "cd /d %~dp0\.. && C:\Users\yogit\AppData\Local\Programs\Python\Python311\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite Dev Server (Port 5173)...
start "DocForge Frontend" cmd /k "cd /d %~dp0\..\frontend && npm run dev"

echo.
echo Dev servers started:
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo.
pause
