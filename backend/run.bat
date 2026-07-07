@echo off
echo ======================================
echo   CommAI Java — Starting Server...
echo ======================================
echo.

cd /d "%~dp0"

if not exist "out\com\commai\Main.class" (
    echo [ERROR] No compiled classes found. Run compile.bat first.
    pause
    exit /b 1
)

echo Starting server on http://localhost:8080
echo Press Ctrl+C to stop.
echo.

java -cp out com.commai.Main

pause
