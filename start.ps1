# CareerScope AI — local dev launcher (Windows / PowerShell)
# Starts the FastAPI backend on :8000 and the Vite dev server on :5173.
# Run from the repository root:  .\start.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host "=== CareerScope AI local dev ===" -ForegroundColor Cyan

# 1. Environment file
$EnvFile = Join-Path $Root ".env"
if (-not (Test-Path -LiteralPath $EnvFile)) {
    Copy-Item -LiteralPath (Join-Path $Root ".env.example") -Destination $EnvFile
    Write-Host "Created .env from .env.example — edit it to add your API keys (GROQ_API_KEY, SERPAPI_API_KEY)." -ForegroundColor Yellow
}

# 2. Backend virtualenv
$Venv = Join-Path $Root "backend\.venv"
if (-not (Test-Path -LiteralPath (Join-Path $Venv "Scripts\python.exe"))) {
    Write-Host "Creating backend virtualenv..." -ForegroundColor Cyan
    python -m venv $Venv
}
$VenvPython = Join-Path $Venv "Scripts\python.exe"
& $VenvPython -m pip install --upgrade pip --quiet
& $VenvPython -m pip install -r (Join-Path $Root "backend\requirements.txt") --quiet
Write-Host "Backend dependencies ready." -ForegroundColor Green

# 3. Load .env into the process
Get-Content $EnvFile | Where-Object { $_ -match '^\w+=' } | ForEach-Object {
    $k = ($_ -split '=', 2)[0]
    $v = ($_ -split '=', 2)[1]
    [Environment]::SetEnvironmentVariable($k, $v, "Process")
}

# 4. Frontend dependencies
if (-not (Test-Path -LiteralPath (Join-Path $Root "frontend\node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location (Join-Path $Root "frontend")
    npm install
    Set-Location $Root
}
Write-Host "Frontend dependencies ready." -ForegroundColor Green

# 5. Launch both servers
Write-Host "Starting backend  -> http://localhost:8000  (/docs for API)" -ForegroundColor Cyan
Write-Host "Starting frontend -> http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in the frontend window to stop everything." -ForegroundColor Yellow

Start-Process -FilePath $VenvPython -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000" -WorkingDirectory (Join-Path $Root "backend")

Push-Location (Join-Path $Root "frontend")
try {
    npm run dev
} finally {
    Pop-Location
}