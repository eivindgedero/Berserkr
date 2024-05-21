@echo off
SETLOCAL EnableDelayedExpansion

REM Check if Node.js is installed
echo Checking if Node.js is installed...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed. Please install it before continuing.
  pause
  exit
) ELSE (
  echo Node.js is installed, continuing...
)

REM Navigate to the Berserkr directory
echo Navigating to the Berserkr directory...
cd Berserkr
IF %ERRORLEVEL% NEQ 0 (
  echo Failed to navigate to Berserkr directory.
  pause
  exit
) ELSE (
  echo Successfully navigated to Berserkr directory.
)

REM Install npm dependencies with verbose output
echo Installing npm dependencies...
npm install --verbose > npm-install-log.txt 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo There was an error installing the dependencies. Check npm-install-log.txt for details.
  pause
  exit
) ELSE (
  echo npm dependencies installed successfully.
)

echo Review the npm installation details:
type npm-install-log.txt
pause

echo Script completed. Press any key to exit.
pause >nul
ENDLOCAL
