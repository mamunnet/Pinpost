# 📌 Pinpost# 📌 Pinpost - Social Media & Blogging Platform



A modern social media platform with blogs, posts, stories, and real-time notifications.A modern, full-stack social media and blogging platform built with React, FastAPI, and MongoDB. Share posts, write blogs, follow users, and engage with real-time notifications.



## 🚀 Tech Stack![Pinpost Banner](https://via.placeholder.com/1200x300/4F46E5/ffffff?text=Pinpost+-+Share+Your+Story)



- **Frontend:** React 19, Tailwind CSS, shadcn/ui## ✨ Features

- **Backend:** FastAPI, MongoDB Atlas

- **Deployment:** Docker, Nginx### 🎯 Core Features

- **User Authentication** - Secure JWT-based authentication with bcrypt password hashing

## 🛠️ Setup- **User Profiles** - Customizable profiles with avatars, cover photos, and bio

- **Social Feed** - Share posts with text, images, and locations

### Prerequisites- **Blog Platform** - Write and publish long-form articles with rich formatting

- Python 3.11+- **Real-time Notifications** - WebSocket-powered instant notifications

- Node.js 20+- **Comments & Likes** - Engage with posts and blogs

- MongoDB Atlas account- **Follow System** - Follow users and see their content

- **Stories** - Share temporary stories that expire after 24 hours

### Installation- **Search & Filters** - Find users, posts, and blogs easily

- **Responsive Design** - Beautiful UI that works on all devices

```bash

# Clone repository### 🔥 Advanced Features

git clone https://github.com/mamunnet/Pinpost.git- **Trending Users** - Discover popular creators

cd Pinpost- **Activity Stats** - Track your engagement

- **Who to Follow** - Smart user recommendations

# Backend setup- **Geolocation** - Share your location with posts

cd backend- **Image Uploads** - Share photos with your content

pip install -r requirements.txt- **Mobile Optimized** - Perfect typography and responsive layouts

cp .env.example .env- **Modern UI** - Built with shadcn/ui and Tailwind CSS

# Edit .env with your MongoDB URL

uvicorn server:app --reload --host 0.0.0.0 --port 8000## 🚀 Quick Start



# Frontend setup (in new terminal)> **🎯 For Non-Technical Users:** Want to deploy in 15 minutes? Check out our **[QUICK_START.md](QUICK_START.md)** guide made specifically for vibe coders!

cd frontend

npm install> **📚 Documentation Index:** Not sure where to start? See **[DOCS_INDEX.md](DOCS_INDEX.md)** for all guides!

npm start

```### Prerequisites

- Python 3.11+

### Environment Variables- Node.js 20+

- MongoDB Atlas account (free tier available)

Create `.env` in root directory:- Docker & Docker Compose (for production)



```env### Development Setup

MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

DB_NAME=your_database_name1. **Clone the repository**

SECRET_KEY=your-secret-key   ```bash

FRONTEND_URL=http://localhost:3000   git clone https://github.com/yourusername/Pinpost.git

ENVIRONMENT=development   cd Pinpost

```   ```



## 🐳 Docker Deployment2. **Backend Setup**

   ```bash

```bash   cd backend

docker-compose up -d --build   pip install -r requirements.txt

```   

   # Create .env file

Access:   cp .env.example .env

- Frontend: http://localhost   # Edit .env with your MongoDB connection string

- Backend API: http://localhost:8000   

- API Docs: http://localhost:8000/docs   # Run backend

   uvicorn server:app --reload --host 0.0.0.0 --port 8000

## 📝 License   ```



MIT License3. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   
   # Run frontend
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production Deployment

#### 🌟 SUPER EASY - For Non-Technical Users (Recommended!)

Deploy to **Hostinger VPS** with 1-click Docker in just 2 commands:

```bash
# 1. Download Pinpost
cd /root && git clone https://github.com/mamunnet/Pinpost.git && cd Pinpost

# 2. Run easy deploy script (it does EVERYTHING!)
bash easy-deploy.sh
```

The script will ask for your MongoDB URL and domain - that's it! ✨

📚 **Step-by-step guide for beginners**: [HOSTINGER_DEPLOYMENT.md](HOSTINGER_DEPLOYMENT.md)

#### 🔧 For Advanced Users

Deploy with Docker on any server:

```bash
# Windows
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

📚 **Full deployment guide**: See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive production deployment instructions.

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 19.0.0
- **Routing**: React Router DOM 7.5.1
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Rich Text**: React Quill
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod validation

### Backend
- **Framework**: FastAPI 0.110.1
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT (python-jose) + bcrypt
- **File Upload**: python-multipart
- **WebSocket**: Native FastAPI WebSocket support
- **CORS**: Starlette middleware

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production)
- **Process Manager**: Gunicorn with Uvicorn workers
- **Database**: MongoDB Atlas (cloud)

## 📁 Project Structure

```
Pinpost/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── uploads/              # User uploaded files
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application
│   │   ├── components/       # React components
│   │   │   ├── Header.js
│   │   │   ├── Footer.js
│   │   │   ├── ProfileSetup.js
│   │   │   ├── EnhancedPostModal.js
│   │   │   └── ui/           # shadcn/ui components
│   │   └── pages/
│   │       └── PostDetailPage.js
│   ├── package.json          # Node dependencies
│   └── tailwind.config.js    # Tailwind configuration
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile.backend        # Backend Docker image
├── Dockerfile.frontend       # Frontend Docker image
├── nginx.conf               # Nginx configuration
├── deploy.sh               # Linux/Mac deployment script
├── deploy.ps1              # Windows deployment script
├── backup.sh               # Linux/Mac backup script
├── backup.ps1              # Windows backup script
└── DEPLOYMENT_GUIDE.md     # Comprehensive deployment guide
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=pinpost_production

