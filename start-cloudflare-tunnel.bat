@echo off
title Elysium – Cloudflare tunnel
cd /d "%~dp0"

where cloudflared >nul 2>nul
if errorlevel 1 (
  echo.
  echo   cloudflared.exe was not found in this folder or on your PATH.
  echo   Download cloudflared-windows-amd64.exe from
  echo   https://github.com/cloudflare/cloudflared/releases/latest
  echo   Rename it to cloudflared.exe and place it next to this file.
  echo.
  pause
  exit /b 1
)

set "_log=%TEMP%\elysium-tunnel.log"
if exist "%_log%" del "%_log%" >nul

echo.
echo   Starting Cloudflare tunnel to http://localhost:8123 ...
echo   The address will be copied to your clipboard automatically.
echo.

:: Run cloudflared in the background with output in a log file.
:: This prevents the console QuickEdit freeze-on-click problem.
start "" /b cloudflared tunnel --url http://localhost:8123 >"%_log%" 2>&1

:: Wait for the tunnel address to appear (typically 5-15 seconds).
:wait
timeout /t 2 /nobreak >nul
findstr /c:"trycloudflare.com" "%_log%" >nul 2>nul
if errorlevel 1 goto wait

:: Extract the URL with PowerShell and copy to clipboard.
set "_url="
for /f %%U in ('powershell -NoProfile -Command "(Select-String '%_log%' -Pattern 'https://\S+\.trycloudflare\.com').Matches[0].Value"') do set "_url=%%U"

if not defined _url (
  echo   Tunnel started but the address could not be extracted.
  echo   Check the log: %_log%
  echo.
  pause
  exit /b 1
)

echo %_url%| clip

echo   Tunnel address (copied to clipboard):
echo.
echo     %_url%
echo.
echo   Share it with your players.
echo   Close this window to stop the tunnel.
echo.

:: Keep the window open. Closing it stops cloudflared.
:idle
timeout /t 3600 /nobreak >nul
goto idle
