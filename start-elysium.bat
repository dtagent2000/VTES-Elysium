@echo off
title Elysium server
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found on this machine.
  echo   Install the LTS version from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)
echo.
echo   Starting the Elysium server -- close this window to stop it.
echo.
node elysium-server.js %*
echo.
echo   Server stopped.
pause
