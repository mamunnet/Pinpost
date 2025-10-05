#!/bin/bash

# Pinpost Production Deployment Script

set -e  # Exit on error

echo "🚀 Starting Pinpost Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}📝 Please edit .env file with your production credentials${NC}"
        echo -e "${YELLOW}Press Enter after editing .env file...${NC}"
        read
    else
        echo -e "${RED}❌ .env.example not found. Cannot create .env file.${NC}"
        exit 1
    fi
fi

# Generate secret key if needed
if grep -q "your-super-secret-key" .env; then
    echo -e "${YELLOW}🔐 Generating secure SECRET_KEY...${NC}"
    SECRET_KEY=$(openssl rand -hex 32)
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    echo -e "${GREEN}✅ SECRET_KEY generated${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Pull latest code (if using git)
if [ -d .git ]; then
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    git pull origin main || echo -e "${YELLOW}⚠️  Git pull skipped${NC}"
fi

# Build images
echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
docker-compose build --no-cache

# Start containers
echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Check container status
echo -e "${YELLOW}📊 Container status:${NC}"
docker-compose ps

# Check backend health
echo -e "${YELLOW}🏥 Checking backend health...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8000/api/health &> /dev/null; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend health check failed${NC}"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

# Check frontend health
echo -e "${YELLOW}🏥 Checking frontend health...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:80/health &> /dev/null; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend health check failed${NC}"
        docker-compose logs frontend
        exit 1
    fi
    sleep 2
done

# Display deployment info
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Pinpost deployed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "Frontend: ${GREEN}http://localhost${NC}"
echo -e "Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo -e "  View logs:          ${GREEN}docker-compose logs -f${NC}"
echo -e "  Stop containers:    ${GREEN}docker-compose down${NC}"
echo -e "  Restart services:   ${GREEN}docker-compose restart${NC}"
echo -e "  View backend logs:  ${GREEN}docker-compose logs -f backend${NC}"
echo -e "  View frontend logs: ${GREEN}docker-compose logs -f frontend${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
