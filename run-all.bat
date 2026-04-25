@echo off
echo Launching both API and UI...
start "API Server" cmd /c "run-api.bat"
start "UI Server" cmd /c "run-ui.bat"
