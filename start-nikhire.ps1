# NikHire Quick Launch Script for PowerShell

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " NikHire - Campus Recruitment System" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if npm is installed
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Change to project directory
$projectPath = "c:\Users\David\Documents\Octahire_App\NikHire"
Set-Location $projectPath

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install failed" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting NikHire services..." -ForegroundColor Yellow
Write-Host ""
Write-Host "[Backend] Server will start on http://localhost:3000" -ForegroundColor Cyan
Write-Host "[Frontend] Client will start on http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop services" -ForegroundColor Gray
Write-Host ""

# Start backend in a new PowerShell window
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "Set-Location 'c:\Users\David\Documents\Octahire_App\NikHire'; Write-Host 'Backend Server starting on port 3000...' -ForegroundColor Green; npm run server" -WindowStyle Normal

# Wait 2 seconds for backend to start
Start-Sleep -Seconds 2

# Start frontend in a new PowerShell window
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\David\Documents\Octahire_App\NikHire'; Write-Host 'Frontend Client starting on port 8000...' -ForegroundColor Green; npm run client" -WindowStyle Normal

Write-Host ""
Write-Host "✓ Services are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser and go to:" -ForegroundColor Yellow
Write-Host "  → http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend API available at:" -ForegroundColor Gray
Write-Host "  → http://localhost:3000/api" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to continue (close this window when done)"
