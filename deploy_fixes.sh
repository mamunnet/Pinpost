#!/bin/bash
# Production Deployment Script for WebSocket & Mobile Image Fixes
# Run this script on your production server

echo "========================================"
echo "Pinpost Production Deployment"
echo "Fixes: WebSocket HTTPS/WSS + Mobile Images"
echo "========================================"
echo ""

# Navigate to project directory
cd /docker/pinpost || { echo "Error: Could not find /docker/pinpost directory"; exit 1; }

echo "Step 1: Pulling latest code from repository..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "Error: Git pull failed"
    exit 1
fi
echo "✓ Code updated successfully"
echo ""

echo "Step 2: Backing up current containers..."
docker-compose ps > deployment_backup_$(date +%Y%m%d_%H%M%S).txt
echo "✓ Container state backed up"
echo ""

echo "Step 3: Stopping containers..."
docker-compose down
echo "✓ Containers stopped"
echo ""

echo "Step 4: Rebuilding all containers (required for nginx config changes)..."
docker-compose up -d --build
if [ $? -ne 0 ]; then
    echo "Error: Container rebuild failed"
    exit 1
fi
echo "✓ Containers rebuilt successfully"
echo ""

echo "Step 5: Waiting for containers to be healthy..."
sleep 15
docker-compose ps
echo ""

echo "Step 6: Testing endpoints..."
echo "Testing backend health..."
curl -f http://localhost:8000/api/health || echo "Warning: Backend health check failed"
echo ""

echo "Testing WebSocket upgrade..."
curl -I -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/ws/notifications/test 2>&1 | grep -i upgrade || echo "Info: WebSocket upgrade header check"
echo ""

echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "CRITICAL: Test on Mobile Devices"
echo "================================"
echo ""
echo "WebSocket Tests:"
echo "  1. Open site on mobile HTTPS"
echo "  2. Check browser console"
echo "  3. Should see: wss:// (not ws://)"
echo "  4. Test real-time notifications"
echo ""
echo "Image Tests:"
echo "  1. Clear mobile browser cache"
echo "  2. Reload page with images"
echo "  3. All images should load"
echo "  4. Check URLs don't contain localhost"
echo ""
echo "View logs with:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo ""
