@echo off
title DEPLOY COM TAM SUON NUONG TO GITHUB PAGES
color 0A
echo ============================================================
echo 🚀 DANG BUILD VA DAY WEB COM TAM SUON NUONG LEN GITHUB PAGES...
echo ============================================================
echo.

set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;C:\Program Files\nodejs"

cd /d "%~dp0"

echo [1/3] Luu ma nguon moi nhat vao Git...
call git add .
call git commit -m "Deploy Com Tam Suon Nuong web app"
call git push origin master

echo.
echo [2/3] Bien dich du an Vite (Build)...
call npm.cmd run build

echo.
echo [3/3] Day trang web moi len GitHub Pages (gh-pages)...
call npx.cmd gh-pages -d dist

echo.
echo ============================================================
echo ✅ DA PUBLISH WEBSITE MOI NHAT 100%% THANH CONG!
echo 🌐 Link web: https://123okmen.github.io/com-tam-suon-nuong/#/order
echo ============================================================
echo.
pause
