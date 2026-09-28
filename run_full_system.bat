@echo off
title CyberAlert Full Platform Launcher
echo ============================================================
echo Launching CyberAlert Prioritization Platform
echo MySQL Database: cyberalert_db (Port 3306)
echo Backend: FastAPI on http://127.0.0.1:8000
echo Frontend: React on http://localhost:5173
echo ============================================================

start "CyberAlert Backend" cmd /k run_backend.bat
timeout /t 3 >nul
start "CyberAlert Frontend" cmd /k run_frontend.bat

echo Both servers launched successfully!
pause
