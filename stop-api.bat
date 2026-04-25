@echo off
echo Stopping API process (port 5002)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5002') do taskkill /F /PID %%a 2>nul
echo Done.
pause
