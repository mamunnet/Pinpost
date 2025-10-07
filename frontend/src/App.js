import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heart, MessageCircle, Share2, Bookmark, Edit, Trash2, Plus, Home, FileText, User, LogOut, Search, Users, TrendingUp, Camera, MapPin, Calendar, Flame, Sparkles, Clock, ArrowLeft, ChevronRight } from "lucide-react";
import { getUserAvatarUrl, getImageUrl } from "@/utils/imageUtils";
import { EnhancedPostModal } from "@/components/EnhancedPostModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stories } from "@/components/Stories";
import { ProfileSetup } from "@/components/ProfileSetup";
import { EditProfileModal } from "@/components/EditProfileModal";
import { EditCoverPhotoModal } from "@/components/EditCoverPhotoModal";
import { EditAvatarModal } from "@/components/EditAvatarModal";
import { NotificationTester } from "@/components/NotificationTester";
import { PostCard } from "@/components/PostCard";
import { BlogCard } from "@/components/BlogCard";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { MenuPage } from "@/pages/MenuPage";
import HomePage from "@/pages/HomePage";
import SocialPage from "@/pages/SocialPage";
import BlogsPage from "@/pages/BlogsPage";
import BlogDetailPage from "@/pages/BlogDetailPage";
import TrendingPage from "@/pages/TrendingPage";
import ProfilePage from "@/pages/ProfilePage";
import EnhancedMessagesPage from "@/pages/EnhancedMessagesPage";
import AuthPage from "@/pages/AuthPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      console.log('🔍 App.js - Fetching user from:', `${API}/auth/me`);
      const response = await axios.get(`${API}/auth/me`);
      console.log('✅ App.js - User fetched successfully:', response.data);
      console.log('📝 App.js - Username:', response.data.username);
      
      if (!response.data.username) {
        console.error('❌ App.js - User has no username!', response.data);
        console.error('User keys:', Object.keys(response.data));
      }
      
      setUser(response.data);
    } catch (error) {
      console.error('❌ App.js - Failed to fetch user:', error);
      console.error('Error response:', error.response);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return children({ user, token, login, logout, loading, updateUser });
};

// Navigation component removed - using Header from separate file
// Navigation component removed - using Header from separate file
// SocialPage component moved to frontend/src/pages/SocialPage.js

