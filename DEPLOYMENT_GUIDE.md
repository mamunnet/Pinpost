# 🚀 Pinpost Production Deployment Guide

Complete guide for deploying Pinpost to production with Docker, cloud platforms, and best practices.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Deployment Options](#cloud-deployment-options)
6. [SSL/HTTPS Setup](#ssl-https-setup)
7. [Database Setup](#database-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Scaling & Performance](#scaling--performance)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start

### For Windows Users:

```powershell
# 1. Clone and navigate to project
cd C:\Users\mamun\Desktop\Pinpost

# 2. Copy environment file and configure
cp .env.example .env
# Edit .env with your credentials

# 3. Run deployment script
.\deploy.ps1
```

### For Linux/Mac Users:

```bash
# 1. Clone and navigate to project
cd ~/Pinpost

# 2. Copy environment file and configure
cp .env.example .env
# Edit .env with your credentials

# 3. Run deployment script
chmod +x deploy.sh
./deploy.sh
```

Your app will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Prerequisites

### Required Software:

1. **Docker** (v20.10+)
   - Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
   - Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)

2. **Docker Compose** (v2.0+)
   - Usually included with Docker Desktop
   - Linux: `sudo apt-get install docker-compose-plugin`

3. **MongoDB Atlas Account** (Free tier available)
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free M0 cluster

### Verify Installation:

```bash
docker --version
docker-compose --version
```

---

## Environment Setup

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Production Variables

Edit `.env` file with your production settings:

```env
# MongoDB Configuration
MONGO_URL=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=pinpost_production

# Security - CHANGE THESE!
SECRET_KEY=generate-a-random-32-character-string-here
JWT_EXPIRATION_HOURS=24

# CORS Settings
FRONTEND_URL=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Environment
ENVIRONMENT=production
```

### 3. Generate Secure Secret Key

**Windows PowerShell:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Linux/Mac:**
```bash
openssl rand -hex 32
```

---

## Docker Deployment

### Architecture Overview

```
┌─────────────────┐
│   Nginx         │  Port 80/443
│   (Frontend)    │
└────────┬────────┘
         │
┌────────┴────────┐
│   FastAPI       │  Port 8000
│   (Backend)     │
└────────┬────────┘
         │
┌────────┴────────┐
│   MongoDB       │  Atlas (Cloud)
│   (Database)    │
└─────────────────┘
```

### Build & Deploy

#### Option 1: Using Deployment Script (Recommended)

**Windows:**
```powershell
.\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Option 2: Manual Docker Compose

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Docker Commands Cheat Sheet

```bash
# View all containers
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker-compose exec backend python -c "print('Hello')"

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh
```

---

## Cloud Deployment Options

### 1. AWS (Amazon Web Services)

#### AWS EC2 + ECS

**Step 1: Create EC2 Instance**
```bash
# t3.medium recommended for production
# Ubuntu 22.04 LTS
```

**Step 2: Install Docker**
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu
```

**Step 3: Deploy**
```bash
git clone <your-repo>
cd Pinpost
cp .env.example .env
# Edit .env
./deploy.sh
```

**Step 4: Configure Security Groups**
- Allow inbound: 80 (HTTP), 443 (HTTPS), 22 (SSH)
- Outbound: All traffic

#### AWS Elastic Beanstalk

Create `Dockerrun.aws.json`:
```json
{
  "AWSEBDockerrunVersion": "3",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-registry/pinpost-frontend:latest",
      "essential": true,
      "memory": 512,
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 80
        }
      ]
    },
    {
      "name": "backend",
      "image": "your-registry/pinpost-backend:latest",
      "essential": true,
      "memory": 1024,
      "portMappings": [
        {
          "hostPort": 8000,
          "containerPort": 8000
        }
      ]
    }
  ]
}
```

Deploy:
```bash
eb init -p docker pinpost
eb create pinpost-production
eb deploy
```

---

### 2. Google Cloud Platform (GCP)

#### GCP Cloud Run

**Step 1: Build and Push Images**
```bash
# Backend
gcloud builds submit --tag gcr.io/PROJECT_ID/pinpost-backend ./backend

# Frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/pinpost-frontend ./frontend
```

**Step 2: Deploy Services**
```bash
# Deploy backend
gcloud run deploy pinpost-backend \
  --image gcr.io/PROJECT_ID/pinpost-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy pinpost-frontend \
  --image gcr.io/PROJECT_ID/pinpost-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### GCP Compute Engine

Same as AWS EC2 deployment steps.

---

### 3. Microsoft Azure

#### Azure Container Instances

```bash
# Create resource group
az group create --name pinpost-rg --location eastus

# Create container group
az container create \
  --resource-group pinpost-rg \
  --name pinpost-app \
  --image your-registry/pinpost-backend \
  --dns-name-label pinpost-unique \
  --ports 8000

az container create \
  --resource-group pinpost-rg \
  --name pinpost-frontend \
  --image your-registry/pinpost-frontend \
  --dns-name-label pinpost-frontend-unique \
  --ports 80
```

---

### 4. DigitalOcean

#### DigitalOcean Droplet

**Step 1: Create Droplet**
- Choose Docker Marketplace image
- Select size: Basic ($12/month minimum for production)

**Step 2: Deploy**
```bash
ssh root@your-droplet-ip
git clone <your-repo>
cd Pinpost
./deploy.sh
```

#### DigitalOcean App Platform

Create `app.yaml`:
```yaml
name: pinpost
services:
  - name: backend
    github:
      repo: your-username/pinpost
      branch: main
      deploy_on_push: true
    dockerfile_path: Dockerfile.backend
    http_port: 8000
    instance_count: 2
    instance_size_slug: basic-xxs
    
  - name: frontend
    github:
      repo: your-username/pinpost
      branch: main
      deploy_on_push: true
    dockerfile_path: Dockerfile.frontend
    http_port: 80
    instance_count: 2
    instance_size_slug: basic-xxs
```

Deploy:
```bash
doctl apps create --spec app.yaml
```

---

### 5. Heroku

#### Backend Deployment

Create `Procfile` in backend:
```
web: gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```

Deploy:
```bash
heroku create pinpost-backend
heroku addons:create mongolab:sandbox
git subtree push --prefix backend heroku main
```

#### Frontend Deployment

Create `static.json`:
```json
{
  "root": "build/",
  "routes": {
    "/**": "index.html"
  }
}
```

Deploy:
```bash
heroku create pinpost-frontend
heroku buildpacks:set mars/create-react-app
git subtree push --prefix frontend heroku main
```

---

### 6. Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel

```bash
cd frontend
vercel --prod
```

Configure build settings:
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

#### Backend on Railway

1. Connect GitHub repository
2. Select `backend` folder
3. Add environment variables
4. Deploy automatically

---

## SSL/HTTPS Setup

### Option 1: Nginx + Let's Encrypt (Recommended)

**Step 1: Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

**Step 2: Get SSL Certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Step 3: Update nginx.conf**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Your existing config...
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**Step 4: Auto-renewal**
```bash
sudo certbot renew --dry-run
```

### Option 2: Cloudflare (Free SSL)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable "Full" SSL mode
4. Automatic HTTPS rewriting

### Option 3: AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS

# Attach to load balancer
aws elbv2 create-listener \
  --load-balancer-arn <arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<certificate-arn>
```

---

## Database Setup

### MongoDB Atlas Setup

**Step 1: Create Cluster**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. Choose AWS/GCP/Azure region closest to your users

**Step 2: Configure Network Access**
1. Click "Network Access"
2. Add IP: `0.0.0.0/0` (allow from anywhere) OR specific IPs
3. For production, use VPC peering

**Step 3: Create Database User**
1. Click "Database Access"
2. Add user with read/write permissions
3. Save credentials securely

**Step 4: Get Connection String**
1. Click "Connect"
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your password
5. Add to `.env` as `MONGO_URL`

**Step 5: Create Indexes (Optional but Recommended)**

Connect via MongoDB Compass or Shell:
```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })

// Posts collection
db.posts.createIndex({ "created_at": -1 })
db.posts.createIndex({ "author._id": 1 })

// Blogs collection
db.blogs.createIndex({ "created_at": -1 })
db.blogs.createIndex({ "author._id": 1 })

// Notifications collection
db.notifications.createIndex({ "user_id": 1, "read": 1 })
db.notifications.createIndex({ "created_at": -1 })
```

---

## Monitoring & Logging

### 1. Application Logging

**View Docker logs:**
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00 backend
```

### 2. Health Checks

**Backend health endpoint:**
```bash
curl http://localhost:8000/api/health
```

**Frontend health endpoint:**
```bash
curl http://localhost/health
```

### 3. Monitoring Tools

#### Prometheus + Grafana

Create `docker-compose.monitoring.yml`:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

#### Cloud Monitoring

**AWS CloudWatch:**
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

**Google Cloud Monitoring:**
```bash
# Automatically enabled in Cloud Run/GKE
gcloud logging read "resource.type=cloud_run_revision"
```

**Azure Monitor:**
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app pinpost \
  --resource-group pinpost-rg
```

### 4. Error Tracking

**Sentry Integration:**

```bash
# Install Sentry SDK
pip install sentry-sdk[fastapi]
```

Add to `server.py`:
```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
    traces_sample_rate=1.0
)
```

---

## Scaling & Performance

### 1. Horizontal Scaling

**Scale with Docker Compose:**
```bash
docker-compose up -d --scale backend=3 --scale frontend=2
```

**Load Balancer (Nginx):**

Create `nginx-lb.conf`:
```nginx
upstream backend_servers {
    server backend:8000 weight=1;
    server backend:8000 weight=1;
    server backend:8000 weight=1;
}

server {
    listen 80;
    
    location /api {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Caching

**Redis Integration:**

Add to `docker-compose.yml`:
```yaml
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

**Backend caching:**
```bash
pip install redis
```

```python
import redis
r = redis.Redis(host='redis', port=6379, decode_responses=True)

# Cache user data
r.setex(f"user:{user_id}", 3600, json.dumps(user_data))
```

### 3. CDN for Static Assets

**Cloudflare CDN:**
1. Add domain to Cloudflare
2. Enable "Auto Minify" for JS/CSS
3. Enable "Brotli" compression
4. Set cache rules

**AWS CloudFront:**
```bash
aws cloudfront create-distribution \
  --origin-domain-name yourdomain.com \
  --default-root-object index.html
```

### 4. Database Optimization

**Connection Pooling:**
```python
# In server.py
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=45000
)
```

**MongoDB Performance:**
- Enable indexes (see Database Setup)
- Use projections (only fetch needed fields)
- Implement pagination (already done)
- Archive old data

---

## Security Best Practices

### 1. Environment Variables

✅ **DO:**
- Use `.env` files (never commit to git)
- Use secrets management (AWS Secrets Manager, Azure Key Vault)
- Rotate secrets regularly

❌ **DON'T:**
- Hardcode secrets in code
- Commit `.env` to version control
- Use default passwords

### 2. CORS Configuration

Update backend `.env`:
```env
# Production - specific domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Development - localhost
CORS_ORIGINS=http://localhost:3000,http://localhost:80
```

### 3. Rate Limiting

Install:
```bash
pip install slowapi
```

Add to `server.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, user: UserLogin):
    # Your login logic
    pass
```

### 4. Security Headers

Already included in `nginx.conf`:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "no-referrer-when-downgrade";
```

### 5. File Upload Security

- Limit file sizes (already set: 10MB)
- Validate file types
- Scan for malware
- Store outside web root
- Use unique filenames (already using UUIDs)

### 6. SQL/NoSQL Injection Prevention

✅ **Already safe** - using PyMongo with proper query structure

### 7. Update Dependencies

```bash
# Backend
pip list --outdated
pip install --upgrade package-name

# Frontend
npm outdated
npm update
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to MongoDB"

**Check:**
```bash
# Test connection
docker-compose exec backend python -c "from pymongo import MongoClient; MongoClient('YOUR_MONGO_URL').admin.command('ping'); print('Connected!')"
```

**Solutions:**
- Verify `MONGO_URL` in `.env`
- Check MongoDB Atlas network access (allow your IP)
- Ensure database user has correct permissions
- Check firewall rules

#### 2. "CORS Error"

**Check:**
```bash
# View backend logs
docker-compose logs backend | grep CORS
```

**Solutions:**
- Update `CORS_ORIGINS` in `.env`
- Restart backend: `docker-compose restart backend`
- Clear browser cache

#### 3. "Container keeps restarting"

**Check:**
```bash
# View logs
docker-compose logs backend
docker-compose logs frontend

# Check container status
docker-compose ps
```

**Solutions:**
- Check for syntax errors in code
- Verify all environment variables are set
- Check port conflicts: `netstat -ano | findstr :8000`
- Increase memory in Docker settings

#### 4. "File upload fails"

**Check:**
```bash
# Verify uploads directory
docker-compose exec backend ls -la /app/uploads

# Check permissions
docker-compose exec backend chmod 777 /app/uploads
```

**Solutions:**
- Ensure `uploads` directory exists
- Check file size limits
- Verify disk space
- Check file permissions

#### 5. "Frontend shows blank page"

**Check:**
```bash
# Browser console for errors
# Check frontend logs
docker-compose logs frontend

# Verify build
docker-compose exec frontend ls -la /usr/share/nginx/html
```

**Solutions:**
- Clear browser cache
- Check `REACT_APP_API_URL` environment variable
- Rebuild frontend: `docker-compose up -d --build frontend`
- Check nginx configuration

#### 6. "Slow performance"

**Solutions:**
- Enable database indexes
- Implement caching (Redis)
- Use CDN for static files
- Scale horizontally (more containers)
- Optimize images (compress, resize)
- Enable gzip compression (already in nginx.conf)

### Debug Commands

```bash
# Check container resource usage
docker stats

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# View environment variables
docker-compose exec backend env

# Test API endpoints
curl -X GET http://localhost:8000/api/health
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Network debugging
docker network ls
docker network inspect pinpost_pinpost-network

# Volume inspection
docker volume ls
docker volume inspect pinpost_uploads
```

---

## Maintenance

### Backup Strategy

**1. Database Backup (MongoDB Atlas):**
- Automatic daily backups (built-in)
- Manual backup: Cloud Manager → Backup → Take Snapshot

**2. File Uploads Backup:**
```bash
# Backup uploads
docker-compose exec backend tar -czf /tmp/uploads-backup.tar.gz /app/uploads
docker cp pinpost-backend:/tmp/uploads-backup.tar.gz ./backups/

# Restore uploads
docker cp ./backups/uploads-backup.tar.gz pinpost-backend:/tmp/
docker-compose exec backend tar -xzf /tmp/uploads-backup.tar.gz -C /
```

**3. Automated Backup Script:**

Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T backend tar -czf - /app/uploads > backups/uploads_$DATE.tar.gz
echo "Backup completed: uploads_$DATE.tar.gz"
```

Schedule with cron:
```bash
crontab -e
# Add: 0 2 * * * /path/to/Pinpost/backup.sh
```

### Update Strategy

```bash
# 1. Backup first
./backup.sh

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 4. Verify
docker-compose ps
curl http://localhost:8000/api/health
```

---

## Performance Benchmarks

### Expected Performance

- **Response Time:** < 200ms (API)
- **Page Load:** < 2s (Frontend)
- **WebSocket Latency:** < 100ms
- **Concurrent Users:** 1000+ (with scaling)

### Load Testing

**Using Apache Bench:**
```bash
ab -n 1000 -c 100 http://localhost:8000/api/health
```

**Using wrk:**
```bash
wrk -t12 -c400 -d30s http://localhost:8000/api/health
```

---

## Cost Estimation

### Small Project (< 1000 users)

| Service | Provider | Cost/Month |
|---------|----------|------------|
| Database | MongoDB Atlas M0 | $0 (Free) |
| Backend | DigitalOcean Droplet | $12 |
| Frontend | Vercel/Netlify | $0 (Free) |
| Domain | Namecheap | $1 |
| **Total** | | **$13/month** |

### Medium Project (< 10,000 users)

| Service | Provider | Cost/Month |
|---------|----------|------------|
| Database | MongoDB Atlas M10 | $57 |
| Backend | AWS EC2 t3.medium | $30 |
| Frontend | AWS S3 + CloudFront | $5 |
| Domain + SSL | Route 53 + ACM | $1 |
| **Total** | | **$93/month** |

### Large Project (100,000+ users)

| Service | Provider | Cost/Month |
|---------|----------|------------|
| Database | MongoDB Atlas M30 | $243 |
| Backend | AWS ECS (3 instances) | $150 |
| Frontend | AWS CloudFront + S3 | $20 |
| Load Balancer | AWS ALB | $20 |
| Redis Cache | AWS ElastiCache | $15 |
| Monitoring | DataDog | $15 |
| **Total** | | **$463/month** |

---

## Support & Resources

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Docker Docs](https://docs.docker.com/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

### Community
- FastAPI Discord: https://discord.gg/fastapi
- React Discord: https://discord.gg/react

### Professional Support
- AWS Support: https://aws.amazon.com/premiumsupport/
- MongoDB Support: https://support.mongodb.com/

---

## Checklist

### Pre-Deployment

- [ ] `.env` file configured with production values
- [ ] SECRET_KEY generated (32+ random characters)
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with proper permissions
- [ ] Network access configured in MongoDB Atlas
- [ ] Domain purchased (if applicable)
- [ ] SSL certificate ready (Let's Encrypt/Cloudflare)
- [ ] Docker and Docker Compose installed
- [ ] Code tested locally

### Deployment

- [ ] Environment variables set
- [ ] Docker images built successfully
- [ ] Containers started and healthy
- [ ] Health checks passing
- [ ] Database connection working
- [ ] File uploads working
- [ ] CORS configured correctly
- [ ] SSL/HTTPS working
- [ ] WebSocket connections working

### Post-Deployment

- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Backups scheduled
- [ ] Security headers verified
- [ ] Performance tested
- [ ] Error tracking enabled (Sentry)
- [ ] Rate limiting enabled
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## License

This deployment guide is part of the Pinpost project.

---

## Contributing

Found an issue or want to improve the deployment process? Please open an issue or pull request!

---

**Happy Deploying! 🚀**
