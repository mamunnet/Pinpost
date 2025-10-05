cd /docker/pinpost
git pull origin main
docker compose up -d --build

cd backend; C:/Users/mamun/Desktop/Pinpost/.venv/Scripts/python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
 run backend