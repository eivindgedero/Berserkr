@echo off
SETLOCAL

REM Navigate to the server directory within Berserkr
cd Berserkr\server

REM Start the server
echo Starting the server...
node server.js
IF %ERRORLEVEL% NEQ 0 (
  echo There was an error starting the server.
  pause
  exit
) ELSE (
  echo Server started successfully.
)

pause
ENDLOCAL
