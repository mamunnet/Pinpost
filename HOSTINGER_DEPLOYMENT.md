# 🚀 Easy Pinpost Deployment with Hostinger

## For Non-Technical Users - Simple & Easy! 

This guide will help you deploy Pinpost to Hostinger using their 1-click Docker feature. No complex commands needed! 🎉

---

## 📋 What You'll Need

1. **Hostinger VPS Account** (Business or Higher plan with Docker)
   - Cost: Starting at $5.99/month
   - [Get Hostinger VPS](https://www.hostinger.com/vps-hosting)

2. **MongoDB Atlas Account** (100% FREE Forever!)
   - [Sign up here](https://www.mongodb.com/cloud/atlas/register)

3. **Domain Name** (Optional, but recommended)
   - Can purchase from Hostinger for ~$10/year

---

## 🎯 Step-by-Step Deployment (Super Easy!)

### Part 1: Setup MongoDB (5 minutes)

#### 1. Create Free MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Click **"Sign Up"** (Use Google sign-in for fastest setup)
3. Choose **"Free"** plan (M0)
4. Click **"Create"**

#### 2. Create Database User

1. Click **"Database Access"** on left sidebar
2. Click **"Add New Database User"**
3. Choose a username (example: `pinpost`)
4. Click **"Autogenerate Secure Password"** - SAVE THIS PASSWORD! 📝
5. Select **"Read and write to any database"**
6. Click **"Add User"**

#### 3. Allow Access from Anywhere

1. Click **"Network Access"** on left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

#### 4. Get Your Connection String

1. Click **"Database"** on left sidebar
2. Click **"Connect"** button
3. Choose **"Connect your application"**
4. Copy the connection string (looks like this):
   ```
   mongodb+srv://pinpost:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANT**: Replace `<password>` with the password from step 2
6. **Save this complete string!** You'll need it later 📝

---

### Part 2: Setup Hostinger VPS (10 minutes)

#### 1. Purchase Hostinger VPS

1. Go to [Hostinger VPS](https://www.hostinger.com/vps-hosting)
2. Choose **"KVM 2"** or higher plan ($5.99/month)
3. Complete purchase

#### 2. Setup Your VPS

1. Go to Hostinger **hPanel** (dashboard)
2. Click on your **VPS**
3. Click **"Setup"** or **"Operating System"**
4. Choose **"Ubuntu 22.04 with Docker"** (This is the 1-click Docker!)
5. Set a root password - **SAVE THIS!** 📝
6. Click **"Change Operating System"**
7. Wait 5-10 minutes for setup to complete

#### 3. Access Your VPS

**Option A: Use Hostinger's Browser Terminal (Easiest!)**
1. In hPanel, click your VPS
2. Click **"Browser Terminal"**
3. Login with username: `root` and the password you set

**Option B: Use SSH (For advanced users)**
```bash
ssh root@your-vps-ip-address
```

---

### Part 3: Deploy Pinpost (5 minutes)

#### 1. Download Pinpost

In your Hostinger terminal, copy and paste this command:

```bash
cd /root && git clone https://github.com/mamunnet/Pinpost.git && cd Pinpost
```

Press **Enter** ✅

#### 2. Create Configuration File

Copy and paste this command:

```bash
cat > .env << 'EOF'
# MongoDB Configuration - CHANGE THESE!
MONGO_URL=mongodb+srv://pinpost:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=pinpost_production

# Security - Don't change this
SECRET_KEY=GENERATED_AUTOMATICALLY_BY_SCRIPT

# CORS - Change to your domain
FRONTEND_URL=http://your-vps-ip-address

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Environment
ENVIRONMENT=production
EOF
```

Press **Enter** ✅

#### 3. Edit Configuration File

Now we need to edit the file with YOUR information:

```bash
nano .env
```

Press **Enter**, then:

1. **Replace** `MONGO_URL` with your MongoDB connection string from Part 1, Step 4
2. **Replace** `your-vps-ip-address` with your actual VPS IP (find it in Hostinger hPanel)
3. Press **Ctrl + X**, then **Y**, then **Enter** to save

#### 4. Generate Secret Key

Copy and paste this command to generate a secure secret key:

```bash
SECRET_KEY=$(openssl rand -hex 32) && sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env && echo "✅ Secret key generated!"
```

Press **Enter** ✅

#### 5. Install Docker Compose (if not installed)

```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose && docker-compose --version
```

Press **Enter** ✅

#### 6. Deploy Your App! 🚀

This is it! Just one command:

```bash
docker-compose up -d --build
```

Press **Enter** and wait 5-10 minutes for the build to complete ✅

#### 7. Check if Everything is Running

```bash
docker-compose ps
```

You should see both `pinpost-backend` and `pinpost-frontend` with status **"Up"** ✅

---

### Part 4: Access Your Website! 🎉

1. Open your browser
2. Go to: `http://YOUR_VPS_IP_ADDRESS`
3. **You should see Pinpost!** 🎊

Example: `http://123.45.67.89`

---

## 🌐 Add Your Domain (Optional)

### If you have a domain (like pinpost.com):

#### 1. Point Domain to VPS

In Hostinger DNS settings:

1. Go to **Domains** → **DNS / Name Servers**
2. Add **A Record**:
   - Type: `A`
   - Name: `@`
   - Value: `Your VPS IP Address`
   - TTL: `14400`
3. Add another **A Record**:
   - Type: `A`
   - Name: `www`
   - Value: `Your VPS IP Address`
   - TTL: `14400`
4. Click **Save**
5. Wait 10-30 minutes for DNS to propagate

#### 2. Update Your Configuration

```bash
cd /root/Pinpost
nano .env
```

Change:
```env
FRONTEND_URL=http://your-vps-ip-address
```

To:
```env
FRONTEND_URL=https://yourdomain.com
```

Save with **Ctrl + X**, **Y**, **Enter**

#### 3. Setup Free SSL Certificate (HTTPS)

```bash
# Install Certbot
apt update && apt install certbot python3-certbot-nginx -y

# Stop current containers
cd /root/Pinpost && docker-compose down

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Restart containers
docker-compose up -d
```

Now visit: `https://yourdomain.com` 🔒✅

---

## 📱 Common Tasks (Copy & Paste These!)

### View Logs (See What's Happening)
```bash
cd /root/Pinpost && docker-compose logs -f
```
Press **Ctrl + C** to exit

### Restart Everything
```bash
cd /root/Pinpost && docker-compose restart
```

### Stop Everything
```bash
cd /root/Pinpost && docker-compose down
```

### Start Everything Again
```bash
cd /root/Pinpost && docker-compose up -d
```

### Update to Latest Version
```bash
cd /root/Pinpost && git pull && docker-compose down && docker-compose up -d --build
```

### Backup Your Data
```bash
cd /root/Pinpost && tar -czf backup-$(date +%Y%m%d).tar.gz backend/uploads .env && ls -lh backup-*
```

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

---

## 🆘 Troubleshooting (When Things Don't Work)

### Problem 1: "Can't access the website"

**Solution:**
```bash
# Check if containers are running
cd /root/Pinpost && docker-compose ps

# If they're not running, start them
docker-compose up -d

# Check firewall
ufw allow 80
ufw allow 443
```

### Problem 2: "MongoDB connection error"

**Solution:**
1. Check your `.env` file:
   ```bash
   cat /root/Pinpost/.env
   ```
2. Make sure `MONGO_URL` is correct (no spaces, password is correct)
3. Restart:
   ```bash
   cd /root/Pinpost && docker-compose restart
   ```

### Problem 3: "Containers keep restarting"

**Solution:**
```bash
# See what's wrong
cd /root/Pinpost && docker-compose logs backend

# Usually means wrong MongoDB connection
# Edit .env and fix MONGO_URL
nano .env
# Then restart
docker-compose restart
```

### Problem 4: "Out of disk space"

**Solution:**
```bash
# Clean old Docker images
docker system prune -a -f

# Remove old logs
docker-compose down && rm -rf /var/lib/docker/containers/*/
docker-compose up -d
```

### Problem 5: "Image upload not working"

**Solution:**
```bash
# Fix permissions
cd /root/Pinpost
chmod -R 777 backend/uploads
docker-compose restart
```

---

## 📊 Your Pinpost URLs

After deployment, you'll have:

- **Website**: `http://YOUR_VPS_IP` or `https://yourdomain.com`
- **API**: `http://YOUR_VPS_IP:8000` or `https://yourdomain.com/api`
- **API Docs**: `http://YOUR_VPS_IP:8000/docs`

---

## 💰 Cost Breakdown

| Service | Provider | Cost |
|---------|----------|------|
| **VPS Hosting** | Hostinger | $5.99/month |
| **Database** | MongoDB Atlas | FREE (Forever!) |
| **Domain** | Hostinger/Namecheap | $10/year (optional) |
| **SSL Certificate** | Let's Encrypt | FREE |
| **Total** | | **$5.99/month** |

---

## 🎨 Customization Ideas

### Change App Colors
Edit `frontend/src/index.css` - look for color values

### Change App Name
Edit `frontend/public/index.html` - change `<title>` tag

### Add Your Logo
Replace `frontend/public/favicon.ico` with your logo

### Change Fonts
Edit `frontend/src/index.css` - change `font-family` values

---

## 🔄 Maintenance Schedule

### Daily (Automatic)
✅ MongoDB Atlas automatic backups
✅ Docker container health checks

### Weekly (5 minutes)
```bash
# Check if everything is running
cd /root/Pinpost && docker-compose ps

# Backup uploads
tar -czf weekly-backup-$(date +%Y%m%d).tar.gz backend/uploads
```

### Monthly (10 minutes)
```bash
# Update system
apt update && apt upgrade -y

# Clean Docker
docker system prune -f

# Check disk space
df -h
```

### When Needed
```bash
# Update Pinpost to latest version
cd /root/Pinpost && git pull && docker-compose up -d --build
```

---

## 📞 Quick Reference Card

**Print this and keep it handy!**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PINPOST QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 PROJECT LOCATION
cd /root/Pinpost

🚀 START
docker-compose up -d

🛑 STOP
docker-compose down

🔄 RESTART
docker-compose restart

📊 STATUS
docker-compose ps

📝 VIEW LOGS
docker-compose logs -f

⬆️ UPDATE APP
git pull && docker-compose up -d --build

💾 BACKUP
tar -czf backup.tar.gz backend/uploads .env

🔧 EDIT CONFIG
nano .env
(Ctrl+X, Y, Enter to save)

🌐 YOUR WEBSITE
http://YOUR_VPS_IP

🔐 SSH LOGIN
ssh root@YOUR_VPS_IP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎓 Video Tutorial (Recommended!)

*Creating a screen recording would be helpful here!*

1. **Part 1**: MongoDB Setup (5 min)
2. **Part 2**: Hostinger VPS Setup (10 min)
3. **Part 3**: Deploy Pinpost (5 min)
4. **Part 4**: Add Domain & SSL (10 min)

---

## ✅ Success Checklist

Before you finish, make sure:

- [ ] MongoDB Atlas database is created
- [ ] You saved your MongoDB password
- [ ] Hostinger VPS is running
- [ ] You can access Hostinger Browser Terminal
- [ ] Pinpost is cloned to `/root/Pinpost`
- [ ] `.env` file is created with correct MongoDB URL
- [ ] Secret key is generated
- [ ] Containers are running (`docker-compose ps` shows "Up")
- [ ] You can access the website in your browser
- [ ] You can register a new account
- [ ] You can create a post
- [ ] Images upload successfully

---

## 🎉 You Did It!

Congratulations! Your Pinpost social media platform is now live! 

**What's Next?**

1. ✅ Register your first account
2. ✅ Create your first post
3. ✅ Write your first blog
4. ✅ Customize the colors and branding
5. ✅ Share with friends!

---

## 💡 Pro Tips for Vibe Coders

### Tip 1: Save These Commands
Create a file on your desktop with all the commands you use often!

### Tip 2: Use Browser Terminal
Hostinger's browser terminal is easier than SSH - no extra software needed!

### Tip 3: Take Screenshots
When you change settings, take screenshots so you remember what you did!

### Tip 4: Join Communities
- MongoDB Community Forum
- Hostinger Help Center
- Stack Overflow (for questions)

### Tip 5: Start Small
Don't try to customize everything at once. Make one change, test it, then move to the next!

---

## 🆘 Emergency Contacts

### When Something Goes Wrong:

1. **Hostinger Support**
   - 24/7 Live Chat
   - [Submit Ticket](https://www.hostinger.com/support)

2. **MongoDB Support**
   - [Community Forum](https://www.mongodb.com/community/forums/)
   - [Documentation](https://docs.mongodb.com/)

3. **Pinpost Issues**
   - Check logs: `docker-compose logs -f`
   - Search Google with the exact error message
   - Ask on Stack Overflow

---

## 🎁 Bonus: One-Command Reinstall

If everything breaks and you want to start fresh:

```bash
cd /root && rm -rf Pinpost && git clone https://github.com/mamunnet/Pinpost.git && cd Pinpost && echo "✅ Fresh start ready! Now follow the deployment steps again."
```

**This deletes everything and starts over - use only if needed!**

---

## 📚 Learning Resources

Want to understand what's happening? Check these out:

- **Docker Basics**: [Docker 101](https://www.docker.com/101-tutorial)
- **Linux Commands**: [Linux Journey](https://linuxjourney.com/)
- **MongoDB**: [MongoDB University (FREE)](https://university.mongodb.com/)

But remember: **You don't need to learn everything to deploy!** Just follow the steps! 🎯

---

**Made with ❤️ for Vibe Coders**

*You got this! 💪*
