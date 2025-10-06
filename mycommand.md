# Deployment Commands

## Remote Server Deployment
cd /docker/pinpost
git pull origin main
docker compose up -d --build

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
