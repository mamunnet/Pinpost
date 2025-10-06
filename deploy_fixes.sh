#!/bin/bash
# Production Deployment Script for Image & Blog Article Fixes
# Run this script on your production server

echo "========================================"
echo "Pinpost Production Deployment"
echo "Fixes: Images & Blog Articles"
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

echo "Step 3: Rebuilding frontend container (critical for image fixes)..."
docker-compose up -d --build frontend
if [ $? -ne 0 ]; then
    echo "Error: Frontend rebuild failed"
    exit 1
fi
echo "✓ Frontend rebuilt successfully"
echo ""

echo "Step 4: Restarting backend container (for improved error handling)..."
docker-compose restart backend
if [ $? -ne 0 ]; then
    echo "Error: Backend restart failed"
    exit 1
fi
echo "✓ Backend restarted successfully"
echo ""

echo "Step 5: Checking container health..."
sleep 10
docker-compose ps
echo ""

echo "Step 6: Testing API endpoints..."
echo "Testing backend health..."
curl -f http://localhost:8000/api/health || echo "Warning: Backend health check failed"
echo ""

echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Please verify:"
echo "  ✓ Profile photos display correctly"
echo "  ✓ Post images load properly"
echo "  ✓ Blog articles open without errors"
echo ""
echo "View logs with:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo ""
