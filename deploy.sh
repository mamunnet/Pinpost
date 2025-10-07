#!/bin/bash
# Production Deployment Script for Pinpost
# Run this on your production server

set -e  # Exit on error

echo "🚀 Starting Pinpost Production Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from /docker/pinpost directory"
    exit 1
fi

# Step 1: Pull latest changes
echo "📥 Step 1: Pulling latest code from Git..."
git pull origin main || {
    echo "❌ Git pull failed!"
    exit 1
}
echo "✅ Code updated"
echo ""

# Step 2: Verify environment files
echo "📋 Step 2: Verifying environment configuration..."

if [ ! -f "frontend/.env.production" ]; then
    echo "❌ Error: frontend/.env.production not found!"
    echo "Creating it now..."
    echo "REACT_APP_BACKEND_URL=https://bartaaddaa.com" > frontend/.env.production
    echo "✅ Created frontend/.env.production"
fi

# Show current backend URL
BACKEND_URL=$(grep REACT_APP_BACKEND_URL frontend/.env.production | cut -d'=' -f2)
echo "Backend URL: $BACKEND_URL"

if [ "$BACKEND_URL" != "https://bartaaddaa.com" ]; then
    echo "⚠️  WARNING: Backend URL is not set to https://bartaaddaa.com"
    echo "Current value: $BACKEND_URL"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo "✅ Environment verified"
echo ""

# Step 3: Stop containers
echo "🛑 Step 3: Stopping containers..."
docker compose down
echo "✅ Containers stopped"
echo ""

# Step 4: Rebuild frontend (most common change)
echo "🔨 Step 4: Rebuilding frontend with production settings..."
docker compose build --no-cache frontend
echo "✅ Frontend rebuilt"
echo ""

# Step 5: Start all services
echo "🎬 Step 5: Starting all services..."
docker compose up -d
echo "✅ Services started"
echo ""

# Step 6: Show logs
echo "📊 Step 6: Checking service status..."
sleep 3
docker compose ps
echo ""

echo "📝 Recent logs:"
docker compose logs --tail=20 frontend
echo ""

# Step 7: Health check
echo "🏥 Step 7: Performing health check..."
sleep 5

# Check if containers are running
FRONTEND_STATUS=$(docker compose ps frontend --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
BACKEND_STATUS=$(docker compose ps backend --format json | grep -o '"State":"[^"]*"' | cut -d'"' -f4)

echo "Frontend status: $FRONTEND_STATUS"
echo "Backend status: $BACKEND_STATUS"

if [ "$FRONTEND_STATUS" = "running" ] && [ "$BACKEND_STATUS" = "running" ]; then
    echo "✅ All services are running!"
else
    echo "⚠️  Warning: Some services may not be running properly"
    echo "Check logs with: docker compose logs -f"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📌 Next steps:"
echo "1. Visit https://bartaaddaa.com"
echo "2. Clear browser cache (Ctrl+Shift+Delete)"
echo "3. Test the following:"
echo "   - Login/Signup"
echo "   - Profile page"
echo "   - Blog detail pages"
echo "   - Post detail pages"
echo "   - Image uploads"
echo ""
echo "🔍 To view logs:"
echo "   docker compose logs -f"
echo ""
echo "🐛 To troubleshoot:"
echo "   docker compose logs frontend"
echo "   docker compose logs backend"
echo ""
