@echo off
rem Sets a title for this command prompt window.
title Artopus App Launcher

rem --- Backend Setup ---
echo ==========================
echo ARTOPUS BACKEND SETUP
echo ==========================

rem Check if the backend directory exists and navigate into it.
if not exist "backend" (
    echo ERROR: 'backend' directory not found.
    goto END
)
cd backend

echo Installing backend dependencies (npm install)...
rem 'call' ensures that control returns to this script after the command finishes.
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: 'npm install' failed for the backend. Check for errors above.
    goto END
)

echo Starting Backend Server (npm run dev)...
rem Starts the backend server in a new, separate command window.
rem The '/k' switch keeps the new window open, so you can see server logs or errors.
start "Artopus Backend" cmd /k "npm run dev"
cd ..


rem --- Frontend Setup ---
echo.
echo ===========================
echo ARTOPUS FRONTEND SETUP
echo ===========================

rem Check if the frontend directory exists and navigate into it.
if not exist "frontend" (
    echo ERROR: 'frontend' directory not found.
    goto END
)
cd frontend

echo Installing frontend dependencies (npm install)...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: 'npm install' failed for the frontend. Check for errors above.
    goto END
)

echo Starting Frontend Dev Server (npm run dev)...
rem Starts the frontend server in a new, separate command window.
start "Artopus Frontend" cmd /k "npm run dev"
cd ..


rem --- Launch Application ---
echo.
echo Waiting 10 seconds for servers to initialize...
rem This command waits for 10 seconds without showing a countdown or requiring a keypress.
timeout /t 10 /nobreak > nul

echo Opening Artopus App in your default browser...
rem Using "" as a placeholder for the title is a safe way to launch URLs.
start "" "http://localhost:3000"

echo.
echo Setup is complete!
echo The frontend and backend servers are running in separate windows.
echo This launcher window will close shortly.


:END
rem Add a short pause so the user can read the final messages before the window closes.
timeout /t 5 /nobreak > nul
exit
