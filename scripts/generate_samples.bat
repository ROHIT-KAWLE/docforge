@echo off
echo ===================================================
echo Generating Test Document Samples
echo ===================================================
echo.
cd /d "%~dp0\.."
"C:\Users\yogit\AppData\Local\Programs\Python\Python311\python.exe" scripts/generate_test_documents.py
echo.
pause
