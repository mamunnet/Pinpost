# Pinpost Backup Script for Windows
# Run with: .\backup.ps1

$ErrorActionPreference = "Stop"

# Configuration
$BackupDir = ".\backups"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "🔄 Starting backup process..." -ForegroundColor Cyan

# Backup uploaded files
Write-Host "📦 Backing up uploaded files..." -ForegroundColor Yellow
if (Test-Path "backend\uploads") {
    $UploadBackup = "$BackupDir\uploads_$Date.zip"
    Compress-Archive -Path "backend\uploads\*" -DestinationPath $UploadBackup -Force
    Write-Host "✅ Uploads backup completed: uploads_$Date.zip" -ForegroundColor Green
} else {
    Write-Host "⚠️  Uploads directory not found" -ForegroundColor Yellow
}

# Backup environment file (without sensitive data)
Write-Host "📦 Backing up configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $ConfigContent = Get-Content ".env" | Where-Object { $_ -notmatch "PASSWORD|SECRET|KEY" }
    $ConfigContent | Out-File "$BackupDir\config_$Date.env"
    Write-Host "✅ Config backup completed: config_$Date.env" -ForegroundColor Green
}

# Clean old backups (keep last 7 days)
Write-Host "🧹 Cleaning old backups..." -ForegroundColor Yellow
$OldDate = (Get-Date).AddDays(-7)
Get-ChildItem -Path $BackupDir -Include *.zip, *.env -Recurse | 
    Where-Object { $_.LastWriteTime -lt $OldDate } | 
    Remove-Item -Force

# Calculate total backup size
$TotalSize = (Get-ChildItem -Path $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
$TotalSizeFormatted = "{0:N2} MB" -f $TotalSize

Write-Host ""
Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
Write-Host "📊 Total backup size: $TotalSizeFormatted" -ForegroundColor Cyan
Write-Host "📁 Backup location: $BackupDir" -ForegroundColor Cyan
Write-Host ""
Get-ChildItem -Path $BackupDir | Sort-Object LastWriteTime -Descending | Format-Table Name, Length, LastWriteTime

Write-Host ""
Write-Host "💡 Tip: For MongoDB Atlas, backups are automatic." -ForegroundColor Yellow
Write-Host "   Visit https://cloud.mongodb.com to manage cloud backups." -ForegroundColor Yellow
