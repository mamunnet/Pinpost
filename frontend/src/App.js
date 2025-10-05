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
import { EnhancedPostModal } from "@/components/EnhancedPostModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stories } from "@/components/Stories";
import { ProfileSetup } from "@/components/ProfileSetup";
import { EditProfileModal } from "@/components/EditProfileModal";
import { EditCoverPhotoModal } from "@/components/EditCoverPhotoModal";
import { EditAvatarModal } from "@/components/EditAvatarModal";
import { PostDetailPage } from "@/pages/PostDetailPage";
import { MenuPage } from "@/pages/MenuPage";

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
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
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

const SocialPage = ({ user }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all'); // all, following, trending
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    fetchPosts(true);
  }, [filter]);

  useEffect(() => {
    // Filter posts based on search query
    if (searchQuery.trim()) {
      const filtered = posts.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.author_name && post.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  }, [searchQuery, posts]);

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const skip = currentPage * 10;
      
      let endpoint = `${API}/posts?skip=${skip}&limit=10`;
      if (filter === 'following') {
        endpoint = `${API}/feed?skip=${skip}&limit=10&following_only=true`;
      } else if (filter === 'trending') {
        endpoint = `${API}/posts?skip=${skip}&limit=10&sort=trending`;
      }

      const response = await axios.get(endpoint);
      const newPosts = response.data;

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts([...posts, ...newPosts]);
      }

      setHasMore(newPosts.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (post) => {
    try {
      if (post.liked_by_user) {
        await axios.delete(`${API}/likes/post/${post.id}`);
      } else {
        await axios.post(`${API}/likes/post/${post.id}`);
      }
      // Update post in the list immediately
      setPosts(posts.map(p => p.id === post.id ? {...p, liked_by_user: !p.liked_by_user, likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1} : p));
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading social feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Futuristic Header */}
        <div className="relative mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-2xl p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Social Hub</h1>
                    <p className="text-slate-200 text-sm sm:text-base">Connect, share, and discover</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
              <div className="flex items-center space-x-4 text-slate-200 text-sm">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live Feed
                </span>
                <span>•</span>
                <span>{filteredPosts.length} posts loaded</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl mx-auto space-y-6">
            {/* Enhanced Filter Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 sticky top-24 z-10">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search posts, people, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl text-slate-700 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Modern Filter Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === 'all' 
                      ? 'bg-white shadow-md text-slate-700 transform scale-105' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  All Posts
                </button>
                <button
                  onClick={() => setFilter('following')}
                  className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === 'following' 
                      ? 'bg-white shadow-md text-slate-700 transform scale-105' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Following
                </button>
                <button
                  onClick={() => setFilter('trending')}
                  className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === 'trending' 
                      ? 'bg-white shadow-md text-slate-700 transform scale-105' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </button>
              </div>
            </div>

            {/* Enhanced Posts Display */}
            {filteredPosts.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 text-center py-16 px-8">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  {searchQuery ? 'No posts found' : 'No posts yet'}
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
                  {searchQuery 
                    ? 'Try a different search query or explore trending topics'
                    : filter === 'following' 
                      ? 'Follow some people to see their posts in your feed'
                      : 'Be the first to share something amazing with the community!'}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setShowCreateModal(true)} 
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Post
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {filteredPosts.map((post, index) => (
                    <div key={post.id} className="group">
                      {/* Enhanced Post Card Container */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 overflow-hidden">
                        <PostCard post={post} user={user} onLike={() => handleLike(post)} onComment={() => fetchPosts(true)} />
                      </div>
                      
                      {/* Enhanced Ad Placement */}
                      {(index + 1) % 4 === 0 && index < filteredPosts.length - 1 && (
                        <div className="mt-6">
                          <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-6">
                            <AdCard adIndex={Math.floor(index / 4)} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Enhanced Load More Button */}
                {hasMore && !searchQuery && (
                  <div className="text-center py-8">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-800 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600 mr-3"></div>
                          Loading more posts...
                        </>
                      ) : (
                        <>
                          <span>Load More Posts</span>
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Suggestions */}
          <div className="hidden lg:block w-80 space-y-6">
            {/* Who to Follow */}
            <Card className="sticky top-20 shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Who to Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <WhoToFollow user={user} />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-teal-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Your Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    Posts
                  </span>
                  <span className="font-bold text-blue-600">
                    {posts.filter(p => p.author_id === user?.id).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    Likes Given
                  </span>
                  <span className="font-bold text-rose-600">
                    {posts.filter(p => p.liked_by_user).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Engagement
                  </span>
                  <span className="font-bold text-green-600">
                    {posts.reduce((acc, p) => acc + (p.author_id === user?.id ? p.likes_count + p.comments_count : 0), 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <EnhancedPostModal onClose={() => {
            setShowCreateModal(false);
            fetchPosts(true);
          }} currentUser={user} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// WhoToFollow Component
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
      toast.success('Followed!');
      fetchSuggestions();
    } catch (error) {
      toast.error('Failed to follow');
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
              {suggestedUser.avatar ? (
                <img src={suggestedUser.avatar} alt={suggestedUser.username} className="w-full h-full object-cover" />
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

const PostCard = ({ post, onLike, onComment }) => {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const fetchComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setLoadingComments(true);
    try {
      const response = await axios.get(`${API}/comments/post/${post.id}`);
      setComments(response.data);
      setShowComments(true);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;

    try {
      const response = await axios.post(`${API}/comments/post/${post.id}`, { content: commentContent });
      setComments([response.data, ...comments]);
      setCommentContent('');
      if (onComment) onComment();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Extract image from content
  let displayContent = post.content;
  let postImage = null;
  if (post.content && post.content.includes('[IMAGE]')) {
    const parts = post.content.split('[IMAGE]');
    displayContent = parts[0];
    postImage = parts[1];
  }

  return (
    <div className="bg-white hover:bg-slate-50/50 transition-all duration-300 py-4 sm:py-6" data-testid="post-card">
      <div className="space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-start space-x-3 px-4">
          <Link to={`/profile/${post.author_username}`} className="group flex-shrink-0">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all">
              {post.author_avatar ? (
                <img src={post.author_avatar} alt={post.author_name || post.author_username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm sm:text-base">
                  {(post.author_name || post.author_username)[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${post.author_username}`} className="hover:underline">
                <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                  {post.author_name || post.author_username}
                </p>
              </Link>
              <span className="text-slate-400 text-xs sm:text-sm">•</span>
              <p className="text-xs sm:text-sm text-slate-500">{formatDate(post.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Content - Clickable to navigate to post detail */}
        <div 
          onClick={() => navigate(`/post/${post.id}`)}
          className="cursor-pointer hover:bg-slate-50 px-4 py-2 transition-colors"
        >
          {displayContent.trim() && (
            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm sm:text-[15px]">{displayContent}</p>
          )}

          {/* Image */}
          {postImage && (
            <div className="mt-3 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
              <img src={postImage} alt="Post" className="w-full max-h-96 object-cover" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 sm:pt-3 border-t border-slate-200 mx-4">
          <div className="flex items-center space-x-1">
            <div className="relative">
              <button
                onClick={onLike}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg ${
                  post.liked_by_user 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-slate-600 hover:bg-slate-100'
                } transition-all group`}
                data-testid="like-post-btn"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${post.liked_by_user ? 'fill-current' : ''} group-hover:scale-110 transition-transform`} />
                <span className="text-xs sm:text-sm font-semibold">{post.likes_count > 0 && post.likes_count}</span>
              </button>
              
              {/* Reaction Picker */}
              {showReactions && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 px-2 sm:px-3 py-1 sm:py-2 flex space-x-1 z-10"
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {['❤️', '😍', '😂', '👍', '😮', '😢'].map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onLike();
                        setShowReactions(false);
                      }}
                      className="text-lg sm:text-xl hover:scale-125 transition-transform p-1 sm:p-1.5 hover:bg-slate-50 rounded-full"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={fetchComments}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all group"
              data-testid="comment-post-btn"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="text-xs sm:text-sm font-semibold">{post.comments_count > 0 && post.comments_count}</span>
            </button>
            <button className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all group">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 border-t border-slate-200 pt-3 sm:pt-4 mx-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                className="flex-1 border-slate-200 focus:border-slate-400 focus:ring-slate-300 text-sm"
                data-testid="comment-input"
              />
              <Button 
                onClick={handleComment} 
                size="sm" 
                className="hover:scale-105 transition-transform bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 text-xs" 
                data-testid="submit-comment-btn"
              >
                Post
              </Button>
            </div>
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2 p-2 sm:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-1 ring-white">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                    {comment.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">{comment.username}</p>
                  <p className="text-xs sm:text-sm text-slate-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BlogCard = ({ blog, onLike, compact = false }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (compact) {
    return (
      <Card className="hover:shadow-xl transition-all cursor-pointer group" onClick={() => navigate(`/blog/${blog.id}`)} data-testid="blog-card">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="w-10 h-10">
              {blog.author_avatar ? (
                <img src={blog.author_avatar} alt={blog.author_name || blog.author_username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-rose-500 text-white text-sm">
                  {(blog.author_name || blog.author_username)[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{blog.author_name || blog.author_username}</p>
              <p className="text-xs text-gray-500">@{blog.author_username} • {formatDate(blog.created_at)}</p>
            </div>
          </div>
          <CardTitle className="text-xl group-hover:text-rose-600 transition-colors line-clamp-2">{blog.title}</CardTitle>
          <CardDescription className="line-clamp-2">{blog.excerpt}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {blog.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Heart className={`w-4 h-4 ${blog.liked_by_user ? 'fill-rose-600 text-rose-600' : ''}`} />
                <span>{blog.likes_count}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{blog.comments_count}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate(`/blog/${blog.id}`)} data-testid="blog-card-full">
      {blog.cover_image && (
        <div className="w-full h-48 overflow-hidden">
          <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <Link to={`/profile/${blog.author_username}`} onClick={(e) => e.stopPropagation()}>
            <Avatar className="w-12 h-12">
              {blog.author_avatar ? (
                <img src={blog.author_avatar} alt={blog.author_name || blog.author_username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-rose-500 text-white">
                  {(blog.author_name || blog.author_username)[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div>
            <p className="font-semibold text-base">{blog.author_name || blog.author_username}</p>
            <p className="text-sm text-gray-500">@{blog.author_username} • {formatDate(blog.created_at)}</p>
          </div>
        </div>
        <CardTitle className="text-2xl hover:text-rose-600 transition-colors">{blog.title}</CardTitle>
        <CardDescription className="line-clamp-3">{blog.excerpt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {blog.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center space-x-6 text-gray-600">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className={`flex items-center space-x-1 ${blog.liked_by_user ? 'text-rose-600' : 'hover:text-rose-600'} transition-colors`}
              data-testid="like-blog-btn"
            >
              <Heart className={`w-5 h-5 ${blog.liked_by_user ? 'fill-current' : ''}`} />
              <span>{blog.likes_count}</span>
            </button>
            <span className="flex items-center space-x-1">
              <MessageCircle className="w-5 h-5" />
              <span>{blog.comments_count}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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
                            {post.author_avatar ? (
                              <img src={post.author_avatar} alt={post.author_name || post.author_username} className="w-full h-full object-cover" />
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
                            {trendingUser.avatar ? (
                              <img src={trendingUser.avatar} alt={trendingUser.username} className="w-full h-full object-cover" />
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

const HomePage = ({ user }) => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialTab, setInitialTab] = useState('post');

  useEffect(() => {
    fetchFeed(true);
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) {
        return;
      }
      
      // Load more when user is near bottom (within 100px)
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        fetchFeed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page]);

  const fetchFeed = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const skip = currentPage * 10;
      
      const response = await axios.get(`${API}/feed?skip=${skip}&limit=10`);
      const newFeed = response.data;
      
      if (reset) {
        setFeed(newFeed);
      } else {
        setFeed(prevFeed => [...prevFeed, ...newFeed]);
      }
      
      setHasMore(newFeed.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (item) => {
    try {
      if (item.liked_by_user) {
        await axios.delete(`${API}/likes/${item.type}/${item.id}`);
      } else {
        await axios.post(`${API}/likes/${item.type}/${item.id}`);
      }
      
      // Update the item in feed without refetching entire feed
      setFeed(prevFeed => 
        prevFeed.map(feedItem => 
          feedItem.id === item.id && feedItem.type === item.type
            ? {
                ...feedItem, 
                liked_by_user: !feedItem.liked_by_user,
                likes_count: feedItem.liked_by_user 
                  ? (feedItem.likes_count || 1) - 1 
                  : (feedItem.likes_count || 0) + 1
              }
            : feedItem
        )
      );
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleComment = () => {
    // Refresh feed to get updated comment counts
    fetchFeed(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-3">
            {/* Stories Section */}
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200 bg-white">
              <CardContent className="p-6">
                <Stories user={user} />
              </CardContent>
            </Card>

            {/* Separator */}
            <div className="border-b border-slate-300"></div>

            {/* Create Post Box - Facebook Style */}
            <div className="bg-white shadow-sm hover:shadow-md transition-shadow rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 ring-2 ring-slate-200">
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => {
                    setInitialTab('post');
                    setShowCreateModal(true);
                  }}
                  className="flex-1 text-left px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-all duration-200 hover:shadow-sm border border-slate-200"
                  data-testid="whats-on-mind-btn"
                >
                  What's on your mind, {user.username}?
                </button>
              </div>
              <div className="flex items-center justify-around mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setInitialTab('blog');
                    setShowCreateModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-all group flex-1 justify-center border border-transparent hover:border-slate-200"
                >
                  <FileText className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-700 group-hover:text-slate-800 hidden sm:inline transition-colors">Blog Article</span>
                </button>
                <div className="w-px h-8 bg-slate-300"></div>
                <button
                  onClick={() => {
                    setInitialTab('post');
                    setShowCreateModal(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-all group flex-1 justify-center border border-transparent hover:border-slate-200"
                >
                  <MessageCircle className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-700 group-hover:text-slate-800 hidden sm:inline transition-colors">Quick Post</span>
                </button>
              </div>
            </div>

            {/* Create Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <EnhancedPostModal onClose={() => setShowCreateModal(false)} currentUser={user} initialTab={initialTab} />
              </DialogContent>
            </Dialog>

            {/* Separator */}
            <div className="border-b border-slate-300"></div>

            {/* Feed Content */}
            {feed.length === 0 && !loading ? (
              <div className="bg-white shadow-sm rounded-lg text-center py-12 px-4 border border-slate-200">
                <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Your feed is empty</h3>
                <p className="text-slate-600 mb-4">Follow some people or create your first post to get started!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <>
                {feed.map((item, index) => (
                  <div key={`${item.type}-${item.id}-${index}`} className="space-y-3">
                    {item.type === 'blog' ? (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-lg overflow-hidden">
                        <BlogCard blog={item} onLike={() => handleLike(item)} />
                      </div>
                    ) : (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-lg overflow-hidden">
                        <PostCard post={item} onLike={() => handleLike(item)} onComment={handleComment} />
                      </div>
                    )}
                    
                    {/* Enhanced Ad Placement */}
                    {(index + 1) % 5 === 0 && index < feed.length - 1 && (
                      <div className="my-6">
                        <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-6">
                          <AdCard key={`ad-${Math.floor(index / 5)}`} adIndex={Math.floor(index / 5)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Infinite Scroll Loading Indicator */}
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600 mr-3"></div>
                      <span className="text-slate-600 font-medium">Loading more posts...</span>
                    </div>
                  </div>
                )}
                
                {/* End of Feed Indicator */}
                {!hasMore && feed.length > 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center px-6 py-3 bg-slate-100 rounded-full">
                      <Heart className="w-5 h-5 text-slate-500 mr-2" />
                      <span className="text-slate-600 font-medium">You're all caught up!</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">You've seen all the latest posts from your network</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-3">
            <TrendingSidebar user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogsPage = ({ user }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(`${API}/blogs`);
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (blog) => {
    try {
      if (blog.liked_by_user) {
        await axios.delete(`${API}/likes/blog/${blog.id}`);
      } else {
        await axios.post(`${API}/likes/blog/${blog.id}`);
      }
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Futuristic Header */}
        <div className="relative mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-2xl p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Blog Articles</h1>
                  <p className="text-slate-200 text-sm sm:text-base">Discover thoughtful long-form content</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-slate-200 text-sm">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Fresh Articles
                </span>
                <span>•</span>
                <span>{blogs.length} articles available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Blog Grid */}
        {blogs.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 text-center py-16 px-8">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No articles yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
              Be the first to share your thoughts and expertise with the community through a detailed blog article.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <div key={blog.id} className="group">
                {/* Enhanced Blog Card Container */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 overflow-hidden group-hover:transform group-hover:scale-105">
                  <BlogCard blog={blog} onLike={() => handleLike(blog)} compact />
                </div>
                
                {/* Enhanced Ad Placement */}
                {(index + 1) % 6 === 0 && index < blogs.length - 1 && (
                  <div className="md:col-span-2 lg:col-span-3 mt-8">
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-8">
                      <AdCard adIndex={Math.floor(index / 6)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BlogDetailPage = ({ user }) => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const response = await axios.get(`${API}/blogs/${blogId}`);
      setBlog(response.data);
    } catch (error) {
      toast.error('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/comments/blog/${blogId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments');
    }
  };

  const handleLike = async () => {
    try {
      if (blog.liked_by_user) {
        await axios.delete(`${API}/likes/blog/${blogId}`);
      } else {
        await axios.post(`${API}/likes/blog/${blogId}`);
      }
      fetchBlog();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;

    try {
      await axios.post(`${API}/comments/blog/${blogId}`, { content: commentContent });
      setCommentContent('');
      fetchComments();
      fetchBlog();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Article not found</h3>
          <p className="text-slate-600">This article may have been removed or doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-all duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Articles
        </Button>

        {/* Enhanced Article Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
          {/* Article Header */}
          <div className="p-8 sm:p-12">
            <div className="flex items-center space-x-4 mb-8">
              <Link to={`/profile/${blog.author_username}`}>
                <Avatar className="w-14 h-14 ring-4 ring-slate-200 hover:ring-slate-300 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-lg font-bold">
                    {blog.author_username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link to={`/profile/${blog.author_username}`} className="font-bold text-lg text-slate-800 hover:text-slate-600 hover:underline transition-colors">
                  {blog.author_username}
                </Link>
                <p className="text-sm text-slate-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight text-slate-900" style={{fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"}}>
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map((tag) => (
                <Badge key={tag} className="bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border-0 px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>

            {blog.cover_image && (
              <div className="relative mb-8 rounded-2xl overflow-hidden group">
                <img 
                  src={blog.cover_image} 
                  alt={blog.title} 
                  className="w-full h-64 sm:h-80 md:h-96 object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
          </div>

          {/* Enhanced Article Content */}
          <div className="px-8 sm:px-12 pb-8">
            <div 
              className="text-slate-800 text-base sm:text-lg leading-relaxed sm:leading-loose whitespace-pre-wrap break-words" 
              style={{
                fontFamily: "'Georgia', 'Charter', 'Iowan Old Style', 'Times New Roman', serif",
                fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                lineHeight: '1.8',
                letterSpacing: '0.01em'
              }}
              data-testid="blog-content"
            >
              {blog.content}
            </div>
          </div>

          {/* Enhanced Interaction Bar */}
          <div className="border-t border-slate-200 bg-slate-50/50 px-8 sm:px-12 py-6">
            <div className="flex items-center justify-center sm:justify-start gap-8">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                  blog.liked_by_user 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                }`}
                data-testid="like-blog-detail-btn"
              >
                <Heart className={`w-6 h-6 ${blog.liked_by_user ? 'fill-current' : ''}`} />
                <span className="font-semibold">{blog.likes_count}</span>
              </button>
              
              <div className="flex items-center space-x-3 px-4 py-2 text-slate-600">
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold">{blog.comments_count}</span>
              </div>
              
              <button className="flex items-center space-x-3 px-4 py-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-105">
                <Share2 className="w-6 h-6" />
                <span className="font-semibold hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Comments Section */}
        <div className="mt-12 space-y-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <MessageCircle className="w-6 h-6 mr-3 text-slate-600" />
              Comments
            </h2>
            
            {user && (
              <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex space-x-4">
                  <Avatar className="ring-2 ring-slate-200">
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold">
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Share your thoughts on this article..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      rows={4}
                      className="border-slate-300 focus:border-slate-500 focus:ring-slate-500/20 bg-white"
                      data-testid="blog-comment-input"
                    />
                    <Button 
                      onClick={handleComment} 
                      className="mt-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-300" 
                      data-testid="blog-comment-submit-btn"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No comments yet</h3>
                  <p className="text-slate-500">Be the first to share your thoughts on this article!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-4 bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors">
                    <Avatar className="ring-2 ring-slate-200">
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold">
                        {comment.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="font-bold text-slate-800">{comment.username}</p>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <p className="text-sm text-slate-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

const ProfilePage = ({ currentUser }) => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCover, setShowEditCover] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const [userRes, blogsRes, postsRes] = await Promise.all([
        axios.get(`${API}/users/${username}`),
        axios.get(`${API}/users/${username}/blogs`),
        axios.get(`${API}/users/${username}/posts`)
      ]);
      setUser(userRes.data);
      setBlogs(blogsRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (user.is_following) {
        await axios.delete(`${API}/users/${user.id}/follow`);
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`${API}/users/${user.id}/follow`);
        toast.success('Followed successfully');
      }
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-rose-50/30 to-amber-50/20 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section with Cover & Profile */}
        <div className="relative mb-4">
          {/* Cover Photo with Modern Gradient Overlay */}
          <div className="relative h-36 sm:h-48 lg:h-56 rounded-2xl overflow-hidden shadow-xl">
            {user.cover_photo ? (
              <>
                <img 
                  src={user.cover_photo} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-400 via-pink-500 to-amber-400 relative">
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="5" cy="5" r="1" fill="white" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
              </div>
            )}
            
            {isOwnProfile && (
              <button
                onClick={() => setShowEditCover(true)}
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">{user.cover_photo ? 'Edit Cover' : 'Add Cover'}</span>
              </button>
            )}
          </div>

          {/* Profile Card - Overlapping Design */}
          <div className="relative px-4 sm:px-6 -mt-12 sm:-mt-14">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl bg-gradient-to-br from-rose-500 to-amber-500">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name || user.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold">
                          {(user.name || user.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowEditAvatar(true)}
                        className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                          {user.name || user.username}
                        </h1>
                        {user.name && (
                          <p className="text-gray-500 text-sm sm:text-base">@{user.username}</p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isOwnProfile ? (
                          <Button
                            onClick={() => setShowEditProfile(true)}
                            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            <span>Edit Profile</span>
                          </Button>
                        ) : (
                          currentUser && (
                            <Button
                              onClick={handleFollow}
                              className={user.is_following 
                                ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300" 
                                : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg"
                              }
                              data-testid="follow-btn"
                            >
                              {user.is_following ? 'Following' : 'Follow'}
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-gray-700 mt-2 text-sm leading-relaxed line-clamp-2">{user.bio}</p>
                    )}
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                      {user.location && (
                        <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-rose-600" />
                        <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-2.5 sm:p-3 text-center border border-rose-100 hover:shadow-md transition-shadow">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{posts.length + blogs.length}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Posts</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-2.5 sm:p-3 text-center border border-amber-100 hover:shadow-md transition-shadow">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{user.followers_count || 0}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Followers</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-3 text-center border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{user.following_count || 0}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Following</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section with Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-8">
              <TabsList className="bg-transparent border-0 h-auto p-0 space-x-2 sm:space-x-4">
                <TabsTrigger 
                  value="posts" 
                  data-testid="profile-posts-tab"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-t-lg px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Posts</span>
                  <Badge variant="secondary" className="ml-2 bg-rose-100 text-rose-700">{posts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="blogs" 
                  data-testid="profile-blogs-tab"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-t-lg px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Blogs</span>
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">{blogs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="about"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-t-lg px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">About</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              <TabsContent value="posts" className="mt-0">
                <div className="space-y-4 sm:space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onLike={() => {}} onComment={() => {}} />
                  ))}
                  {posts.length === 0 && (
                    <div className="text-center py-16 sm:py-20">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                        {isOwnProfile ? "Share your thoughts and ideas with the world!" : `${user.name || user.username} hasn't shared any posts yet.`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="blogs" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {blogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} onLike={() => {}} compact />
                  ))}
                  {blogs.length === 0 && (
                    <div className="col-span-full text-center py-16 sm:py-20">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No blogs yet</h3>
                      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                        {isOwnProfile ? "Start writing and share your stories!" : `${user.name || user.username} hasn't published any blogs yet.`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                <div className="max-w-3xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Bio Card */}
                    {user.bio && (
                      <div className="sm:col-span-2 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
                          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          Bio
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                    
                    {/* Location Card */}
                    {user.location && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          Location
                        </h4>
                        <p className="text-gray-700">{user.location}</p>
                      </div>
                    )}
                    
                    {/* Birthday Card */}
                    {user.date_of_birth && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          Birthday
                        </h4>
                        <p className="text-gray-700">
                          {new Date(user.date_of_birth).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                    
                    {/* Joined Card */}
                    <div className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100 ${user.date_of_birth ? '' : 'sm:col-span-2'}`}>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        Joined PenLink
                      </h4>
                      <p className="text-gray-700">
                        {new Date(user.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal 
          user={user} 
          onClose={() => setShowEditProfile(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            setShowEditProfile(false);
          }}
        />
      )}

      {/* Edit Cover Photo Modal */}
      {showEditCover && (
        <EditCoverPhotoModal 
          user={user} 
          onClose={() => setShowEditCover(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            setShowEditCover(false);
          }}
        />
      )}

      {/* Edit Avatar Modal */}
      {showEditAvatar && (
        <EditAvatarModal 
          user={user} 
          onClose={() => setShowEditAvatar(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            setShowEditAvatar(false);
          }}
        />
      )}
    </div>
  );
};

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

const TrendingPage = ({ user }) => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingContent();
  }, []);

  const fetchTrendingContent = async () => {
    try {
      // For now, fetch all posts and blogs and sort by engagement
      const [postsRes, blogsRes] = await Promise.all([
        axios.get(`${API}/posts`),
        axios.get(`${API}/blogs`)
      ]);
      
      // Sort by likes + comments for trending algorithm
      const sortedPosts = postsRes.data.sort((a, b) => 
        ((b.likes_count || 0) + (b.comments_count || 0)) - 
        ((a.likes_count || 0) + (a.comments_count || 0))
      ).slice(0, 10);
      
      const sortedBlogs = blogsRes.data.sort((a, b) => 
        ((b.likes_count || 0) + (b.comments_count || 0)) - 
        ((a.likes_count || 0) + (a.comments_count || 0))
      ).slice(0, 5);
      
      setTrendingPosts(sortedPosts);
      setTrendingBlogs(sortedBlogs);
    } catch (error) {
      toast.error('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (item) => {
    try {
      if (item.liked_by_user) {
        await axios.delete(`${API}/likes/${item.type || 'post'}/${item.id}`);
      } else {
        await axios.post(`${API}/likes/${item.type || 'post'}/${item.id}`);
      }
      fetchTrendingContent();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading trending content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Futuristic Header */}
        <div className="relative mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-2xl p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center mr-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Trending Now</h1>
                  <p className="text-slate-200 text-sm sm:text-base">What's happening right now</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-slate-200 text-sm">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live Updates
                </span>
                <span>•</span>
                <span>{trendingPosts.length + trendingBlogs.length} trending items</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Trending Posts */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden">
              {/* Modern Tab Header */}
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Hot Posts</h2>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {trendingPosts.length}
                  </Badge>
                </div>
              </div>
              
              {/* Posts Content */}
              <div className="p-4 space-y-3">
                {trendingPosts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="group relative p-4 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-300 border border-transparent hover:border-slate-200 cursor-pointer hover:shadow-md"
                    onClick={() => window.location.href = `/post/${post.id}`}
                  >
                    {/* Trending Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-600/5 to-slate-700/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative flex items-start gap-3">
                      {/* Enhanced Rank Badge with Trending Icon */}
                      <div className="relative flex-shrink-0">
                        <div className="w-7 h-7 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        {/* Trending Fire Icon */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                          <Flame className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      
                      {/* Enhanced Profile Photo */}
                      <Avatar className="w-9 h-9 ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all duration-300 flex-shrink-0">
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt={post.author_name || post.author_username} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm font-semibold">
                            {(post.author_name || post.author_username)[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {/* Enhanced Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-700 transition-colors">
                            {post.author_name || post.author_username}
                          </span>
                          {post.author_name && (
                            <>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <span className="text-xs text-slate-500">@{post.author_username}</span>
                            </>
                          )}
                          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-slate-500 font-medium">trending</span>
                          </div>
                        </div>
                        
                        {/* Enhanced Content Preview */}
                        <p className="text-sm text-slate-700 line-clamp-2 group-hover:text-slate-600 transition-colors leading-relaxed mb-3 font-medium">
                          {post.content.length > 85 ? post.content.substring(0, 85) + '...' : post.content}
                        </p>
                        
                        {/* Enhanced Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors">
                              <Heart className="w-3.5 h-3.5" />
                              <span className="font-medium">{post.likes_count || 0}</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-500 transition-colors">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="font-medium">{post.comments_count || 0}</span>
                            </span>
                            {post.created_at && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {trendingPosts.length === 0 && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center">
                    <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">No trending posts yet</p>
                    <p className="text-slate-500 text-sm mt-1">Be the first to create viral content!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trending Blogs Sidebar */}
          <div className="space-y-6">
            {/* Blog Section */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden">
              {/* Modern Header */}
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-base font-semibold text-white">Hot Reads</h2>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {trendingBlogs.length}
                  </Badge>
                </div>
              </div>
              
              {/* Blogs Content */}
              <div className="p-4 space-y-3">
                {trendingBlogs.map((blog, index) => (
                  <div key={blog.id} className="group relative">
                    {/* Floating Rank Badge */}
                    <div className="absolute -top-1 -left-1 z-10">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                    </div>
                    
                    {/* Blog Card */}
                    <div 
                      className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer group-hover:transform group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-slate-50 group-hover:to-white" 
                      onClick={() => window.location.href = `/blog/${blog.id}`}
                    >
                      {/* Author Info */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Avatar className="w-6 h-6 ring-2 ring-slate-200">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                            {blog.author_username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-700">{blog.author_username}</span>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span className="text-xs text-slate-500">trending</span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-sm line-clamp-2 mb-3 text-slate-800 group-hover:text-slate-900">{blog.title}</h3>
                      
                      {/* Stats with Modern Design */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="flex items-center bg-red-50 text-red-600 px-2 py-1 rounded-full">
                            <Heart className="w-3 h-3 mr-1" />
                            {blog.likes_count || 0}
                          </span>
                          <span className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {blog.comments_count || 0}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
                {trendingBlogs.length === 0 && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-1">No trending blogs yet</p>
                    <p className="text-xs text-slate-500">Write something amazing!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin
        ? { email, password }
        : { email, password, username };

      const response = await axios.post(`${API}${endpoint}`, data);
      onLogin(response.data.token, response.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-slate-200/30 to-slate-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-slate-300/20 to-slate-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-slate-200/40 to-slate-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow"></div>
      </div>

      {/* Futuristic Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Animated Logo */}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-600 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                  <span className="text-white font-bold text-2xl animate-pulse">P</span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 opacity-20 blur-lg animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  PenLink
                </h1>
                <p className="text-sm text-slate-500 font-medium">Where thoughts meet community</p>
              </div>
            </div>
            
            {/* Live Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">Live Platform</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Enhanced Branding */}
            <div className="hidden lg:block">
              <div className="max-w-lg space-y-8">
                {/* Main Heading */}
                <div className="space-y-4">
                  <h2 className="text-5xl font-bold text-slate-800 leading-tight">
                    Where thoughts meet 
                    <span className="bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
                      community
                    </span>
                  </h2>
                  
                  <p className="text-xl text-slate-600 leading-relaxed">
                    PenLink bridges professional blogging with social connection. Share expertise, engage in conversations, and build meaningful relationships.
                  </p>
                </div>

                {/* Feature Highlights Card */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 shadow-xl">
                  <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    What makes us special?
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Hybrid Platform:</span>
                        <span className="text-slate-600 ml-1">Long-form blogs + quick social posts unified</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Smart Discovery:</span>
                        <span className="text-slate-600 ml-1">AI-powered trending finds the best content</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Creator Focus:</span>
                        <span className="text-slate-600 ml-1">Purpose-built for writers and thought leaders</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Cards */}
                <div className="grid gap-6">
                  <div className="flex items-center space-x-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/30 hover:bg-white/60 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">Rich Blogging</h3>
                      <p className="text-slate-600">Create beautiful posts with advanced formatting</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/30 hover:bg-white/60 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">Social Connection</h3>
                      <p className="text-slate-600">Build meaningful relationships with creators</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/30 hover:bg-white/60 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">Trending Discovery</h3>
                      <p className="text-slate-600">Stay updated with popular conversations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Auth Form */}
            <div className="w-full flex flex-col items-center justify-center">
              {/* Enhanced Mobile Hero Section */}
              <div className="lg:hidden w-full max-w-md mb-8">
                <div className="text-center mb-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-2xl mx-auto mb-4">
                      <span className="text-white font-bold text-2xl">P</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">
                      Where thoughts meet 
                      <span className="bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">community</span>
                    </h2>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Share expertise through blogs, engage in conversations, and connect with creators worldwide.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-slate-200/50 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-800">Rich Blogging</h3>
                    </div>
                    <p className="text-sm text-slate-600">Create beautiful posts with advanced formatting</p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-slate-200/50 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-800">Social Connect</h3>
                    </div>
                    <p className="text-sm text-slate-600">Build meaningful relationships with creators</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Auth Card */}
              <div className="w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-lg shadow-2xl border border-slate-200/50 rounded-3xl overflow-hidden">
                  {/* Card Header with Gradient */}
                  <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 px-8 py-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome back!' : 'Join PenLink'}
                      </h3>
                      <p className="text-slate-200 text-base">
                        {isLogin 
                          ? 'Sign in to continue your journey' 
                          : 'Create your account and start sharing'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Form Content */}
                  <div className="px-8 py-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {!isLogin && (
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-semibold text-slate-700 flex items-center">
                            <User className="w-4 h-4 mr-2 text-slate-600" />
                            Username
                          </Label>
                          <Input
                            id="username"
                            placeholder="Choose your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="h-12 text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white/80 backdrop-blur-sm"
                            data-testid="username-input"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2 text-slate-600" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white/80 backdrop-blur-sm"
                          data-testid="email-input"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center">
                          <div className="w-4 h-4 mr-2 text-slate-600 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-slate-600 rounded-sm"></div>
                          </div>
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a secure password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white/80 backdrop-blur-sm"
                          data-testid="password-input"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-300 transform hover:scale-105 shadow-lg" 
                        disabled={loading} 
                        data-testid="auth-submit-btn"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Please wait...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-200">
                      <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-base text-slate-600 hover:text-slate-800 font-medium hover:underline transition-colors flex items-center justify-center space-x-2 mx-auto"
                        data-testid="toggle-auth-btn"
                      >
                        <span>
                          {isLogin 
                            ? "Don't have an account? Sign up" 
                            : 'Already have an account? Sign in'
                          }
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add custom animations to the global styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

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
