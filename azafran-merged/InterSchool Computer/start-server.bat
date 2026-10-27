@echo off
setlocal
cd /d "%~dp0Bakend"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org and run this again.
  pause
  exit /b 1
)
start "" "http://localhost:3000/"
echo Serving AZAFRAN at http://localhost:3000/
echo Close this window to stop the server.
node server.js
pause
