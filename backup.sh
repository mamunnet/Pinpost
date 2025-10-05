#!/bin/bash
# Backup script for Pinpost

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_URL=${MONGO_URL:-$(grep MONGO_URL .env | cut -d '=' -f2)}
DB_NAME=${DB_NAME:-$(grep DB_NAME .env | cut -d '=' -f2)}

# Create backup directory
mkdir -p $BACKUP_DIR

echo "🔄 Starting backup process..."

# Backup MongoDB (if using local MongoDB)
if command -v mongodump &> /dev/null; then
    echo "📦 Backing up MongoDB..."
    mongodump --uri="$MONGO_URL" --out="$BACKUP_DIR/mongodb_$DATE"
    tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"
    rm -rf "$BACKUP_DIR/mongodb_$DATE"
    echo "✅ MongoDB backup completed: mongodb_$DATE.tar.gz"
else
    echo "⚠️  mongodump not found. Skipping MongoDB backup."
    echo "   For MongoDB Atlas, backups are automatic."
fi

# Backup uploaded files
echo "📦 Backing up uploaded files..."
if [ -d "backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C backend uploads
    echo "✅ Uploads backup completed: uploads_$DATE.tar.gz"
else
    echo "⚠️  Uploads directory not found"
fi

# Backup environment file (without sensitive data)
echo "📦 Backing up configuration..."
if [ -f ".env" ]; then
    grep -v "PASSWORD\|SECRET\|KEY" .env > "$BACKUP_DIR/config_$DATE.env" || true
    echo "✅ Config backup completed: config_$DATE.env"
fi

# Clean old backups (keep last 7 days)
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.env" -mtime +7 -delete

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo ""
echo "✅ Backup completed successfully!"
echo "📊 Total backup size: $TOTAL_SIZE"
echo "📁 Backup location: $BACKUP_DIR"
echo ""
ls -lh "$BACKUP_DIR" | tail -n +2
