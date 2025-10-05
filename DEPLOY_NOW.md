# 🚀 Deploy to Hostinger - Your Settings

## Your Information (Configured!)
- **MongoDB:** mongodb+srv://pinpostmaria:***@pinpost.4ccvhj6.mongodb.net/
- **Database:** penlink_database
- **Domain:** bartaaddaa.com
- **Server IP:** 72.60.203.48

---

## Step 1: Push to GitHub (5 minutes)

```powershell
# In your Pinpost folder
cd C:\Users\mamun\Desktop\Pinpost

# Add all files
git add .

# Commit
git commit -m "Ready for Hostinger deployment"

# Push to GitHub
git push origin main
```

---

## Step 2: Deploy in Hostinger (2 minutes)

### In Hostinger Docker Manager (where you are now):

1. **URL field:** Paste this:
   ```
   https://github.com/mamunnet/Pinpost
   ```

2. **Project name:** `pinpost`

3. Click **Deploy**

4. Wait 10 minutes for build to complete

---

## Step 3: Configure Domain (5 minutes)

### In Hostinger:

1. Go to **Domains** → **bartaaddaa.com**

2. Click **DNS / Name Servers**

3. **Add A Record:**
   - Type: `A`
   - Name: `@`
   - Points to: `72.60.203.48`
   - TTL: `14400`

4. **Add Another A Record:**
   - Type: `A`
   - Name: `www`
   - Points to: `72.60.203.48`
   - TTL: `14400`

5. **Save**

6. **Wait:** 10-30 minutes for DNS propagation

---

## Step 4: Access Your Site! 🎉

After deployment completes:

- **Your Website:** http://bartaaddaa.com
- **Or Direct IP:** http://72.60.203.48
- **API:** http://bartaaddaa.com:8000
- **API Docs:** http://bartaaddaa.com:8000/docs

---

## Important Notes:

✅ `.env` file is configured with your settings
✅ MongoDB connection ready
✅ Domain configured for bartaaddaa.com
✅ CORS allows your domain

---

## Troubleshooting:

**Can't access site?**
```bash
# Check container status in Hostinger terminal
docker ps
```

**Domain not working?**
- Wait 30 minutes for DNS
- Use IP address: http://72.60.203.48

**Need logs?**
```bash
# In Hostinger terminal
docker logs -f pinpost-backend
docker logs -f pinpost-frontend
```

---

That's it! Deploy now! 🚀
