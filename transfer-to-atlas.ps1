# MongoDB Data Transfer Script for Windows
# Transfers data from local MongoDB to MongoDB Atlas

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║       🔄 MongoDB to Atlas Transfer Tool 🔄                ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "║       Transfer your local data to the cloud!             ║" -ForegroundColor Cyan
Write-Host "║                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$LOCAL_DB = "pinpost_database"
$BACKUP_DIR = "C:\Users\mamun\Desktop\mongodb_backup"

# Check if mongodump is installed
Write-Host "🔍 Checking MongoDB tools..." -ForegroundColor Yellow
try {
    $null = Get-Command mongodump -ErrorAction Stop
    Write-Host "✅ MongoDB tools found!" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB Database Tools not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Please install MongoDB Database Tools:" -ForegroundColor Yellow
    Write-Host "   Option 1: Visit https://www.mongodb.com/try/download/database-tools" -ForegroundColor White
    Write-Host "   Option 2: Run: winget install MongoDB.DatabaseTools" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Ask for local database name
Write-Host ""
Write-Host "📝 Enter your LOCAL database name (press Enter for: $LOCAL_DB):" -ForegroundColor Yellow
$input_db = Read-Host "Database name"
if (-not [string]::IsNullOrWhiteSpace($input_db)) {
    $LOCAL_DB = $input_db
}
Write-Host "   Using: $LOCAL_DB" -ForegroundColor Gray

# Ask for Atlas connection string
Write-Host ""
Write-Host "📝 Enter your MongoDB ATLAS connection string:" -ForegroundColor Yellow
Write-Host "   (Example: mongodb+srv://user:password@cluster0.xxxxx.mongodb.net)" -ForegroundColor Gray
Write-Host ""
$ATLAS_URI = Read-Host "Atlas URI"

if ([string]::IsNullOrWhiteSpace($ATLAS_URI)) {
    Write-Host ""
    Write-Host "❌ Error: Atlas URI cannot be empty!" -ForegroundColor Red
    exit 1
}

# Ask for Atlas database name
Write-Host ""
Write-Host "📝 Enter the database name in Atlas (press Enter for: pinpost_production):" -ForegroundColor Yellow
$ATLAS_DB = Read-Host "Atlas database name"
if ([string]::IsNullOrWhiteSpace($ATLAS_DB)) {
    $ATLAS_DB = "pinpost_production"
}
Write-Host "   Using: $ATLAS_DB" -ForegroundColor Gray

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Confirm before proceeding
Write-Host ""
Write-Host "📊 Transfer Summary:" -ForegroundColor Cyan
Write-Host "   FROM: Local MongoDB → $LOCAL_DB" -ForegroundColor White
Write-Host "   TO:   MongoDB Atlas → $ATLAS_DB" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Ready to transfer? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "❌ Transfer cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Step 1: Export from local MongoDB
Write-Host ""
Write-Host "📦 Step 1/2: Exporting from local MongoDB..." -ForegroundColor Cyan

# Create backup directory
if (Test-Path $BACKUP_DIR) {
    Write-Host "   ⚠️  Backup folder exists. Removing old backup..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $BACKUP_DIR
}
New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null

# Export from local MongoDB
Write-Host "   🔄 Dumping database: $LOCAL_DB" -ForegroundColor White
try {
    $dumpOutput = mongodump --db=$LOCAL_DB --out=$BACKUP_DIR 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "mongodump failed with exit code $LASTEXITCODE"
    }
    Write-Host "   ✅ Export completed!" -ForegroundColor Green
    
    # Show what was exported
    $collections = Get-ChildItem -Path "$BACKUP_DIR\$LOCAL_DB" -Filter "*.bson" | Measure-Object
    Write-Host "   📊 Exported $($collections.Count) collections" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "   ❌ Error exporting data!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   💡 Possible reasons:" -ForegroundColor Yellow
    Write-Host "      - Local MongoDB is not running" -ForegroundColor Yellow
    Write-Host "      - Database name '$LOCAL_DB' doesn't exist" -ForegroundColor Yellow
    Write-Host "      - Permission issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🔍 Check your local MongoDB:" -ForegroundColor Cyan
    Write-Host "      mongosh mongodb://localhost:27017" -ForegroundColor White
    Write-Host "      show dbs" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Step 2: Import to Atlas
Write-Host ""
Write-Host "📤 Step 2/2: Importing to MongoDB Atlas..." -ForegroundColor Cyan

$IMPORT_PATH = Join-Path $BACKUP_DIR $LOCAL_DB

Write-Host "   🔄 Uploading to Atlas: $ATLAS_DB" -ForegroundColor White
try {
    $restoreOutput = mongorestore --uri="$ATLAS_URI/$ATLAS_DB" $IMPORT_PATH --drop 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "mongorestore failed with exit code $LASTEXITCODE"
    }
    Write-Host "   ✅ Import completed!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "   ❌ Error importing data to Atlas!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   💡 Possible reasons:" -ForegroundColor Yellow
    Write-Host "      - Wrong Atlas connection string (check username/password)" -ForegroundColor Yellow
    Write-Host "      - Network access not allowed in Atlas (add your IP: 0.0.0.0/0)" -ForegroundColor Yellow
    Write-Host "      - Database user doesn't have write permissions" -ForegroundColor Yellow
    Write-Host "      - No internet connection" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🔍 Verify in MongoDB Atlas:" -ForegroundColor Cyan
    Write-Host "      1. Go to: https://cloud.mongodb.com" -ForegroundColor White
    Write-Host "      2. Network Access → Add IP → Allow from Anywhere" -ForegroundColor White
    Write-Host "      3. Database Access → Check user permissions" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Success!
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "║              🎉 Transfer Completed! 🎉                    ║" -ForegroundColor Green
Write-Host "║                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Transfer Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Source:      Local MongoDB ($LOCAL_DB)" -ForegroundColor White
Write-Host "   ✅ Destination: MongoDB Atlas ($ATLAS_DB)" -ForegroundColor White
Write-Host "   ✅ Backup:      $BACKUP_DIR" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Verify your data:" -ForegroundColor Cyan
Write-Host "   1. Open MongoDB Compass" -ForegroundColor White
Write-Host "   2. Connect to Atlas using your connection string" -ForegroundColor White
Write-Host "   3. Check database: $ATLAS_DB" -ForegroundColor White
Write-Host "   4. Verify all collections are there" -ForegroundColor White
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your .env file with Atlas connection string:" -ForegroundColor White
Write-Host "      MONGO_URL=$ATLAS_URI" -ForegroundColor Gray
Write-Host "      DB_NAME=$ATLAS_DB" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Test your Pinpost app with Atlas database" -ForegroundColor White
Write-Host ""
Write-Host "   3. Deploy to production!" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tip: Keep the backup folder ($BACKUP_DIR) as a safety copy!" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
