# Deployment Commands

## ⚠️ CRITICAL: Environment Files

**For LOCAL Development:**
- File: `frontend/.env`  
- Content: `REACT_APP_BACKEND_URL=http://localhost:8000`

**For PRODUCTION Deployment:**
- File: `frontend/.env.production`  
- Content: `REACT_APP_BACKEND_URL=https://bartaaddaa.com`
- ✅ This file is used by Docker automatically during builds

## Remote Server Deployment (RECOMMENDED)

### Full Automated Deployment
```bash
cd /docker/pinpost

# If deploy.sh has local changes, reset it first
git fetch origin
git checkout origin/main -- deploy.sh
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Deployment
```bash
cd /docker/pinpost

# If git pull fails due to local changes, stash them first
git stash
git pull origin main
git stash pop

# OR force overwrite local changes with remote
git fetch origin
git reset --hard origin/main

# Verify production env file exists
cat frontend/.env.production
# Should show: REACT_APP_BACKEND_URL=https://bartaaddaa.com

# Rebuild and deploy (now rebuilds BOTH backend and frontend)
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d

# Check logs
docker compose logs -f
```

## Local Development

### Backend (Terminal 1)
```bash
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Terminal 2)
```bash  
cd frontend
yarn install
yarn start
```

## Quick Fixes

### If production shows "User Not Found" or "Article not found"
This means the frontend was built with wrong backend URL.

**Fix:**
```bash
cd /docker/pinpost
# Ensure .env.production has correct URL
echo "REACT_APP_BACKEND_URL=https://bartaaddaa.com" > frontend/.env.production
# Rebuild frontend
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

### If local dev shows CORS errors
Your `frontend/.env` is pointing to production instead of localhost.

**Fix:**
```powershell
# On Windows
cd D:\dev_project\Pinpost
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > frontend\.env

# Restart frontend (Ctrl+C then):
cd frontend
yarn start
```

## Docker Build Notes
- Frontend uses yarn.lock (not npm)
- Dockerfile.frontend uses .env.production for builds
- Network timeout increased for slow connections
- Backend uses .env from root directory

## Troubleshooting

### Check current backend URL in production
```bash
docker compose logs frontend | grep -i backend
```

### Clear Docker cache
```bash
docker builder prune -a
docker system prune -a
```

### Rebuild everything
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### View real-time logs
```bash
docker compose logs -f frontend
docker compose logs -f backend
```

