/**
 * Cache Management Utility
 * Helps clear image cache and ensure fresh content loads on mobile devices
 */

/**
 * Clear browser cache for images
 * Call this function to force reload images from server
 */
export const clearImageCache = async () => {
  try {
    // Clear Cache API if available (Service Workers)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Image cache cleared');
    }
    
    // Clear session storage
    sessionStorage.clear();
    
    // Force reload the page to get fresh content
    window.location.reload(true);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};

/**
 * Add cache-busting parameter to image URLs for mobile
 * This helps ensure mobile devices load fresh images
 */
export const addCacheBuster = (url) => {
  if (!url) return url;
  
  // Don't add cache buster to external URLs
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    return url;
  }
  
  // Add timestamp as cache buster
  const separator = url.includes('?') ? '&' : '?';
  const cacheBuster = `v=${Date.now()}`;
  
  return `${url}${separator}${cacheBuster}`;
};

/**
 * Preload image to check if it's accessible
 * Returns a promise that resolves when image loads or rejects on error
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Check if user is on mobile device
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Force reload images on mobile devices
 * Call this on page load to ensure images load correctly
 */
export const forceReloadImagesOnMobile = () => {
  if (isMobileDevice()) {
    // Get all img elements
    const images = document.querySelectorAll('img[src*="/uploads/"]');
    
    images.forEach(img => {
      const originalSrc = img.src;
      // Remove cache buster if exists
      const cleanSrc = originalSrc.split('?')[0];
      // Add new cache buster
      img.src = addCacheBuster(cleanSrc);
    });
    
    console.log(`🔄 Reloaded ${images.length} images for mobile device`);
  }
};
