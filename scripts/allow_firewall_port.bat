@echo off
:: Batch script to allow port 8000 through Windows Firewall
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Adding Windows Firewall Rule for Port 8000...
    netsh advfirewall firewall add rule name="DocForge Port 8000" dir=in action=allow protocol=TCP localport=8000
    echo [SUCCESS] Port 8000 is now allowed through Windows Firewall.
) else (
    echo [NOTE] Right-click this file and select "Run as administrator" to apply the firewall rule.
)
pause
