# Pinpost Copilot Instructions

## Architecture Overview

Pinpost is a **monorepo social media platform** with separated concerns:
- **Backend**: FastAPI (Python 3.11) with Motor async MongoDB driver
- **Frontend**: React 19 + shadcn/ui components + Tailwind CSS  
- **Deployment**: Docker containers with nginx reverse proxy

Key architectural patterns:
- **Real-time notifications** via WebSocket connections (see `ConnectionManager` in `backend/server.py`)
- **JWT authentication** with bcrypt password hashing
- **File uploads** handled in `/uploads` directory with UUID naming
- **Database**: MongoDB Atlas with async operations throughout

## Development Workflow

### Local Development
```bash
# Backend (Port 8000)
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Frontend (Port 3000) 
cd frontend
npm install
npm start
```

### Environment Setup
- **Backend**: Create `.env` in root with `MONGO_URL`, `DB_NAME`, `SECRET_KEY`, `FRONTEND_URL`
- **Frontend**: Uses `REACT_APP_BACKEND_URL` (defaults to `http://localhost:8000`)

### Docker Production
```bash
# Full stack deployment
docker-compose up --build

# Frontend-only rebuild (common after UI changes)
docker-compose up --build frontend
```

## Code Patterns & Conventions

### Backend (`backend/server.py`)
- **Single-file FastAPI app** (~1200 lines) with all routes, models, and logic
- **Async MongoDB operations**: Always use `await db.collection.operation()`
- **JWT dependency injection**: `current_user_id: str = Depends(get_current_user)`
- **Error handling**: Raise `HTTPException` with appropriate status codes
- **File uploads**: Store in `/app/uploads` with UUID filenames

### Frontend (`frontend/src/App.js`)
- **Component architecture**: Single App.js file (~3000 lines) with inline components
- **shadcn/ui imports**: `@/components/ui/button`, `@/components/ui/card`, etc.
- **API calls**: `axios` with `${API}/endpoint` pattern where `API = ${BACKEND_URL}/api`
- **Routing**: React Router with `BrowserRouter`, `Routes`, `Route`
- **State management**: useState hooks, no external state library

### Component Structure
- **shadcn/ui components**: In `frontend/src/components/ui/` (auto-generated, don't modify)
- **Custom components**: In `frontend/src/components/` (e.g., `Header.js`, `Stories.js`)
- **Pages**: In `frontend/src/pages/` for route components

### Styling Patterns  
- **Tailwind CSS**: Utility-first classes throughout
- **shadcn/ui theming**: CSS variables in `frontend/src/index.css`
- **Responsive design**: Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints

## Data Models & API Patterns

### Key Collections
- `users`: User profiles with `username`, `email`, `avatar_url`, `followers`, `following`
- `posts`: Social posts with `content`, `author_id`, `likes`, `comments`, `images`
- `notifications`: Real-time notifications with WebSocket delivery

### API Conventions
- **Authentication**: Bearer token in `Authorization` header
- **File uploads**: Multipart form data to `/api/upload`
- **WebSocket**: Connect to `/ws/notifications/{user_id}` for real-time updates
- **Pagination**: Use `skip` and `limit` query parameters

## Critical Integration Points

### WebSocket Notifications
- **Backend**: `ConnectionManager` class manages active WebSocket connections
- **Frontend**: `Header.js` establishes WebSocket connection and shows toast notifications
- **Pattern**: Backend creates notification in DB, then sends via WebSocket to connected clients

### File Upload Flow
1. Frontend uploads to `/api/upload` endpoint
2. Backend saves to `/app/uploads/{uuid}.{extension}`
3. Returns `{"file_url": "/uploads/{filename}"}` 
4. Frontend stores returned URL in post/user data

### nginx Reverse Proxy
- **API requests**: `/api/*` proxied to `backend:8000`
- **WebSocket**: `/ws/*` proxied with upgrade headers
- **Static files**: Served directly from nginx container
- **Frontend**: All other routes serve `index.html` for SPA routing

## Deployment & Infrastructure

### Docker Composition
- **backend container**: Python app on port 8000 with volume-mounted uploads
- **frontend container**: nginx serving built React app on ports 80/443
- **Networks**: `pinpost-network` for inter-container communication

### Production Environment Variables
```env
ENVIRONMENT=production  # Enables SSL bypass for MongoDB
MONGO_URL=mongodb+srv://... # MongoDB Atlas connection string
FRONTEND_URL=https://yourdomain.com # CORS configuration
```

### Common Deployment Issues
- **SSL handshake failures**: Backend creates custom SSL context for MongoDB in production
- **CORS errors**: Ensure `FRONTEND_URL` matches actual domain
- **File upload permissions**: `/app/uploads` volume must be writable

## Testing & Debugging

### Backend Testing
```bash
cd backend
pytest  # Run test suite (if available)
```

### Frontend Development
- **Hot reload**: Changes trigger automatic browser refresh
- **API proxy**: Create React App proxies `/api` to backend during development
- **Component testing**: Use browser dev tools, no formal test framework configured

### Production Debugging
- **Container logs**: `docker-compose logs backend` or `docker-compose logs frontend`
- **Health checks**: Backend `/`, Frontend responds to nginx status checks
- **WebSocket connection**: Check browser Network tab for WebSocket connection status