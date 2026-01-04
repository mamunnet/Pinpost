# Pinpost Backend Environment Variables
# Copy this file to .env and update values

# ===========================================
# DATABASE
# ===========================================
MONGO_URL=mongodb://localhost:27017/
DB_NAME=pinpost_db

# ===========================================
# SECURITY
# ===========================================
SECRET_KEY=your-super-secret-key-min-32-chars

# ===========================================
# ADMIN CREDENTIALS (Required for admin user)
# ===========================================
ADMIN_EMAIL=admin@pinpost.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!

# ===========================================
# FRONTEND & CORS
# ===========================================
FRONTEND_URL=http://localhost:3000

# ===========================================
# ENVIRONMENT
# ===========================================
ENVIRONMENT=development

# ===========================================
# FILE UPLOADS
# ===========================================
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# ===========================================
# CLOUDINARY (Required for image uploads)
# ===========================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
