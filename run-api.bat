@echo off
title Apartment API
echo Checking for processes on port 5002...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :5002') DO (
    echo Killing process %%T
    taskkill /pid %%T /F
)
echo Starting .NET API...
cd api-dotnet
dotnet run
pause
