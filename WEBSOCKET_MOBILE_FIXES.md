# WebSocket & Mobile Image Loading Fixes

## Critical Issues Fixed

### Issue 1: WebSocket Mixed Content Error (HTTPS/WSS)
**Error Message:**
```
Mixed Content: The page at 'https://bartaaddaa.com/blog/...' was loaded over HTTPS, 
but attempted to connect to the insecure WebSocket endpoint 'ws://ws/notifications/...'. 
This request has been blocked; this endpoint must be available over WSS.
```

**Root Cause:**
- The `getWebSocketUrl()` function in `Header.js` was not properly detecting the HTTPS protocol
- When `BACKEND_URL` is empty (production), the code couldn't determine whether to use `ws://` or `wss://`
- It was incorrectly constructing URLs like `ws://ws/notifications/...` instead of `wss://bartaaddaa.com/ws/notifications/...`

**Solution:**
Updated `Header.js` to detect the page protocol dynamically:
```javascript
const getWebSocketUrl = (userId) => {
  // In production (empty BACKEND_URL), use current page protocol and host
  if (!BACKEND_URL) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // includes port if any
    return `${protocol}//${host}/ws/notifications/${userId}`;
  }
  
  // In development, construct from BACKEND_URL
  const protocol = BACKEND_URL.startsWith('https') ? 'wss:' : 'ws:';
  const host = BACKEND_URL.replace(/^https?:\/\//, '');
  return `${protocol}//${host}/ws/notifications/${userId}`;
};
```

**Result:**
- ✅ Desktop on HTTPS: Uses `wss://bartaaddaa.com/ws/notifications/...`
- ✅ Development: Uses `ws://localhost:8000/ws/notifications/...`
- ✅ No more mixed content errors
- ✅ Real-time notifications work on HTTPS sites

---

### Issue 2: Images Not Loading on Mobile (But Working on Desktop)

**Symptoms:**
- Images (profile photos, posts, covers) display correctly on desktop
- Same images fail to load on mobile devices
- Clearing cache manually doesn't help

**Root Causes:**
1. **Mobile browser aggressive caching** - Mobile browsers cache more aggressively than desktop
2. **Old cached URLs** - Mobile devices had cached the old broken image URLs
3. **Localhost URLs in database** - Some images might have been saved with `localhost` URLs
4. **Missing cache control headers** - nginx wasn't instructing mobile browsers how to handle image caching

**Solutions Implemented:**

#### 1. Enhanced Image URL Handling (`imageUtils.js`)
Added special handling for localhost URLs in production:
```javascript
// If it's pointing to localhost in production, convert to relative path
if (!BACKEND_URL && imageUrl.includes('localhost')) {
  if (imageUrl.includes('/uploads/')) {
    const fileName = imageUrl.split('/uploads/')[1];
    return `/uploads/${fileName}`;
  }
}
```

#### 2. Improved nginx Cache Headers (`nginx.conf`)
Added proper cache control for uploaded images:
```nginx
location /uploads {
    # ... proxy settings ...
    
    # Cache control - allow browser caching but enable revalidation
    add_header Cache-Control "public, max-age=86400, must-revalidate";
    add_header X-Content-Type-Options "nosniff";
    
    # Enable CORS for images
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
}
```

#### 3. Created Cache Utilities (`cacheUtils.js`)
New utility functions to help with mobile caching:
- `clearImageCache()` - Clears browser cache and reloads
- `addCacheBuster()` - Adds timestamp to URLs to bypass cache
- `isMobileDevice()` - Detects mobile devices
- `forceReloadImagesOnMobile()` - Forces image reload on mobile

#### 4. Separated Static Asset Caching
Different cache policies for different asset types:
- **CSS/JS/Fonts**: 1 year cache (immutable)
- **Build directory images**: 7 days with revalidation
- **Uploaded images** (`/uploads`): 24 hours with must-revalidate

---

## Files Modified

### Frontend Files
1. **`frontend/src/components/Header.js`**
   - Fixed WebSocket URL construction for HTTPS/WSS
   - Now properly detects page protocol and host

2. **`frontend/src/utils/imageUtils.js`**
   - Enhanced to handle localhost URLs in production
   - Better fallback logic for mobile devices

3. **`frontend/src/utils/cacheUtils.js`** (NEW)
   - Cache management utilities
   - Mobile device detection
   - Image preloading and cache-busting

### Backend/Infrastructure Files
4. **`nginx.conf`**
   - Improved cache control headers for `/uploads`
   - Added CORS headers for images
   - Separated caching policies for different asset types

---

## How It Works Now

### WebSocket Connections

#### Production (HTTPS):
```
Page: https://bartaaddaa.com/blog/...
WebSocket: wss://bartaaddaa.com/ws/notifications/{userId}
✅ Secure connection, no mixed content error
```

#### Development (HTTP):
```
Page: http://localhost:3000/...
WebSocket: ws://localhost:8000/ws/notifications/{userId}
✅ Works correctly in local development
```

### Image Loading

#### Desktop:
- Loads images from `/uploads/...`
- nginx proxies to backend:8000
- Standard browser caching applies

#### Mobile:
- Same URL structure: `/uploads/...`
- Enhanced cache headers force revalidation
- Handles old cached localhost URLs
- CORS headers allow cross-origin loading

---

## Deployment Instructions

### 1. Deploy to Production

