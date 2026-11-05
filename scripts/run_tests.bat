@echo off
echo ===================================================
echo Running DocForge Test Suite (PyTest)
echo ===================================================
echo.
cd /d "%~dp0\.."
"C:\Users\yogit\AppData\Local\Programs\Python\Python311\python.exe" -m pytest backend/tests/test_docforge.py -v
echo.
pause
