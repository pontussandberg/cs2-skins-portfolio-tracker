@echo off
setlocal
cd /d "%~dp0"
title CS2 Skins Portfolio Tracker
echo === CS2 Skins Portfolio Tracker ===
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed. Install Node 22 LTS from https://nodejs.org and run this again.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo Node %%v
if not exist ".env.local" (
  copy /y ".env.example" ".env.local" >nul
  echo Created .env.local - add CSFLOAT_API_KEY and DISCORD_WEBHOOK_URL to it, then restart.
)
set COREPACK_ENABLE_DOWNLOAD_PROMPT=0
if not exist "node_modules\.modules.yaml" (
  echo Installing dependencies, first run takes a minute...
  call corepack pnpm@10.28.0 install
  if errorlevel 1 (
    echo Install failed. See the messages above.
    pause
    exit /b 1
  )
)
echo Starting at http://localhost:3000  (close this window to stop)
start "" cmd /c "timeout /t 12 >nul & start http://localhost:3000"
call corepack pnpm@10.28.0 dev
pause
