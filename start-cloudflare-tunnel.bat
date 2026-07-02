@echo off
setlocal EnableExtensions
title Elysium - Cloudflare tunnel
cd /d "%~dp0"

REM ------------------------------------------------------------------
REM  Elysium - Cloudflare quick tunnel launcher
REM  Opens a public tunnel to the local Elysium server (port 8123),
REM  copies the trycloudflare.com address to the clipboard, and shows
REM  the full cloudflared output. Close this window to stop the tunnel.
REM ------------------------------------------------------------------

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
if exist "%_log%" del "%_log%" >nul 2>nul

echo.
echo   Starting Cloudflare tunnel to http://localhost:8123 ...
echo   Waiting for the public address (usually 5-15 seconds) ...
echo.

REM  Run cloudflared in the background so this script can read its
REM  output from a log file and pull the address out of it.
start "" /b cloudflared tunnel --url http://localhost:8123 >"%_log%" 2>&1

REM  Wait for the REAL url line. We require "https://...trycloudflare.com"
REM  on purpose: the earlier "Requesting ... on trycloudflare.com" line
REM  shows up first and must NOT trigger the extraction.
set /a _tries=0
:wait
timeout /t 1 /nobreak >nul
set /a _tries+=1
findstr /r "https://.*trycloudflare.com" "%_log%" >nul 2>nul
if not errorlevel 1 goto found
if %_tries% geq 60 goto failed
goto wait

:found
REM  Extract exactly the URL with PowerShell (robust regex) and copy it.
set "_url="
for /f "usebackq delims=" %%U in (`powershell -NoProfile -Command "$m = Select-String -Path '%_log%' -Pattern 'https://\S+\.trycloudflare\.com'; if ($m) { $m[0].Matches[0].Value }"`) do set "_url=%%U"

if not defined _url goto noparse

REM  Copy to the clipboard with no trailing newline.
<nul set /p "=%_url%"| clip

REM  Show everything cloudflared printed (all the connection info).
type "%_log%"
echo.
echo   ============================================================
echo     Tunnel address (already copied to your clipboard):
echo.
echo       %_url%
echo.
echo     Share this with your players.
echo     Close this window to stop the tunnel.
echo   ============================================================
echo.
goto follow

:noparse
echo.
echo   The address line appeared but the URL could not be parsed.
echo   Full output below - copy the trycloudflare.com link by hand:
echo.
type "%_log%"
echo.
goto follow

:failed
echo.
echo   No tunnel address appeared within 60 seconds.
echo   cloudflared output so far:
echo.
type "%_log%"
echo.
echo   Leaving the window open. Close it to stop cloudflared.
echo.

:follow
REM  Keep the window open and keep showing live cloudflared output.
REM  Closing this window stops the tunnel.
powershell -NoProfile -Command "Get-Content -Path '%_log%' -Wait -Tail 0"
