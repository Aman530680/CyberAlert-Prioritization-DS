@echo off
title CyberAlert Backend Server (FastAPI)
echo ============================================================
echo Starting CyberAlert Backend API on http://127.0.0.1:8000
echo ============================================================
call python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
