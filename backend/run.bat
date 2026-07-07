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

REM Load .env variables if the file exists
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
        if not "%%B"=="" set "%%A=%%B"
    )
)

echo Starting server on http://localhost:8080
echo Press Ctrl+C to stop.
echo.

java -cp out com.commai.Main

pause
