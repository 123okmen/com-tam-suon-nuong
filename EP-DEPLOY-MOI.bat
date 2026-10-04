@echo off
title DEPLOY SAM MIX WEB TO GITHUB PAGES
color 0A
echo ============================================================
echo 🚀 DANG BUILD VA DAY WEB SAM MIX MOI NHAT LEN GITHUB PAGES...
echo ============================================================
echo.

set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"

cd /d "%~dp0"

echo [1/3] Luu ma nguon moi nhat vao Git...
call git add .
call git commit -m "Update PlannerPage with Payroll Calculator and Shareholder Dashboard"
call git push origin master

echo.
echo [2/3] Bien dich du an Vite (Build)...
call npm run build

echo.
echo [3/3] Day trang web moi len GitHub Pages (gh-pages)...
call npx gh-pages -d dist

echo.
echo ============================================================
echo ✅ DA PUBLISH WEBSITE MOI NHAT 100%% THANH CONG!
echo 🌐 Link web: https://123okmen.github.io/sam-mix-planner/?live=realtime#/planner
echo ============================================================
echo.
pause