const WhoToFollow = ({ user }) => {
  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/users/trending?limit=3`);
      setSuggestedUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post(`${API}/users/${userId}/follow`);
      
      // Find the user being followed for personalized notification
      const followedUser = suggestedUsers.find(u => u.id === userId);
      const username = followedUser ? followedUser.username : 'User';
      
      toast.success(`👤 Following ${username}!`, {
        description: 'You will now see their posts in your feed and they have been notified.',
        duration: 4000,
        action: {
          label: "View Profile",
          onClick: () => navigate(`/profile/${username}`)
        }
      });
      
      fetchSuggestions();
    } catch (error) {
      toast.error('❌ Failed to follow user', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded"></div>)}
    </div>;
  }

  return (
    <>
      {suggestedUsers.slice(0, 3).map((suggestedUser) => (
        <div key={suggestedUser.id} className="flex items-center justify-between py-2">
          <div 
            className="flex items-center gap-2 flex-1 cursor-pointer"
            onClick={() => navigate(`/profile/${suggestedUser.username}`)}
          >
            <Avatar className="w-10 h-10">
              {getUserAvatarUrl(suggestedUser) ? (
                <img src={getUserAvatarUrl(suggestedUser)} alt={suggestedUser.username} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm">
                  {suggestedUser.username[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{suggestedUser.name || suggestedUser.username}</p>
              <p className="text-xs text-gray-500 truncate">@{suggestedUser.username}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleFollow(suggestedUser.id)}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-xs px-3"
          >
            Follow
          </Button>
        </div>
      ))}
    </>
  );
};

// CreateContentModal removed - now using EnhancedPostModal

const TrendingSidebar = ({ user }) => {
  const [activeTab, setActiveTab] = useState('posts');
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      const [usersRes, postsRes, blogsRes] = await Promise.all([
        axios.get(`${API}/users/trending?limit=5`),
        axios.get(`${API}/posts?sort=trending&limit=5`),
        axios.get(`${API}/blogs?sort=trending&limit=5`)
      ]);
      setTrendingUsers(usersRes.data);
      setTrendingPosts(postsRes.data);
      setTrendingBlogs(blogsRes.data);
    } catch (error) {
      console.error('Failed to load trending:', error);
      // Fallback: just fetch users if advanced trending fails
      try {
        const response = await axios.get(`${API}/users/trending?limit=5`);
        setTrendingUsers(response.data);
      } catch (err) {
        console.error('Failed to load trending users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post(`${API}/users/${userId}/follow`);
      toast.success('Followed!');
      fetchTrending();
    } catch (error) {
      toast.error('Failed to follow');
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Trending Navigation Card */}
      <Card className="sticky top-24 shadow-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full blur-3xl opacity-50"></div>
        
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
              Trending Now
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          {/* Tab Selector */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'posts' 
                  ? 'bg-white shadow-md text-slate-700' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'blogs' 
                  ? 'bg-white shadow-md text-slate-700' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Blogs
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'users' 
                  ? 'bg-white shadow-md text-slate-700' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" />
              People
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Trending Posts */}
              {activeTab === 'posts' && (
                <div className="space-y-3">
                  {trendingPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No trending posts yet</p>
                    </div>
                  ) : (
                    trendingPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="group relative p-3 rounded-xl hover:bg-slate-50 transition-all duration-300 border border-transparent hover:border-slate-200 cursor-pointer"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Enhanced Rank Badge with Trending Icon */}
                          <div className="relative flex-shrink-0">
                            <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-105 transition-transform">
                              {index + 1}
                            </div>
                            {/* Small Trending Fire Icon */}
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                              <Flame className="w-1.5 h-1.5 text-white" />
                            </div>
                          </div>
                          
                          {/* Enhanced Profile Photo */}
                          <Avatar className="w-7 h-7 ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all flex-shrink-0">
                            {getImageUrl(post.author_avatar) ? (
                              <img src={getImageUrl(post.author_avatar)} alt={post.author_name || post.author_username} className="w-full h-full object-cover" />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-xs font-semibold">
                                {(post.author_name || post.author_username)[0].toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            {/* Enhanced Author Info */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-600 transition-colors">
                                {post.author_name || post.author_username}
                              </span>
                              {post.author_name && (
                                <>
                                  <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
                                  <span className="text-xs text-slate-500">@{post.author_username}</span>
                                </>
                              )}
                              <div className="flex items-center gap-1 ml-auto">
                                <TrendingUp className="w-2.5 h-2.5 text-orange-500" />
                              </div>
                            </div>
                            
                            {/* Enhanced Content Preview */}
                            <p className="text-xs font-medium text-slate-900 line-clamp-2 group-hover:text-slate-700 transition-colors leading-relaxed mb-2">
                              {post.content.length > 65 ? post.content.substring(0, 65) + '...' : post.content}
                            </p>
                            
                            {/* Enhanced Stats */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors">
                                  <Heart className="w-3 h-3" />
                                  <span className="font-medium">{post.likes_count || 0}</span>
                                </span>
                                <span className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-500 transition-colors">
                                  <MessageCircle className="w-3 h-3" />
                                  <span className="font-medium">{post.comments_count || 0}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(post.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Trending Blogs */}
              {activeTab === 'blogs' && (
                <div className="space-y-3">
                  {trendingBlogs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No trending blogs yet</p>
                    </div>
                  ) : (
                    trendingBlogs.map((blog, index) => (
                      <div
                        key={blog.id}
                        className="group p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 
                              onClick={() => navigate(`/blog/${blog.id}`)}
                              className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-slate-700 transition-colors leading-snug mb-1 cursor-pointer"
                            >
                              {blog.title}
                            </h4>
                            <p 
                              onClick={() => navigate(`/blog/${blog.id}`)}
                              className="text-xs text-slate-600 line-clamp-1 mb-2 cursor-pointer"
                            >
                              {blog.excerpt}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${blog.author_username}`);
                                }}
                                className="text-xs text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                              >
                                @{blog.author_username}
                              </span>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(blog.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {blog.tags && blog.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs py-0 px-2 bg-slate-100 text-slate-700 border-0">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Trending Users */}
              {activeTab === 'users' && (
                <div className="space-y-3">
                  {trendingUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No trending users yet</p>
                    </div>
                  ) : (
                    trendingUsers.map((trendingUser) => (
                      <div key={trendingUser.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200">
                        <Link to={`/profile/${trendingUser.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all">
                            {getUserAvatarUrl(trendingUser) ? (
                              <img src={getUserAvatarUrl(trendingUser)} alt={trendingUser.username} className="w-full h-full object-cover" />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold">
                                {trendingUser.username[0].toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate group-hover:text-slate-700 transition-colors">{trendingUser.name || trendingUser.username}</p>
                            <p className="text-xs text-slate-500 truncate">@{trendingUser.username}</p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {trendingUser.followers_count || 0} followers
                            </p>
                          </div>
                        </Link>
                        {!trendingUser.is_following && trendingUser.id !== user.id && (
                          <Button 
                            size="sm" 
                            onClick={() => handleFollow(trendingUser.id)}
                            className="ml-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white text-xs h-7 px-3 shadow-md"
                          >
                            Follow
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// BlogsPage component moved to frontend/src/pages/BlogsPage.js
// BlogDetailPage component moved to frontend/src/pages/BlogDetailPage.js
// ProfilePage component moved to frontend/src/pages/ProfilePage.js

const AdCard = ({ adIndex }) => {
  const ads = [
    {
      title: "Boost Your Writing",
      description: "Join our premium writing tools and reach more readers.",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
      cta: "Learn More",
      sponsor: "PenLink Pro"
    },
    {
      title: "Creative Workshop",
      description: "Unlock your creative potential with our online courses.",
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80",
      cta: "Start Free Trial",
      sponsor: "CreativeHub"
    },
    {
      title: "Coffee & Code",
      description: "Perfect blend for writers and developers. Free delivery!",
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80",
      cta: "Order Now",
      sponsor: "ByteBrew"
    },
    {
      title: "Digital Marketing",
      description: "Grow your blog's audience with proven marketing strategies.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
      cta: "Get Started",
      sponsor: "GrowthLabs"
    }
  ];

  const ad = ads[adIndex % ads.length];

  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs text-gray-500">Sponsored</Badge>
          <span className="text-xs text-gray-400">by {ad.sponsor}</span>
        </div>
        <div className="flex items-start space-x-4">
          <img 
            src={ad.image} 
            alt={ad.title}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{ad.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ad.description}</p>
            <Button size="sm" variant="outline" className="text-xs">
              {ad.cta}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// TrendingPage component moved to frontend/src/pages/TrendingPage.js
// AuthPage component moved to frontend/src/pages/AuthPage.js

function App() {
  return (
    <div className="App">
      <AuthContext>
        {({ user, token, login, logout, loading, updateUser }) => {
          if (loading) {
            return (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
              </div>
            );
          }

          if (!token) {
            return <AuthPage onLogin={login} />;
          }

          // Show profile setup if user hasn't completed profile
          if (user && !user.profile_completed) {
            return <ProfileSetup user={user} onComplete={(updatedUser) => updateUser(updatedUser)} />;
          }

          return (
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Header user={user} logout={logout} />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage user={user} />} />
                    <Route path="/social" element={<SocialPage user={user} />} />
                    <Route path="/blogs" element={<BlogsPage user={user} />} />
                    <Route path="/trending" element={<TrendingPage user={user} />} />
                    <Route path="/blog/:blogId" element={<BlogDetailPage user={user} />} />
                    <Route path="/post/:postId" element={<PostDetailPage user={user} />} />
                    <Route path="/profile/:username" element={<ProfilePage currentUser={user} />} />
                    <Route path="/messages" element={<EnhancedMessagesPage user={user} />} />
                    <Route path="/menu" element={<MenuPage user={user} logout={logout} />} />
                  </Routes>
                </div>
                <Footer />
              </div>
            </BrowserRouter>
          );
        }}
      </AuthContext>
    </div>
  );
}

export default App;
