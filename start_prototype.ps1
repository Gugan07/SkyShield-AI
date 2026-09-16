# SkyShield AI - One-Click Prototype Launch Script
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " SkyShield AI - Micro-Doppler Aerial Target Classification" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Start Backend in a separate PowerShell window
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:PYTHONPATH='.'; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

# Wait 2 seconds for backend to bind
Start-Sleep -Seconds 2

# 2. Start Frontend in a separate PowerShell window
Write-Host "[2/2] Starting Vite React Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll services initiated successfully!" -ForegroundColor Green
Write-Host "Frontend Dashboard: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
