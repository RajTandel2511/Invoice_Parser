@echo off
echo 🚀 Starting Invoice Parser...
echo.
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
npm run dev-all 