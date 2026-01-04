/**
 * Utility functions for handling image URLs consistently across the application
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/**
 * Ensures an image URL is properly formatted for display
 * @param {string} imageUrl - The image URL from the database or API
 * @returns {string} - Properly formatted image URL
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  
  // If it's a base64 data URI, return as-is (highest priority)
  if (imageUrl.startsWith('data:image/')) {
    return imageUrl;
  }
  
  // If it's a Cloudinary URL, return as-is
  if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com')) {
    return imageUrl;
  }
  
  // If the URL already includes http/https, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path starting with /uploads/, prepend backend URL
  if (imageUrl.startsWith('/uploads/')) {
    return `${BACKEND_URL}${imageUrl}`;
  }
  
  // If it's just a filename, assume it's in uploads directory
  if (!imageUrl.includes('/')) {
    return `${BACKEND_URL}/uploads/${imageUrl}`;
  }
  
  // Default: prepend backend URL
  return `${BACKEND_URL}${imageUrl}`;
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