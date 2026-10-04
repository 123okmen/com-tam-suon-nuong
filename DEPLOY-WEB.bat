@echo off
chcp 65001 >nul
title DEPLOY COM TAM SUON NUONG WEB TO GITHUB PAGES
color 0A
echo ============================================================
echo 🚀 DANG BUILD VA DAY WEB COM TAM SUON NUONG LEN GITHUB PAGES...
echo ============================================================
echo.

set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files\Git\cmd"

cd /d "%~dp0"

echo [1/2] Bien dich ma nguon moi nhat...
call node build_dist.cjs
if errorlevel 1 (
  echo ❌ Build loi! Khong the deploy.
  pause
  exit /b 1
)

echo.
echo [2/2] Day trang web moi len GitHub Pages (gh-pages)...
call npx.cmd gh-pages -d dist

echo.
echo ============================================================
echo ✅ DA PUBLISH WEBSITE MOI NHAT 100%% THANH CONG!
echo 🌐 Link web GitHub Live: 
echo    https://123okmen.github.io/com-tam-suon-nuong/#/order
echo ============================================================
echo.
pause