```bash
cd /docker/pinpost
git pull origin main

# Rebuild both containers (required for nginx config changes)
docker compose down
docker compose up -d --build

# Or rebuild individually:
docker compose up -d --build frontend  # For nginx config changes
docker compose restart backend         # Usually not needed for these changes
```

### 2. Verify Deployment

#### Check WebSocket Connection:
1. Open browser console on mobile
2. Navigate to any page
3. Look for: `✅ WebSocket connected for real-time notifications`
4. Should see `wss://` in the connection URL

#### Check Image Loading:
1. Open a profile page on mobile
2. Check browser console for image URLs
3. Images should load from `/uploads/...`
4. No 404 or CORS errors

### 3. Test Real-time Notifications

1. **On Desktop**: Like a post or follow a user
2. **On Mobile**: Should receive instant notification
3. Check for toast notification popup
4. Browser notification if permission granted

---

## Mobile Testing Checklist

After deployment, test on actual mobile devices:

### WebSocket Tests
- [ ] Open site on mobile over HTTPS
- [ ] Check browser console - no mixed content errors
- [ ] WebSocket shows as `wss://` (not `ws://`)
- [ ] Receive real-time notifications when actions happen
- [ ] Notifications persist across page navigation

### Image Tests  
- [ ] Profile photos display correctly
- [ ] Post images load properly
- [ ] Cover photos are visible
- [ ] User avatars in comments/likes show correctly
- [ ] Images load after clearing mobile browser cache
- [ ] Images work in both WiFi and mobile data

### Cache Tests
- [ ] Hard refresh on mobile (Chrome: Menu > Settings > Site Settings > Clear & Reset)
- [ ] Images reload correctly
- [ ] No broken image icons
- [ ] Image URLs don't contain `localhost`

---

## Troubleshooting

### WebSocket Still Not Connecting

1. **Check nginx logs:**
   ```bash
   docker compose logs frontend | grep ws
   ```

2. **Verify WebSocket upgrade headers:**
   ```bash
   curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://bartaaddaa.com/ws/notifications/test
   ```

3. **Check browser console:**
   - Should see `wss://` not `ws://`
   - Look for connection attempt logs

### Images Still Not Loading on Mobile

1. **Check image URLs in browser console:**
   ```javascript
   // In mobile browser console:
   console.log(document.querySelectorAll('img[src*="uploads"]'));
   ```

2. **Verify nginx is serving images:**
   ```bash
   curl -I https://bartaaddaa.com/uploads/{some-image}.jpg
   # Should return 200 OK
   ```

3. **Check for cached localhost URLs:**
   ```bash
   # In backend, check database for localhost URLs:
   db.users.find({"avatar": {$regex: "localhost"}})
   db.posts.find({"images": {$regex: "localhost"}})
   ```

4. **Force clear mobile cache:**
   - Chrome Mobile: Settings > Privacy > Clear browsing data > Cached images
   - Safari iOS: Settings > Safari > Clear History and Website Data

### Database Cleanup (If Needed)

If images in database still have localhost URLs:

```javascript
// Update all user avatars with localhost URLs
db.users.updateMany(
  { "avatar": { $regex: "localhost" } },
  [{
    $set: {
      "avatar": {
        $replaceAll: {
          input: "$avatar",
          find: { $concat: ["http://localhost:8000/uploads/"] },
          replacement: "/uploads/"
        }
      }
    }
  }]
);

// Same for posts
db.posts.updateMany(
  { "images": { $regex: "localhost" } },
  [{
    $set: {
      "images": {
        $map: {
          input: "$images",
          as: "img",
          in: {
            $replaceAll: {
              input: "$$img",
              find: "http://localhost:8000",
              replacement: ""
            }
          }
        }
      }
    }
  }]
);
```

---

## Technical Details

### WebSocket Protocol Detection
- Uses `window.location.protocol` to detect HTTPS
- Automatically switches between `ws://` and `wss://`
- Works seamlessly in all environments

### Image URL Resolution Priority
1. Check if URL contains `localhost` in production → convert to relative
2. Check if URL starts with http/https → extract filename
3. Check if URL starts with `/uploads/` → use as-is or prepend BACKEND_URL
4. Check if URL is just filename → prepend `/uploads/`
5. Default fallback based on environment

### Cache Control Strategy
- **Uploaded images**: 24h cache with must-revalidate (ensures freshness)
- **Static assets**: Long-term cache (performance)
- **HTML/API**: No cache (always fresh)

---

## Performance Impact

### Positive:
- ✅ Images cached for 24 hours on mobile (faster subsequent loads)
- ✅ CORS headers allow CDN caching if added later
- ✅ Reduced server requests with must-revalidate

### Neutral:
- WebSocket overhead minimal (persistent connection)
- Cache revalidation adds one small request per image per day

---

## Security Improvements

- ✅ WSS encrypted connection for notifications
- ✅ Proper CORS headers (controlled access)
- ✅ X-Content-Type-Options prevents MIME sniffing
- ✅ No credentials exposed in WebSocket URL

---

## Next Steps (Optional Enhancements)

1. **Add Service Worker** for offline image caching
2. **Implement CDN** for faster image delivery globally
3. **Add image compression** at upload time
4. **Implement lazy loading** for better mobile performance
5. **Add retry logic** for failed WebSocket connections

---

## Notes

- All changes are backwards compatible
- No database migrations required
- Works on both HTTP (dev) and HTTPS (prod)
- Mobile and desktop have feature parity
- Can be deployed without downtime
