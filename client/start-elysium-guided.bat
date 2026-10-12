@echo off
setlocal EnableDelayedExpansion
title Elysium server (guided start)
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
echo   Elysium server -- guided start
echo   ------------------------------
echo   A few questions, then the server starts with the right options.
echo   Press Enter to skip any question (skipped = off, same as the plain launcher).
echo   Tip: avoid ^& ^| ^< ^> " and exclamation-mark characters in passwords here.
echo   (exclamation marks are silently eaten by this script style -- the plain launcher has no such limit)
echo.

set "ARGS="
set "SHOWN="

set "SRVPASS="
set /p SRVPASS=  Server password (locks the WHOLE server -- browse/create/join): 
if not "!SRVPASS!"=="" (
  set ARGS=!ARGS! --server-pass "!SRVPASS!"
  set SHOWN=!SHOWN! --server-pass ***
)

set "ADMPASS="
set /p ADMPASS=  Admin password (tournament referees inherit all host powers): 
if not "!ADMPASS!"=="" (
  set ARGS=!ARGS! --admin-pass "!ADMPASS!"
  set SHOWN=!SHOWN! --admin-pass ***
  choice /c YN /n /m "  Single-room server -- only the admin may create rooms? [Y/N] "
  if !errorlevel!==1 (
    set ARGS=!ARGS! --create-policy admin
    set SHOWN=!SHOWN! --create-policy admin
  )
)

choice /c YN /n /m "  Behind cloudflared/Caddy running on THIS machine? (--trust-proxy) [Y/N] "
if !errorlevel!==1 (
  set ARGS=!ARGS! --trust-proxy
  set SHOWN=!SHOWN! --trust-proxy
  echo   Remember: start the tunnel separately with start-cloudflare-tunnel.bat once the server is up.
)

echo.
echo   Starting: node elysium-server.js!SHOWN!
echo   (close this window to stop the server)
echo.
node elysium-server.js!ARGS!
echo.
echo   Server stopped.
pause
