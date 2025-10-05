# 🔧 Pinpost Troubleshooting Flowchart

## When Things Don't Work - Follow This! 🛠️

---

## 🚨 Problem: Can't Access Website

```
Can you visit http://YOUR_IP ?
       │
       ├─ NO ──► Is VPS running?
       │         │
       │         ├─ YES ──► Are containers running?
       │         │         │
       │         │         ├─ NO ──► Run: docker-compose up -d
       │         │         │         └─► Wait 2 min → Try again
       │         │         │
       │         │         └─ YES ──► Check firewall
       │         │                   └─► Run: ufw allow 80
       │         │                       Run: ufw allow 443
       │         │
       │         └─ NO ──► Login to Hostinger hPanel
       │                   Click VPS → Click Start
       │                   Wait 5 min → Try again
       │
       └─ YES ──► ✅ IT WORKS!
```

---

## 🚨 Problem: MongoDB Connection Error

```
Error says "MongoDB connection failed"
       │
       ├─► Check .env file
       │   Run: cat /root/Pinpost/.env
       │   │
       │   ├─► Is MONGO_URL correct?
       │   │   │
       │   │   ├─ NO ──► Edit it
       │   │   │         Run: nano .env
       │   │   │         Fix MONGO_URL
       │   │   │         Ctrl+X, Y, Enter
       │   │   │         Run: docker-compose restart
       │   │   │
       │   │   └─ YES ──► Is password correct?
       │   │             │
       │   │             ├─ NO ──► Get new password from MongoDB Atlas
       │   │             │         Update .env
       │   │             │         docker-compose restart
       │   │             │
       │   │             └─ YES ──► Check MongoDB Atlas
       │   │                       │
       │   │                       ├─► Network Access
       │   │                       │   Is 0.0.0.0/0 allowed?
       │   │                       │   
       │   │                       └─► Database Access
       │   │                           Is user active?
       │
       └─► Still error? ──► Create new MongoDB cluster
                           Start fresh
```

---

## 🚨 Problem: Containers Keep Restarting

```
Run: docker-compose ps
Shows "Restarting" status?
       │
       └─► Check logs
           Run: docker-compose logs backend
           │
           ├─► Says "MongoDB error"
           │   └─► See MongoDB flowchart above ⬆️
           │
           ├─► Says "Port already in use"
           │   └─► Another app using port 8000?
           │       Run: lsof -i :8000
           │       Kill that process
           │       Run: docker-compose restart
           │
           ├─► Says "Out of memory"
           │   └─► Upgrade VPS
           │       Or reduce containers
           │
           └─► Other error?
               └─► Copy exact error
                   Google it
                   Or ask ChatGPT
```

---

## 🚨 Problem: Images Won't Upload

```
Uploading image fails?
       │
       ├─► Check uploads folder
       │   Run: ls -la /root/Pinpost/backend/uploads
       │   │
       │   ├─► Folder doesn't exist?
       │   │   Run: mkdir -p /root/Pinpost/backend/uploads
       │   │   Run: chmod 777 /root/Pinpost/backend/uploads
       │   │   Run: docker-compose restart
       │   │
       │   └─► Folder exists but permission denied?
       │       Run: chmod -R 777 /root/Pinpost/backend/uploads
       │       Run: docker-compose restart
       │
       ├─► File too large?
       │   └─► Check .env
       │       MAX_FILE_SIZE=10485760 (10MB)
       │       Make it bigger if needed
       │       docker-compose restart
       │
       └─► Still failing?
           └─► Check browser console (F12)
               Look for errors
               Usually shows exact problem
```

---

## 🚨 Problem: Slow Performance

```
Website is slow?
       │
       ├─► Check server resources
       │   Run: free -h
       │   Run: df -h
       │   │
       │   ├─► Low memory?
       │   │   └─► Clean Docker
       │   │       Run: docker system prune -f
       │   │       Or upgrade VPS
       │   │
       │   └─► Low disk space?
       │       └─► Clean old files
       │           Run: docker system prune -a -f
       │           Delete old backups
       │
       ├─► Too many users?
       │   └─► Upgrade VPS plan
       │       Or add Redis cache
       │
       └─► Database slow?
           └─► Check MongoDB Atlas
               Monitor tab shows usage
               Upgrade if needed
```

---

## 🚨 Problem: "Permission Denied" Errors

```
Getting permission errors?
       │
       ├─► Not running as root?
       │   └─► Login as root
       │       Run: sudo su
       │       Try command again
       │
       ├─► File permissions wrong?
       │   └─► Fix permissions
       │       Run: chmod -R 755 /root/Pinpost
       │       Run: chmod -R 777 /root/Pinpost/backend/uploads
       │
       └─► Docker permission?
           └─► Add user to docker group
               Run: usermod -aG docker $USER
               Logout and login again
```

---

## 🚨 Problem: SSL/HTTPS Not Working

```
HTTPS shows error?
       │
       ├─► Certificate expired?
       │   └─► Renew it
       │       Run: certbot renew
       │       Run: docker-compose restart
       │
       ├─► Domain not pointing to server?
       │   └─► Check DNS
       │       Use: https://dnschecker.org
       │       Wait 24 hours for propagation
       │
       └─► Certificate not installed?
           └─► Install Let's Encrypt
               See HOSTINGER_DEPLOYMENT.md
               SSL Setup section
```

---

## 🚨 Problem: Updates Not Showing

