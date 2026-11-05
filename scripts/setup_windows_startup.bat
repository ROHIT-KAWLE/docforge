@echo off
echo ========================================================
echo Installing DocForge to Windows Startup (Silent Autostart)
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set VBS_TARGET=%SCRIPT_DIR%start_silent.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SHORTCUT_PATH=%STARTUP_DIR%\DocForge.lnk

powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT_PATH%');$s.TargetPath='wscript.exe';$s.Arguments='\"%VBS_TARGET%\"';$s.WorkingDirectory='%SCRIPT_DIR%';$s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [SUCCESS] DocForge has been added to your Windows Startup!
    echo Every time you turn on or log in to your PC, DocForge will run
    echo silently in the background on port 8000.
    echo.
    echo To access from this PC: http://localhost:8000
    echo To access from your phone/tablet: http://^<YOUR_PC_IP^>:8000
    echo.
    echo (To remove from startup at any time, simply delete: "%SHORTCUT_PATH%")
) else (
    echo [ERROR] Failed to create startup shortcut.
)

echo.
pause
