@echo off
title CyberAlert Backend Server (FastAPI)
cd /d "%~dp0\.."
echo ============================================================
echo Starting CyberAlert Backend API on http://127.0.0.1:8000
echo Working Directory: %CD%
echo ============================================================
call python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