```
Made changes but not visible?
       │
       ├─► Did you rebuild?
       │   Run: docker-compose down
       │   Run: docker-compose up -d --build
       │   Wait 5 minutes
       │   Clear browser cache (Ctrl+Shift+R)
       │
       ├─► Changed .env file?
       │   Run: docker-compose restart
       │   Changes need restart
       │
       └─► Still not showing?
           └─► Hard reset
               Run: docker-compose down
               Run: docker system prune -a -f
               Run: docker-compose up -d --build
```

---

## 🚨 Problem: Can't Login to VPS

```
SSH/Terminal not working?
       │
       ├─► Using Hostinger Browser Terminal?
       │   └─► Use this! It's easiest
       │       hPanel → VPS → Browser Terminal
       │       Username: root
       │       Password: your VPS password
       │
       ├─► Forgot password?
       │   └─► Reset in Hostinger hPanel
       │       VPS → Settings → Change Password
       │       Wait 5 min
       │       Try again
       │
       └─► VPS not responding?
           └─► Reboot VPS
               hPanel → VPS → Reboot
               Wait 10 min
```

---

## 🆘 Emergency Recovery Steps

### Level 1: Restart Everything
```bash
cd /root/Pinpost
docker-compose restart
```
**Fixes: 60% of problems** ✅

### Level 2: Rebuild
```bash
cd /root/Pinpost
docker-compose down
docker-compose up -d --build
```
**Fixes: 80% of problems** ✅

### Level 3: Clean & Rebuild
```bash
cd /root/Pinpost
docker-compose down
docker system prune -a -f
docker-compose up -d --build
```
**Fixes: 90% of problems** ✅

### Level 4: Fresh Start
```bash
cd /root
cp Pinpost/.env ~/backup.env
rm -rf Pinpost
git clone https://github.com/mamunnet/Pinpost.git
cd Pinpost
cp ~/backup.env .env
docker-compose up -d --build
```
**Fixes: 99% of problems** ✅

### Level 5: Nuclear Option
```bash
# ⚠️ THIS DELETES EVERYTHING!
# Only if NOTHING else works!

cd /root
rm -rf Pinpost
git clone https://github.com/mamunnet/Pinpost.git
cd Pinpost
bash easy-deploy.sh
# Re-enter MongoDB URL
```
**Fixes: 100% of problems** ✅ (but loses data!)

---

## 📞 When to Ask for Help

### Ask for help if:
- ❌ Tried all recovery steps
- ❌ Error message is unclear
- ❌ Problem persists > 1 hour
- ❌ Data loss occurred
- ❌ Security breach suspected

### Where to ask:
1. **Hostinger Support** (for VPS issues)
   - 24/7 Live chat
   - Very helpful!

2. **MongoDB Support** (for database issues)
   - Community forum
   - Response in 1-2 hours

3. **Stack Overflow** (for technical issues)
   - Search first
   - Then ask with details

4. **GitHub Issues** (for Pinpost bugs)
   - https://github.com/mamunnet/Pinpost/issues
   - Include error logs

---

## 🔍 How to Get Good Error Messages

### Backend Errors:
```bash
cd /root/Pinpost
docker-compose logs backend --tail=100
```

### Frontend Errors:
```bash
cd /root/Pinpost
docker-compose logs frontend --tail=100
```

### Browser Errors:
1. Press F12
2. Click "Console" tab
3. Look for red errors
4. Screenshot them

### System Errors:
```bash
# Memory
free -h

# Disk
df -h

# Processes
top

# Docker
docker stats
```

---

## ✅ Preventive Maintenance

### Do this weekly (5 minutes):
```bash
# Check status
cd /root/Pinpost && docker-compose ps

# Check logs for errors
docker-compose logs --tail=100

# Check disk space
df -h

# Backup
tar -czf backup-$(date +%Y%m%d).tar.gz backend/uploads .env
```

### Do this monthly (10 minutes):
```bash
# Update system
apt update && apt upgrade -y

# Clean Docker
docker system prune -f

# Check MongoDB Atlas
# Visit cloud.mongodb.com
# Check storage usage

# Test backups
# Try restoring to test server
```

---

## 🎯 Quick Decision Tree

```
Is the problem URGENT?
    │
    ├─ YES (site is down!)
    │   └─► Try Recovery Level 1-3
    │       If still down after Level 3:
    │       Contact Hostinger Support
    │       They respond in 5-10 min
    │
    └─ NO (minor issue)
        └─► Try to understand it
            Search Google
            Ask ChatGPT
            Try solutions
            Learn from it! 🎓
```

---

## 💡 Common Mistakes to Avoid

### ❌ Don't do this:
1. Run commands without understanding
2. Delete .env file (has your settings!)
3. Share SECRET_KEY publicly
4. Stop backups (you'll regret it)
5. Ignore errors (they compound)
6. Panic (it's almost always fixable!)

### ✅ Do this instead:
1. Read error messages carefully
2. Keep .env file safe
3. Never share secrets
4. Backup weekly
5. Fix errors quickly
6. Stay calm, debug methodically

---

## 🎓 Learning from Errors

### Every error is a lesson!

```
Error happened
    ↓
What was the error?
    ↓
What caused it?
    ↓
How did you fix it?
    ↓
Document it!
    ↓
Won't happen again! 🎉
```

Keep a "solutions.txt" file:
```
Date: 2025-10-05
Error: MongoDB connection failed
Cause: Wrong password in .env
Solution: Updated password, restarted
Time to fix: 10 minutes
```

---

## 🚀 You Got This!

Remember:
- **99% of errors are fixable** ✅
- **Google is your friend** 🔍
- **Hostinger support is great** 💬
- **MongoDB has good docs** 📚
- **Every expert was once stuck too** 💪

**Keep calm and debug on!** 🛠️

---

**Made with ❤️ for troubleshooters everywhere**
