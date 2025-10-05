# 🚀 Simple Deployment Guide for Hostinger

## When you make changes to the code, follow these steps:

### 1️⃣ Push your changes to GitHub (already done ✅)
```bash
git add -A
git commit -m "Your commit message"
git push
```

### 2️⃣ SSH into your Hostinger server
```bash
ssh root@72.60.203.48
```

### 3️⃣ Navigate to the project directory
```bash
cd /path/to/Pinpost
```

### 4️⃣ Pull the latest code from GitHub
```bash
git pull origin main
```

### 5️⃣ Rebuild and restart the containers

**If you changed FRONTEND code (like removing branding):**
```bash
docker-compose up -d --build frontend
```

**If you changed BACKEND code:**
```bash
docker-compose up -d --build backend
```

**If you changed BOTH frontend and backend:**
```bash
docker-compose up -d --build
```

### 6️⃣ Check if containers are running
```bash
docker-compose ps
```

### 7️⃣ Check logs if something is wrong
```bash
# Frontend logs
docker-compose logs -f frontend

# Backend logs
docker-compose logs -f backend
```

---

## 🎯 For Your Current Issue (Remove Emergent Branding):

Since you already pushed the code to GitHub, just run these commands on Hostinger:

```bash
# SSH into server
ssh root@72.60.203.48

# Go to project directory
cd /path/to/Pinpost

# Pull latest code
git pull origin main

# Rebuild and restart frontend only
docker-compose up -d --build frontend

# Wait 30 seconds, then check
docker-compose ps
```

The branding will be removed after the frontend container rebuilds! 🎉

---

## ⚡ Quick Commands Reference

| Action | Command |
|--------|---------|
| View running containers | `docker-compose ps` |
| View all logs | `docker-compose logs -f` |
| View frontend logs | `docker-compose logs -f frontend` |
| View backend logs | `docker-compose logs -f backend` |
| Restart frontend | `docker-compose restart frontend` |
| Restart backend | `docker-compose restart backend` |
| Restart all | `docker-compose restart` |
| Stop all | `docker-compose down` |
| Start all | `docker-compose up -d` |
| Rebuild all | `docker-compose up -d --build` |

---

## 🔥 Important Notes:

1. **Always commit and push to GitHub first** before deploying
2. **Use `--build` flag** when you change code (forces Docker to rebuild)
3. **Without `--build` flag** it will just restart with old code
4. **Wait 30-60 seconds** after rebuild for containers to fully start
5. **Check logs** if something doesn't work: `docker-compose logs -f`

---

## 🎨 Your Current Setup:

- **Domain**: https://bartaaddaa.com
- **Server IP**: 72.60.203.48
- **Frontend Port**: 80 (HTTP) and 443 (HTTPS via Cloudflare)
- **Backend Port**: 8000
- **Database**: MongoDB Atlas
