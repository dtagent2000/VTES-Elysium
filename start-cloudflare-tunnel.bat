@echo off
title Elysium – Cloudflare tunnel
cd /d "%~dp0"

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo   cloudflared.exe was not found in this folder or on your PATH.
  echo   Download it from https://github.com/cloudflare/cloudflared/releases/latest
  echo   ^(cloudflared-windows-amd64.exe^) and place it here next to this file.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting Cloudflare tunnel to http://localhost:8123 ...
echo   Look for a line that says "https://something.trycloudflare.com"
echo   Share that address with your players. Close this window to stop the tunnel.
echo.
cloudflared tunnel --url http://localhost:8123
echo.
echo   Tunnel stopped.
pause
