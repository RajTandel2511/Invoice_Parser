@echo off
echo Starting Invoice Parser - Frontend and Backend...
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo Network access: http://192.168.1.71:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Backend Server" cmd /k "npm run server"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd client && npm run dev"

echo Both servers are starting...
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo Network: http://192.168.1.71:3000
echo.
echo Keep this window open to monitor the servers.
pause 