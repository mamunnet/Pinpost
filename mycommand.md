cd /docker/pinpost
git pull origin main
docker compose up -d --build

cd backend; python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
 run backend