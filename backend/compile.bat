@echo off
echo ======================================
echo   CommAI Java — Compiling...
echo ======================================
echo.

cd /d "%~dp0"

REM Clean old output
if exist "out" rmdir /s /q "out"
mkdir "out"

REM Compile all files at once by specifying packages
javac -encoding UTF-8 -d out src\com\commai\*.java src\com\commai\auth\*.java src\com\commai\engine\*.java src\com\commai\handlers\*.java src\com\commai\util\*.java

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Compilation FAILED. Fix errors above.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Compilation complete!
echo Output: %~dp0out\
echo.
echo Run 'run.bat' to start the server.
echo ======================================
pause
