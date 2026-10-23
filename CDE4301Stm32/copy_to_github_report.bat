@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo  Copying CDE4301Stm32 to Github report...
echo ===================================================

set "SOURCE_DIR=%~dp0"
if "%SOURCE_DIR:~-1%"=="\" set "SOURCE_DIR=%SOURCE_DIR:~0,-1%"

:: Destination path: C:\Users\Oliver\OneDrive - National University of Singapore\Documents\NUS\Y4S1\CDE4301 Innovation & Design Capstone (Robotics)\Github report\CDE4301Stm32
set "DEST_DIR=%~dp0..\..\Github report\CDE4301Stm32"

echo Source:      "%SOURCE_DIR%"
echo Destination: "%DEST_DIR%"
echo.

:: Ensure destination directory exists
if not exist "%DEST_DIR%" (
    echo Creating destination directory...
    mkdir "%DEST_DIR%"
)

:: Run Robocopy:
:: /E   : Copy all subdirectories including empty ones
:: /XD  : Exclude build & cache directories (.pio, .cache, __pycache__, .git)
:: /XF  : Exclude temporary files (*.bak, *.pyc)
:: /R:1 : Retry 1 time if a file is temporarily locked
:: /W:1 : Wait 1 second between retries
robocopy "%SOURCE_DIR%" "%DEST_DIR%" /E /XD ".pio" ".cache" "__pycache__" ".git" /XF "*.bak" "*.pyc" /R:1 /W:1

:: Robocopy exit codes 0 to 3 indicate success (0 = no change, 1 = files copied, 2 = extra files in dest, 3 = files copied + extra files)
if %ERRORLEVEL% LEQ 3 (
    echo.
    echo ===================================================
    echo  Copy completed successfully!
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo  Robocopy encountered an issue (Exit Code: %ERRORLEVEL%).
    echo ===================================================
)

echo.
pause
