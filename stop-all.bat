@echo off
echo Stopping API and UI processes...

echo Killing .NET API (port 5002)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5002') do taskkill /F /PID %%a 2>nul

echo Killing Node/Vite UI (port 3002)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /F /PID %%a 2>nul

echo All relevant processes have been stopped.
pause
