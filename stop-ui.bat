@echo off
echo Stopping UI process (port 3002)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /F /PID %%a 2>nul
echo Done.
pause
