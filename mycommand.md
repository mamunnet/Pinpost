cd /docker/pinpost
git pull origin main
docker compose up -d --build

# For local backend development
cd backend; python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# CLOUDINARY SETUP (Recommended for Production)
# 1. Sign up at https://cloudinary.com (free tier: 25GB)
# 2. Get credentials from dashboard
# 3. Add to backend/.env:
#    CLOUDINARY_CLOUD_NAME=your_cloud_name
#    CLOUDINARY_API_KEY=your_api_key
#    CLOUDINARY_API_SECRET=your_api_secret
#    USE_CLOUDINARY=true
# 4. Install cloudinary package:
cd backend
pip install -r requirements.txt
# 5. Migrate existing images (one-time):
python migrate_to_cloudinary.py
# 6. Restart server

# PRODUCTION DEPLOYMENT (After Image & Blog Fixes)
# Quick deployment:
cd /docker/pinpost
git pull origin main
docker compose up -d --build frontend  # Critical: Rebuilds frontend with image fixes
docker compose restart backend          # Updates backend error handling

# Or use the deployment script:
chmod +x deploy_fixes.sh
./deploy_fixes.sh

# LATEST FIXES (WebSocket HTTPS/WSS + Mobile Images + Cloudinary)
# CRITICAL: Must rebuild both containers for nginx config changes
cd /docker/pinpost
git pull origin main
docker compose down
docker compose up -d --build

# Verify WebSocket on mobile:
# 1. Open browser console on mobile
# 2. Should see: ✅ WebSocket connected
# 3. Connection URL should be: wss:// (not ws://)

# Verify images on mobile:
# 1. Clear mobile browser cache
# 2. Reload any page with images
# 3. Images should load from Cloudinary or /uploads/
# 4. No localhost URLs in image src

# Full rebuild (if needed):
docker compose down
docker compose up -d --build
