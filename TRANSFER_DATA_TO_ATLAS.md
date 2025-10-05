# 🔄 Transfer MongoDB Data to Atlas

## Easy Guide to Move Your Data from Local MongoDB to Atlas

---

## 🎯 What You Need

- ✅ MongoDB Compass installed (you already have this!)
- ✅ MongoDB Atlas account and cluster created (you have this!)
- ✅ Your local database name: `pinpost_database` (or `penlink_database`)
- ✅ Your Atlas connection string

---

## 🚀 Method 1: Using MongoDB Compass (Easiest!)

### Step 1: Connect to Your Local Database

1. Open **MongoDB Compass**
2. Connect to your local database:
   ```
   mongodb://localhost:27017
   ```
3. You should see your `pinpost_database` (or `penlink_database`)

### Step 2: Export Data from Local Database

For each collection (users, posts, blogs, etc.):

1. **Click** on the collection name (e.g., `users`)
2. **Click** the "..." (three dots) menu at top
3. **Select** "Export Collection"
4. **Choose** format: `JSON`
5. **Save** to a folder (e.g., `C:\Users\mamun\Desktop\mongodb_backup\`)
6. **Repeat** for all collections:
   - users
   - posts
   - blogs
   - comments
   - notifications
   - stories
   - follows
   - likes

### Step 3: Connect to MongoDB Atlas

1. In MongoDB Compass, click "New Connection"
2. Paste your Atlas connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Click "Connect"
4. You should see your Atlas cluster!

### Step 4: Create Database in Atlas

1. Click "Create Database"
2. **Database Name:** `pinpost_production`
3. **Collection Name:** `users` (we'll add others next)
4. Click "Create Database"

### Step 5: Import Data to Atlas

For each collection:

1. **Select** your database: `pinpost_production`
2. **Click** the collection (e.g., `users`)
3. **Click** "ADD DATA" → "Import File"
4. **Select** the JSON file you exported earlier
5. **Click** "Import"
6. **Repeat** for all collections

✅ **Done!** Your data is now in Atlas!

---

## 🚀 Method 2: Using Command Line (For Tech-Savvy!)

### Step 1: Export from Local MongoDB

Open PowerShell and run:

```powershell
# Create backup folder
mkdir C:\Users\mamun\Desktop\mongodb_backup

# Export all data
mongodump --db=pinpost_database --out=C:\Users\mamun\Desktop\mongodb_backup

# You'll see: "done dumping pinpost_database"
```

### Step 2: Import to MongoDB Atlas

```powershell
# Import to Atlas (replace with YOUR connection string!)
mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pinpost_production" C:\Users\mamun\Desktop\mongodb_backup/pinpost_database

# You'll see: "finished restoring pinpost_production"
```

✅ **Done!** All data transferred!

---

## 🚀 Method 3: Using PowerShell Script (Super Easy!)

I'll create a script that does everything for you!

### Step 1: Save This Script

Create a file: `transfer-to-atlas.ps1`

```powershell
# MongoDB Data Transfer Script
# Transfer local data to MongoDB Atlas

Write-Host "🔄 MongoDB Data Transfer Tool" -ForegroundColor Cyan
Write-Host ""

# Configuration
$LOCAL_DB = "pinpost_database"
$BACKUP_DIR = "C:\Users\mamun\Desktop\mongodb_backup"

# Ask for Atlas connection string
Write-Host "📝 Enter your MongoDB Atlas connection string:" -ForegroundColor Yellow
Write-Host "   (Example: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true)" -ForegroundColor Gray
$ATLAS_URI = Read-Host "Atlas URI"

if ([string]::IsNullOrWhiteSpace($ATLAS_URI)) {
    Write-Host "❌ Error: Atlas URI cannot be empty!" -ForegroundColor Red
    exit 1
}

# Extract database name from URI or ask
Write-Host ""
Write-Host "📝 Enter the database name in Atlas (default: pinpost_production):" -ForegroundColor Yellow
$ATLAS_DB = Read-Host "Database name"
if ([string]::IsNullOrWhiteSpace($ATLAS_DB)) {
    $ATLAS_DB = "pinpost_production"
}

Write-Host ""
Write-Host "📦 Step 1: Exporting from local MongoDB..." -ForegroundColor Cyan

# Create backup directory
if (Test-Path $BACKUP_DIR) {
    Write-Host "⚠️  Backup folder exists. Removing old backup..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $BACKUP_DIR
}
New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null

# Export from local MongoDB
try {
    mongodump --db=$LOCAL_DB --out=$BACKUP_DIR
    Write-Host "✅ Export completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error exporting data. Is MongoDB running locally?" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Step 2: Importing to MongoDB Atlas..." -ForegroundColor Cyan

# Import to Atlas
try {
    $IMPORT_PATH = Join-Path $BACKUP_DIR $LOCAL_DB
    mongorestore --uri="$ATLAS_URI/$ATLAS_DB" $IMPORT_PATH --drop
    Write-Host "✅ Import completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error importing data to Atlas!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Possible reasons:" -ForegroundColor Yellow
    Write-Host "   - Wrong Atlas connection string" -ForegroundColor Yellow
    Write-Host "   - Network access not allowed in Atlas" -ForegroundColor Yellow
    Write-Host "   - Database user doesn't have write permissions" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 Data Transfer Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Source:      Local MongoDB ($LOCAL_DB)" -ForegroundColor White
Write-Host "   Destination: MongoDB Atlas ($ATLAS_DB)" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Verify your data:" -ForegroundColor Cyan
Write-Host "   1. Open MongoDB Compass" -ForegroundColor White
Write-Host "   2. Connect to Atlas: $ATLAS_URI" -ForegroundColor White
Write-Host "   3. Check database: $ATLAS_DB" -ForegroundColor White
Write-Host ""
Write-Host "💾 Backup saved at: $BACKUP_DIR" -ForegroundColor Cyan
Write-Host ""
```

### Step 2: Run the Script

```powershell
# Navigate to Pinpost folder
cd C:\Users\mamun\Desktop\Pinpost

# Run the script
powershell -ExecutionPolicy Bypass -File transfer-to-atlas.ps1
```

The script will:
1. Ask for your Atlas connection string
2. Export from local MongoDB
3. Import to Atlas
4. Show success message!

---

## 🔍 Verify Data Transfer

### Using MongoDB Compass:

1. **Connect to Atlas:**
   - Paste your Atlas connection string
   - Click "Connect"

2. **Check your database:**
   - Look for `pinpost_production`
   - Click to expand

3. **Verify collections:**
   - Users - should have your accounts
   - Posts - should have your posts
   - Blogs - should have your blogs
   - Comments, notifications, etc.

4. **Check document counts:**
   - Click each collection
   - See if numbers match your local database

### Using Command Line:

```powershell
# Connect to Atlas and check
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pinpost_production"

# Then run these commands:
show dbs
use pinpost_production
show collections
db.users.countDocuments()
db.posts.countDocuments()
db.blogs.countDocuments()
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "mongodump not found"

**Solution:** Install MongoDB Database Tools

```powershell
# Download MongoDB Tools
# Visit: https://www.mongodb.com/try/download/database-tools
# Or use winget:
winget install MongoDB.DatabaseTools
```

### Issue 2: "Authentication failed"

**Solutions:**
- Check your Atlas username/password
- Make sure you replaced `<password>` in connection string
- Verify user has read/write permissions in Atlas

### Issue 3: "Network timeout"

**Solutions:**
1. Go to MongoDB Atlas
2. Click "Network Access"
3. Add your IP: Click "Add IP Address"
4. Choose "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm"

### Issue 4: "Database already exists"

**Solution:** Use `--drop` flag to replace existing data:
```powershell
mongorestore --uri="..." --drop
```

### Issue 5: "Can't connect to local MongoDB"

**Solutions:**
- Make sure local MongoDB is running
- Check if it's on port 27017
- Try: `mongosh mongodb://localhost:27017`

---

## 🎯 Quick Reference

### Export from Local:
```powershell
mongodump --db=pinpost_database --out=./backup
```

### Import to Atlas:
```powershell
mongorestore --uri="YOUR_ATLAS_URI/pinpost_production" ./backup/pinpost_database
```

### One-Liner (Replace URI!):
```powershell
mongodump --db=pinpost_database --out=./backup && mongorestore --uri="mongodb+srv://user:pass@cluster.net/pinpost_production" ./backup/pinpost_database --drop
```

---

## 💡 Pro Tips

### 1. Backup First!
Always keep a local backup before transferring:
```powershell
mongodump --db=pinpost_database --out=./backup_$(Get-Date -Format 'yyyyMMdd')
```

### 2. Test Connection First
Before transferring, test Atlas connection:
```powershell
mongosh "YOUR_ATLAS_URI"
```

### 3. Transfer Sample First
Test with one collection first:
```powershell
mongodump --db=pinpost_database --collection=users --out=./test
mongorestore --uri="ATLAS_URI/pinpost_production" ./test/pinpost_database
```

### 4. Check File Sizes
Before importing, check backup size:
```powershell
Get-ChildItem -Recurse ./backup | Measure-Object -Property Length -Sum
```

---

## 📋 Checklist

**Before Transfer:**
- [ ] Local MongoDB is running
- [ ] MongoDB Compass connected to local
- [ ] Atlas cluster is created
- [ ] Atlas network access allows your IP
- [ ] Atlas user has read/write permissions
- [ ] Backup folder created
- [ ] mongodump/mongorestore installed

**During Transfer:**
- [ ] Export completed successfully
- [ ] No errors shown
- [ ] Backup files exist
- [ ] Import started
- [ ] Import completed

**After Transfer:**
- [ ] Connected to Atlas in Compass
- [ ] Database exists
- [ ] All collections present
- [ ] Document counts match
- [ ] Sample data looks correct
- [ ] Local backup saved

---

## 🎉 Success!

Once transfer is complete:

1. ✅ Update your `.env` file with Atlas connection string
2. ✅ Test your Pinpost app with Atlas
3. ✅ Keep local backup safe
4. ✅ You're ready to deploy!

---

## 🆘 Need Help?

### Still stuck?

1. **Check MongoDB Compass logs**
   - View → Show Logs

2. **Test connection strings**
   - Local: `mongodb://localhost:27017`
   - Atlas: Check in Atlas dashboard → Connect

3. **Ask for help**
   - MongoDB Community: https://www.mongodb.com/community/forums
   - Stack Overflow: Search "mongodump to atlas"

---

**Made with ❤️ for easy data migration**

*Now your data is in the cloud! 🚀*