# Security
SECRET_KEY=your-super-secret-key-minimum-32-characters
JWT_EXPIRATION_HOURS=24

# CORS
FRONTEND_URL=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Environment
ENVIRONMENT=production
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

#### Posts
- `GET /api/posts` - Get all posts (paginated)
- `POST /api/posts` - Create new post
- `GET /api/posts/{post_id}` - Get single post
- `POST /api/posts/{post_id}/like` - Like/unlike post

#### Blogs
- `GET /api/blogs` - Get all blogs (paginated)
- `POST /api/blogs` - Create new blog
- `GET /api/blogs/{blog_id}` - Get single blog
- `POST /api/blogs/{blog_id}/like` - Like/unlike blog

#### Users
- `GET /api/users/{username}` - Get user profile
- `PUT /api/profile/setup` - Update profile
- `POST /api/users/{user_id}/follow` - Follow/unfollow user
- `GET /api/users/trending` - Get trending users

#### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{notification_id}/read` - Mark as read

#### WebSocket
- `WS /ws/notifications/{user_id}` - Real-time notifications

## 🎨 Features in Detail

### Authentication System
- JWT token-based authentication
- Password hashing with bcrypt
- Secure session management
- Profile completion tracking

### Social Feed
- Filter by All/Following/Trending
- Real-time search functionality
- Pagination (10 posts per page)
- Optimistic UI updates
- Image upload support
- Location tagging

### Blog Platform
- Rich text editor (React Quill)
- Cover image support
- Tags and categories
- Reading time estimation
- Responsive typography
- Mobile-optimized reading experience

### Real-time Features
- WebSocket notifications
- Live notification count
- Instant updates for likes/comments
- Online user status (ready to implement)

### User Experience
- Modern, clean UI design
- Dark mode ready (can be implemented)
- Responsive on all devices
- Fast page transitions
- Loading states and skeletons
- Error handling

## 🔒 Security Features

- **Authentication**: JWT tokens with secure secret keys
- **Password Security**: Bcrypt hashing with salt
- **CORS Protection**: Configured allowed origins
- **File Upload Validation**: File type and size restrictions
- **SQL/NoSQL Injection**: Protected by PyMongo
- **Rate Limiting**: Ready to implement
- **HTTPS**: SSL/TLS support in production
- **Security Headers**: X-Frame-Options, CSP, etc.

## 📊 Performance Optimizations

- **Database Indexes**: Optimized queries
- **Pagination**: Efficient data loading
- **Lazy Loading**: Images and components
- **Caching**: Ready for Redis integration
- **CDN**: Static asset optimization
- **Gzip Compression**: Nginx configuration
- **Image Optimization**: Automatic resizing (ready to implement)

## 🚢 Deployment Options

### Cloud Platforms
- **AWS**: EC2, ECS, Elastic Beanstalk
- **Google Cloud**: Cloud Run, Compute Engine
- **Azure**: Container Instances, App Service
- **DigitalOcean**: Droplets, App Platform
- **Heroku**: Container deployment
- **Vercel + Railway**: Frontend + Backend split

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:8000/api/health

# Using wrk
wrk -t12 -c400 -d30s http://localhost:8000/api/health
```

## 📈 Monitoring

### Health Checks
- Backend: http://localhost:8000/api/health
- Frontend: http://localhost/health

### Logging
```bash
# View all logs
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Frontend logs only
docker-compose logs -f frontend
```

### Metrics (with Prometheus)
```bash
docker-compose -f docker-compose.production.yml up -d
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

## 🔄 Backup & Recovery

### Automated Backups
```bash
# Windows
.\backup.ps1

# Linux/Mac
chmod +x backup.sh
./backup.sh
```

### Manual Backup
```bash
# Backup uploads
docker-compose exec backend tar -czf /tmp/uploads-backup.tar.gz /app/uploads
docker cp pinpost-backend:/tmp/uploads-backup.tar.gz ./backups/

# MongoDB Atlas has automatic backups
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - JavaScript library for building UIs
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Lucide](https://lucide.dev/) - Beautiful icon library

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/Pinpost/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/Pinpost/discussions)
- **Email**: support@pinpost.com

## 🗺️ Roadmap

### v1.0 (Current)
- [x] User authentication & profiles
- [x] Social feed with posts
- [x] Blog platform
- [x] Real-time notifications
- [x] Follow system
- [x] Comments & likes
- [x] Stories feature
- [x] Search & filters

### v1.1 (Planned)
- [ ] Direct messaging
- [ ] Group chats
- [ ] Video upload support
- [ ] Advanced search with Elasticsearch
- [ ] Content moderation tools
- [ ] Admin dashboard

### v2.0 (Future)
- [ ] Mobile app (React Native)
- [ ] Live streaming
- [ ] Monetization features
- [ ] Advanced analytics
- [ ] AI-powered recommendations
- [ ] Multi-language support

---

**Made with ❤️ by the Pinpost Team**

*Star ⭐ this repository if you find it helpful!*
