@echo off
title Artopus App Launcher

echo ==========================
echo  ARTOPUS BACKEND SETUP
echo ==========================
cd backend
echo Installing backend dependencies...
npm install
echo Starting Backend Server...
start "Artopus Backend" cmd /k "npm run dev"
cd ..

echo.
echo ===========================
echo  ARTOPUS FRONTEND SETUP
echo ===========================
cd frontend
echo Installing frontend dependencies...
npm install
echo Starting Frontend Dev Server...
start "Artopus Frontend" cmd /k "npm run dev"
cd ..

echo.
echo Waiting for servers to initialize...
timeout /t 10 /nobreak > nul

echo Opening Artopus App in your browser...
start http://localhost:3000

echo.
echo All processes have been started.
exit