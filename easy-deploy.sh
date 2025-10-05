# 🚀 Ultimate Easy Deploy Script for Hostinger

# This script does EVERYTHING automatically!
# Just run: bash easy-deploy.sh

set -e

# Colors for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
clear
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║          🚀 PINPOST EASY DEPLOYER 🚀                 ║"
echo "║                                                       ║"
echo "║          For Non-Technical Users                     ║"
echo "║          Hostinger VPS Edition                       ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use: sudo bash easy-deploy.sh)"
    exit 1
fi

print_success "Running as root - Good!"
echo ""

# Step 1: Check Docker
print_step "Step 1: Checking if Docker is installed..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
else
    print_warning "Docker not found. Installing Docker..."
    apt update
    apt install -y docker.io
    systemctl start docker
    systemctl enable docker
    print_success "Docker installed successfully!"
fi
echo ""

# Step 2: Check Docker Compose
print_step "Step 2: Checking if Docker Compose is installed..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose is installed: $COMPOSE_VERSION"
else
    print_warning "Docker Compose not found. Installing..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully!"
fi
echo ""

# Step 3: Get MongoDB URL
print_step "Step 3: MongoDB Configuration"
echo -e "${YELLOW}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 IMPORTANT: You need your MongoDB connection string!"
echo ""
echo "Get it from: https://cloud.mongodb.com"
echo "1. Click 'Database' → 'Connect' → 'Connect your application'"
echo "2. Copy the connection string"
echo "3. Replace <password> with your actual password"
echo ""
echo "Example:"
echo "mongodb+srv://user:pass123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo ""

read -p "Enter your MongoDB connection string: " MONGO_URL

if [ -z "$MONGO_URL" ]; then
    print_error "MongoDB URL cannot be empty!"
    exit 1
fi

print_success "MongoDB URL saved!"
echo ""

# Step 4: Get Domain or IP
print_step "Step 4: Domain/IP Configuration"
echo -e "${YELLOW}"
echo "Enter your domain (e.g., pinpost.com) or VPS IP address (e.g., 123.45.67.89)"
echo "If you don't have a domain yet, just press Enter to auto-detect IP"
echo -e "${NC}"
read -p "Domain or IP: " DOMAIN

if [ -z "$DOMAIN" ]; then
    print_warning "Auto-detecting server IP..."
    DOMAIN=$(curl -s ifconfig.me)
    print_success "Detected IP: $DOMAIN"
fi
echo ""

# Step 5: Generate Secret Key
print_step "Step 5: Generating secure secret key..."
SECRET_KEY=$(openssl rand -hex 32)
print_success "Secret key generated!"
echo ""

# Step 6: Create .env file
print_step "Step 6: Creating configuration file..."
cat > .env << EOF
# MongoDB Configuration
MONGO_URL=$MONGO_URL
DB_NAME=pinpost_production

# Security
SECRET_KEY=$SECRET_KEY
JWT_EXPIRATION_HOURS=24

# CORS Settings
FRONTEND_URL=http://$DOMAIN

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Environment
ENVIRONMENT=production
EOF

print_success "Configuration file created!"
echo ""

# Step 7: Create uploads directory
print_step "Step 7: Creating uploads directory..."
mkdir -p backend/uploads
chmod -R 777 backend/uploads
print_success "Uploads directory ready!"
echo ""

# Step 8: Configure firewall
print_step "Step 8: Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8000/tcp
    ufw --force enable
    print_success "Firewall configured!"
else
    print_warning "UFW not found. Opening ports manually..."
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
    print_success "Ports opened!"
fi
echo ""

# Step 9: Stop old containers if any
print_step "Step 9: Cleaning up old containers..."
docker-compose down 2>/dev/null || true
docker system prune -f
print_success "Cleanup complete!"
echo ""

# Step 10: Build and start containers
print_step "Step 10: Building and starting Pinpost..."
echo -e "${YELLOW}This will take 5-10 minutes. Please wait...${NC}"
echo ""

docker-compose build --no-cache
docker-compose up -d

print_success "Containers started!"
echo ""

# Step 11: Wait for services to be healthy
print_step "Step 11: Waiting for services to start (30 seconds)..."
sleep 30
echo ""

# Step 12: Check status
print_step "Step 12: Checking container status..."
docker-compose ps
echo ""

# Step 13: Test backend
print_step "Step 13: Testing backend connection..."
for i in {1..20}; do
    if curl -f http://localhost:8000/api/health &> /dev/null; then
        print_success "Backend is running!"
        break
    fi
    if [ $i -eq 20 ]; then
        print_error "Backend failed to start. Check logs: docker-compose logs backend"
        exit 1
    fi
    sleep 3
done
echo ""

# Step 14: Test frontend
print_step "Step 14: Testing frontend connection..."
for i in {1..20}; do
    if curl -f http://localhost:80/ &> /dev/null; then
        print_success "Frontend is running!"
        break
    fi
    if [ $i -eq 20 ]; then
        print_error "Frontend failed to start. Check logs: docker-compose logs frontend"
        exit 1
    fi
    sleep 3
done
echo ""

# Success!
clear
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          🎉 PINPOST DEPLOYED SUCCESSFULLY! 🎉                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${CYAN}🌐 Your Pinpost is live at:${NC}"
echo ""
echo -e "   ${GREEN}Frontend:${NC} http://$DOMAIN"
echo -e "   ${GREEN}Backend API:${NC} http://$DOMAIN:8000"
echo -e "   ${GREEN}API Docs:${NC} http://$DOMAIN:8000/docs"
echo ""
echo -e "${CYAN}📚 Useful Commands:${NC}"
echo ""
echo -e "   ${YELLOW}View all logs:${NC}          docker-compose logs -f"
echo -e "   ${YELLOW}View backend logs:${NC}      docker-compose logs -f backend"
echo -e "   ${YELLOW}View frontend logs:${NC}     docker-compose logs -f frontend"
echo -e "   ${YELLOW}Restart everything:${NC}     docker-compose restart"
echo -e "   ${YELLOW}Stop everything:${NC}        docker-compose down"
echo -e "   ${YELLOW}Start again:${NC}            docker-compose up -d"
echo ""
echo -e "${CYAN}🔧 Configuration:${NC}"
echo ""
echo -e "   ${YELLOW}MongoDB URL:${NC} ${MONGO_URL:0:50}..."
echo -e "   ${YELLOW}Domain/IP:${NC} $DOMAIN"
echo -e "   ${YELLOW}Config file:${NC} .env"
echo ""
echo -e "${CYAN}📦 Next Steps:${NC}"
echo ""
echo "   1. ✅ Open http://$DOMAIN in your browser"
echo "   2. ✅ Register your first account"
echo "   3. ✅ Create your first post"
echo "   4. ✅ Share with friends!"
echo ""
echo -e "${CYAN}🆘 Need Help?${NC}"
echo ""
echo "   View this guide: cat HOSTINGER_DEPLOYMENT.md"
echo "   Or visit: https://github.com/mamunnet/Pinpost"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${PURPLE}Made with ❤️ for Vibe Coders${NC}"
echo ""
