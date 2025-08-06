@echo off
echo ========================================
echo Invoice Parser - Network Ready Startup
echo ========================================

echo.
echo Starting servers...
echo Frontend will be available on:
echo   Local: http://localhost:3000
echo   Network: http://192.168.1.71:3000
echo   Network: http://192.168.1.130:3000
echo.
echo Backend API will be available on:
echo   Local: http://localhost:3002
echo   Network: http://192.168.1.71:3002
echo   Network: http://192.168.1.130:3002
echo.

npm run dev-all

pause 