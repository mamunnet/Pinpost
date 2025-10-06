# Deployment Commands

## ⚠️ IMPORTANT: Before Deploying
Check `frontend/.env` file:
- For PRODUCTION: `REACT_APP_BACKEND_URL=https://bartaaddaa.com`
- For LOCAL DEV: `REACT_APP_BACKEND_URL=http://localhost:8000`

## Remote Server Deployment
```bash
cd /docker/pinpost
git pull origin main
# Important: Rebuild frontend to apply .env changes
docker compose down
docker compose up -d --build
```

## Quick Frontend-Only Redeploy (after .env change)
```bash
cd /docker/pinpost
git pull origin main
docker compose up -d --build frontend
```

## Local Development - Backend
cd backend; python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload

## Local Development - Frontend  
cd frontend
yarn install
yarn start

## Docker Build Notes
- Frontend uses yarn.lock (not npm)
- Dockerfile.frontend updated to use yarn exclusively
- Network timeout increased for slow connections
- Retry logic added for dependency installation

## If Docker build fails:
1. Clear Docker cache: docker builder prune -a
2. Remove old images: docker system prune -a
3. Rebuild: docker compose up -d --build frontend
