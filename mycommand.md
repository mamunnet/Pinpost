cd /docker/pinpost
git pull origin main
docker compose up -d --build

# For local backend development
cd backend; python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# PRODUCTION DEPLOYMENT (After Image & Blog Fixes)
# Quick deployment:
cd /docker/pinpost
git pull origin main
docker compose up -d --build frontend  # Critical: Rebuilds frontend with image fixes
docker compose restart backend          # Updates backend error handling

# Or use the deployment script:
chmod +x deploy_fixes.sh
./deploy_fixes.sh

# Full rebuild (if needed):
docker compose down
docker compose up -d --build
