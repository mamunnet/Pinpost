/**
 * Utility functions for handling image URLs consistently across the application
 * Supports both Cloudinary CDN and local/nginx proxied uploads
 */

// Get BACKEND_URL - empty in production, localhost in development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Check if URL is from Cloudinary CDN
 */
const isCloudinaryUrl = (url) => {
  return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
};

/**
 * Get optimized Cloudinary URL with transformations
 * @param {string} url - Cloudinary URL
 * @param {number} width - Desired width
 * @param {string} quality - Quality setting (auto:good, auto:best, auto:eco)
 */
const getOptimizedCloudinaryUrl = (url, width = null, quality = 'auto:good') => {
  if (!isCloudinaryUrl(url)) return url;
  
  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  transformations.push(`q_${quality}`);
  transformations.push('f_auto'); // Auto format (WebP when supported)
  
  const transformStr = transformations.join(',');
  
  // Insert transformation into URL
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    return `${parts[0]}/upload/${transformStr}/${parts[1]}`;
  }
  
  return url;
};

/**
 * Ensures an image URL is properly formatted for display
 * In production, BACKEND_URL is empty and nginx proxies /uploads to backend
 * In development, BACKEND_URL is http://localhost:8000
 * @param {string} imageUrl - The image URL from the database or API
 * @returns {string} - Properly formatted image URL
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // If it's a Cloudinary URL, return it as-is (already optimized)
  if (isCloudinaryUrl(imageUrl)) {
    return imageUrl;
  }
  
  // If the URL already includes http/https, handle it
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // If it's pointing to localhost in production, convert to relative path
    if (!BACKEND_URL && imageUrl.includes('localhost')) {
      if (imageUrl.includes('/uploads/')) {
        const fileName = imageUrl.split('/uploads/')[1];
        return `/uploads/${fileName}`;
      }
    }
    
    // Check if it's pointing to the current backend
    if (BACKEND_URL && imageUrl.startsWith(BACKEND_URL)) {
      return imageUrl;
    }
    
    // If it's pointing to a different backend URL, extract filename
    if (imageUrl.includes('/uploads/')) {
      const fileName = imageUrl.split('/uploads/')[1];
      // In production (empty BACKEND_URL), use relative path for nginx proxy
      return BACKEND_URL ? `${BACKEND_URL}/uploads/${fileName}` : `/uploads/${fileName}`;
    }
    
    return imageUrl;
  }
  
  // If it's a relative path starting with /uploads/, handle based on environment
  if (imageUrl.startsWith('/uploads/')) {
    // In production (empty BACKEND_URL), return as-is for nginx proxy
    // In development, prepend BACKEND_URL  
    return BACKEND_URL ? `${BACKEND_URL}${imageUrl}` : imageUrl;
  }
  
  // If it's just a filename, assume it's in uploads directory
  if (!imageUrl.includes('/')) {
    return BACKEND_URL ? `${BACKEND_URL}/uploads/${imageUrl}` : `/uploads/${imageUrl}`;
  }
  
  // Default: prepend backend URL if exists, otherwise use relative path
  return BACKEND_URL ? `${BACKEND_URL}${imageUrl}` : imageUrl;
};

/**
 * Get optimized image URL for different screen sizes
 * Works with both Cloudinary and local images
 * @param {string} imageUrl - Original image URL
 * @param {number} width - Desired width for responsive images
 * @returns {string} - Optimized image URL
 */
export const getResponsiveImageUrl = (imageUrl, width) => {
  if (!imageUrl) return '';
  
  const processedUrl = getImageUrl(imageUrl);
  
  // If it's Cloudinary, add transformation
  if (isCloudinaryUrl(processedUrl)) {
    return getOptimizedCloudinaryUrl(processedUrl, width, 'auto:good');
  }
  
  // For local images, return as-is (nginx handles it)
  return processedUrl;
};

/**
 * Get thumbnail version of image
 * @param {string} imageUrl - Original image URL
 * @param {number} size - Thumbnail size (default 200x200)
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (imageUrl, size = 200) => {
  if (!imageUrl) return '';
  
  const processedUrl = getImageUrl(imageUrl);
  
  // If it's Cloudinary, get optimized thumbnail
  if (isCloudinaryUrl(processedUrl)) {
    return getOptimizedCloudinaryUrl(processedUrl, size, 'auto:eco');
  }
  
  // For local images, return as-is
  return processedUrl;
};

/**
 * Gets the proper URL for user avatars
 * @param {object} user - User object with avatar property
 * @returns {string} - Properly formatted avatar URL or empty string
 */
export const getUserAvatarUrl = (user) => {
  if (!user || !user.avatar) return '';
  return getImageUrl(user.avatar);
};

/**
 * Gets the proper URL for user cover photos
 * @param {object} user - User object with cover_photo property
 * @returns {string} - Properly formatted cover photo URL or empty string
 */
export const getUserCoverPhotoUrl = (user) => {
  if (!user || !user.cover_photo) return '';
  return getImageUrl(user.cover_photo);
};

/**
 * Gets the proper URL for post author avatars
 * @param {object} post - Post object with author_avatar property
 * @returns {string} - Properly formatted avatar URL or empty string
 */
export const getPostAuthorAvatarUrl = (post) => {
  if (!post) return '';
  
  // Try different possible property names for author avatar
  const avatarUrl = post.author_avatar || post.authorAvatar || post.author?.avatar || '';
  
  if (!avatarUrl) return '';
  return getImageUrl(avatarUrl);
};