# Pinpost Production Deployment Script for Windows

Write-Host "🚀 Starting Pinpost Production Deployment..." -ForegroundColor Cyan

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed." -ForegroundColor Red
    exit 1
}

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "📝 Please edit .env file with your production credentials" -ForegroundColor Yellow
        Write-Host "Press Enter after editing .env file..." -ForegroundColor Yellow
        Read-Host
    } else {
        Write-Host "❌ .env.example not found. Cannot create .env file." -ForegroundColor Red
        exit 1
    }
}

# Generate secret key if needed
$envContent = Get-Content ".env" -Raw
if ($envContent -match "your-super-secret-key") {
    Write-Host "🔐 Generating secure SECRET_KEY..." -ForegroundColor Yellow
    $bytes = New-Object Byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secretKey = [System.BitConverter]::ToString($bytes) -replace '-', ''
    $envContent = $envContent -replace "SECRET_KEY=.*", "SECRET_KEY=$secretKey"
    Set-Content ".env" $envContent
    Write-Host "✅ SECRET_KEY generated" -ForegroundColor Green
}

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Build images
Write-Host "🏗️  Building Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start containers
Write-Host "🚀 Starting containers..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check container status
Write-Host "📊 Container status:" -ForegroundColor Yellow
docker-compose ps

# Check backend health
Write-Host "🏥 Checking backend health..." -ForegroundColor Yellow
$backendHealthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is healthy" -ForegroundColor Green
            $backendHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $backendHealthy) {
    Write-Host "❌ Backend health check failed" -ForegroundColor Red
    docker-compose logs backend
    exit 1
}

# Check frontend health
Write-Host "🏥 Checking frontend health..." -ForegroundColor Yellow
$frontendHealthy = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:80/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is healthy" -ForegroundColor Green
            $frontendHealthy = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $frontendHealthy) {
    Write-Host "❌ Frontend health check failed" -ForegroundColor Red
    docker-compose logs frontend
    exit 1
}

# Display deployment info
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 Pinpost deployed successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: " -NoNewline; Write-Host "http://localhost" -ForegroundColor Green
Write-Host "Backend API: " -NoNewline; Write-Host "http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs: " -NoNewline; Write-Host "http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:          " -NoNewline; Write-Host "docker-compose logs -f" -ForegroundColor Green
Write-Host "  Stop containers:    " -NoNewline; Write-Host "docker-compose down" -ForegroundColor Green
Write-Host "  Restart services:   " -NoNewline; Write-Host "docker-compose restart" -ForegroundColor Green
Write-Host "  View backend logs:  " -NoNewline; Write-Host "docker-compose logs -f backend" -ForegroundColor Green
Write-Host "  View frontend logs: " -NoNewline; Write-Host "docker-compose logs -f frontend" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
