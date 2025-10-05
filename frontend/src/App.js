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
import { Heart, MessageCircle, Share2, Bookmark, Edit, Trash2, Plus, Home, FileText, User, LogOut, Search, Users, TrendingUp, Camera, MapPin, Calendar, Flame, Sparkles, Clock, ArrowLeft } from "lucide-react";
import { EnhancedPostModal } from "@/components/EnhancedPostModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stories } from "@/components/Stories";
import { ProfileSetup } from "@/components/ProfileSetup";
import { EditProfileModal } from "@/components/EditProfileModal";
import { EditCoverPhotoModal } from "@/components/EditCoverPhotoModal";
import { EditAvatarModal } from "@/components/EditAvatarModal";
import { PostDetailPage } from "@/pages/PostDetailPage";

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading social feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl mx-auto space-y-6">
            {/* Header with Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20 z-10 border-0">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Social Feed
                </h1>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search posts, people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-0 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={`flex-1 ${filter === 'all' ? 'bg-gradient-to-r from-blue-600 to-teal-600' : ''}`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  All Posts
                </Button>
                <Button
                  variant={filter === 'following' ? 'default' : 'outline'}
                  onClick={() => setFilter('following')}
                  className={`flex-1 ${filter === 'following' ? 'bg-gradient-to-r from-blue-600 to-teal-600' : ''}`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Following
                </Button>
                <Button
                  variant={filter === 'trending' ? 'default' : 'outline'}
                  onClick={() => setFilter('trending')}
                  className={`flex-1 ${filter === 'trending' ? 'bg-gradient-to-r from-blue-600 to-teal-600' : ''}`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </Button>
              </div>
            </div>

            {/* Posts List */}
            {filteredPosts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {searchQuery ? 'No posts found' : 'No posts yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? 'Try a different search query'
                      : filter === 'following' 
                        ? 'Follow some people to see their posts here'
                        : 'Be the first to create a post!'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-blue-600 to-teal-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {filteredPosts.map((post, index) => (
                  <div key={post.id}>
                    <PostCard post={post} user={user} onLike={() => handleLike(post)} onComment={() => fetchPosts(true)} />
                    {/* Insert ad every 4 posts */}
                    {(index + 1) % 4 === 0 && index < filteredPosts.length - 1 && (
                      <AdCard adIndex={Math.floor(index / 4)} />
                    )}
                  </div>
                ))}

                {/* Load More Button */}
                {hasMore && !searchQuery && (
                  <div className="text-center py-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      variant="outline"
                      className="px-8"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Posts
                          <span className="ml-2">↓</span>
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
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm" data-testid="post-card">
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author_username}`} className="group">
            <Avatar className="w-12 h-12 ring-2 ring-gray-100 group-hover:ring-rose-200 transition-all">
              {post.author_avatar ? (
                <img src={post.author_avatar} alt={post.author_name || post.author_username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                  {(post.author_name || post.author_username)[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${post.author_username}`} className="block hover:underline">
              <p className="font-semibold text-gray-900 text-base truncate">
                {post.author_name || post.author_username}
              </p>
              <p className="text-sm text-gray-500 truncate">@{post.author_username}</p>
            </Link>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(post.created_at)}</p>
          </div>
        </div>

        {/* Content - Clickable to navigate to post detail */}
        <div 
          onClick={() => navigate(`/post/${post.id}`)}
          className="cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
        >
          {displayContent.trim() && (
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-[15px]">{displayContent}</p>
          )}

          {/* Image */}
          {postImage && (
            <div className="rounded-lg overflow-hidden mt-3">
              <img src={postImage} alt="Post" className="w-full max-h-96 object-cover" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <div className="relative">
              <button
                onClick={onLike}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${post.liked_by_user ? 'text-rose-600 bg-rose-50' : 'text-gray-600 hover:bg-gray-50'} transition-all group`}
                data-testid="like-post-btn"
              >
                <Heart className={`w-5 h-5 ${post.liked_by_user ? 'fill-current' : ''} group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-semibold">{post.likes_count > 0 && post.likes_count}</span>
              </button>
              
              {/* Reaction Picker */}
              {showReactions && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-xl border border-gray-200 px-3 py-2 flex space-x-1 z-10"
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
                      className="text-xl hover:scale-125 transition-transform p-1.5 hover:bg-gray-50 rounded-full"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={fetchComments}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-all group"
              data-testid="comment-post-btn"
            >
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">{post.comments_count > 0 && post.comments_count}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-all group">
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                className="flex-1"
                data-testid="comment-input"
              />
              <Button onClick={handleComment} size="sm" className="hover:scale-105 transition-transform" data-testid="submit-comment-btn">Post</Button>
            </div>
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Avatar className="w-8 h-8 ring-2 ring-white">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {comment.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-gray-50 rounded-lg p-2">
                  <p className="text-sm font-semibold">{comment.username}</p>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
      <Card className="sticky top-24 shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full blur-3xl opacity-50"></div>
        
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Trending Now
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          {/* Tab Selector */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'posts' 
                  ? 'bg-white shadow-md text-rose-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
              Posts
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'blogs' 
                  ? 'bg-white shadow-md text-amber-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Blogs
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'users' 
                  ? 'bg-white shadow-md text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" />
              People
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Trending Posts */}
              {activeTab === 'posts' && (
                <div className="space-y-3">
                  {trendingPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No trending posts yet</p>
                    </div>
                  ) : (
                    trendingPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="group p-3 rounded-xl hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 transition-all border border-transparent hover:border-rose-200"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p 
                              onClick={() => navigate(`/post/${post.id}`)}
                              className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors leading-relaxed cursor-pointer"
                            >
                              {post.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span 
                                onClick={() => navigate(`/profile/${post.author_username}`)}
                                className="text-xs text-gray-500 hover:text-rose-600 hover:underline cursor-pointer"
                              >
                                @{post.author_username}
                              </span>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(post.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-xs font-semibold text-gray-700">{post.likes_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-semibold text-gray-700">{post.comments_count || 0}</span>
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
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No trending blogs yet</p>
                    </div>
                  ) : (
                    trendingBlogs.map((blog, index) => (
                      <div
                        key={blog.id}
                        className="group p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all border border-transparent hover:border-amber-200"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 
                              onClick={() => navigate(`/blog/${blog.id}`)}
                              className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors leading-snug mb-1 cursor-pointer"
                            >
                              {blog.title}
                            </h4>
                            <p 
                              onClick={() => navigate(`/blog/${blog.id}`)}
                              className="text-xs text-gray-600 line-clamp-1 mb-2 cursor-pointer"
                            >
                              {blog.excerpt}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/profile/${blog.author_username}`);
                                }}
                                className="text-xs text-gray-500 hover:text-amber-600 hover:underline cursor-pointer"
                              >
                                @{blog.author_username}
                              </span>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(blog.created_at)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {blog.tags && blog.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs py-0 px-2 bg-amber-100 text-amber-700 border-0">
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
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No trending users yet</p>
                    </div>
                  ) : (
                    trendingUsers.map((trendingUser) => (
                      <div key={trendingUser.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all group border border-transparent hover:border-blue-200">
                        <Link to={`/profile/${trendingUser.username}`} className="flex items-center space-x-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all">
                            {trendingUser.avatar ? (
                              <img src={trendingUser.avatar} alt={trendingUser.username} className="w-full h-full object-cover" />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-semibold">
                                {trendingUser.username[0].toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate group-hover:text-blue-600 transition-colors">{trendingUser.name || trendingUser.username}</p>
                            <p className="text-xs text-gray-500 truncate">@{trendingUser.username}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {trendingUser.followers_count || 0} followers
                            </p>
                          </div>
                        </Link>
                        {!trendingUser.is_following && trendingUser.id !== user.id && (
                          <Button 
                            size="sm" 
                            onClick={() => handleFollow(trendingUser.id)}
                            className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs h-7 px-3 shadow-md"
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialTab, setInitialTab] = useState('post');

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await axios.get(`${API}/feed`);
      setFeed(response.data);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (item) => {
    try {
      if (item.liked_by_user) {
        await axios.delete(`${API}/likes/${item.type}/${item.id}`);
      } else {
        await axios.post(`${API}/likes/${item.type}/${item.id}`);
      }
      fetchFeed();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stories Section */}
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <Stories user={user} />
              </CardContent>
            </Card>

            {/* Create Post Box - Facebook Style */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10 ring-2 ring-gray-100">
                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white">
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => {
                      setInitialTab('post');
                      setShowCreateModal(true);
                    }}
                    className="flex-1 text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-all duration-200 hover:shadow-sm"
                    data-testid="whats-on-mind-btn"
                  >
                    What's on your mind, {user.username}?
                  </button>
                </div>
                <div className="flex items-center justify-around mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setInitialTab('blog');
                      setShowCreateModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-rose-50 rounded-lg transition-all group flex-1 justify-center"
                  >
                    <FileText className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-gray-700 group-hover:text-rose-600 hidden sm:inline transition-colors">Blog Article</span>
                  </button>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <button
                    onClick={() => {
                      setInitialTab('post');
                      setShowCreateModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all group flex-1 justify-center"
                  >
                    <MessageCircle className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-gray-700 group-hover:text-blue-600 hidden sm:inline transition-colors">Quick Post</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Create Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <EnhancedPostModal onClose={() => setShowCreateModal(false)} currentUser={user} initialTab={initialTab} />
              </DialogContent>
            </Dialog>

            {/* Feed Content */}
            {feed.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-600">No posts yet. Share something with your network!</p>
                </CardContent>
              </Card>
            ) : (
              feed.map((item, index) => (
                <div key={`${item.type}-${item.id}`}>
                  {item.type === 'blog' ? (
                    <BlogCard blog={item} onLike={() => handleLike(item)} />
                  ) : (
                    <PostCard post={item} onLike={() => handleLike(item)} onComment={fetchFeed} />
                  )}
                  {/* Insert ad every 3 posts */}
                  {(index + 1) % 3 === 0 && index < feed.length - 1 && (
                    <AdCard key={`ad-${index}`} adIndex={Math.floor(index / 3)} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Blog Articles</h1>
          <p className="text-gray-600">Discover thoughtful long-form content</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog, index) => (
              <div key={blog.id}>
                <BlogCard blog={blog} onLike={() => handleLike(blog)} compact />
                {/* Insert ad every 6 blogs */}
                {(index + 1) % 6 === 0 && index < blogs.length - 1 && (
                  <div className="md:col-span-2 mt-6">
                    <AdCard adIndex={Math.floor(index / 6)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!blog) {
    return <div className="min-h-screen flex items-center justify-center">Blog not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50 pt-24 pb-12">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Link to={`/profile/${blog.author_username}`}>
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white">
                  {blog.author_username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${blog.author_username}`} className="font-semibold text-base sm:text-lg hover:underline">
                {blog.author_username}
              </Link>
              <p className="text-xs sm:text-sm text-gray-500">
                {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gray-900" style={{fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"}}>
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs sm:text-sm">{tag}</Badge>
            ))}
          </div>

          {blog.cover_image && (
            <img src={blog.cover_image} alt={blog.title} className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover rounded-xl shadow-lg mb-6" />
          )}
        </div>

        <div className="mb-12">
          <div 
            className="text-gray-800 text-base sm:text-lg leading-relaxed sm:leading-loose whitespace-pre-wrap break-words" 
            style={{
              fontFamily: "'Georgia', 'Charter', 'Iowan Old Style', 'Times New Roman', serif",
              fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
              lineHeight: '1.75',
              letterSpacing: '0.01em'
            }}
            data-testid="blog-content"
          >
            {blog.content}
          </div>
        </div>

        <div className="border-t border-b py-4 sm:py-6 mb-8 bg-white/50 backdrop-blur-sm rounded-lg px-4">
          <div className="flex items-center justify-around sm:justify-start sm:space-x-12">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${blog.liked_by_user ? 'text-rose-600' : 'text-gray-600 hover:text-rose-600'} transition-colors`}
              data-testid="like-blog-detail-btn"
            >
              <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${blog.liked_by_user ? 'fill-current' : ''}`} />
              <span className="font-semibold text-sm sm:text-base">{blog.likes_count}</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-600">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-semibold text-sm sm:text-base">{blog.comments_count}</span>
            </div>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900" style={{fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"}}>
            Comments
          </h2>
          
          {user && (
            <div className="flex space-x-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                  data-testid="blog-comment-input"
                />
                <Button onClick={handleComment} className="mt-2" data-testid="blog-comment-submit-btn">
                  Post Comment
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 bg-gray-50 p-4 rounded-lg">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {comment.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{comment.username}</p>
                  <p className="text-sm text-gray-500 mb-1">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trending content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Trending</h1>
          <p className="text-gray-600">Discover the most popular content on PenLink</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trending Posts */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <MessageCircle className="w-6 h-6 mr-2 text-purple-600" />
                Trending Posts
              </h2>
              <div className="space-y-4">
                {trendingPosts.map((post, index) => (
                  <Card key={post.id} className="relative">
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="pt-12">
                      <PostCard post={post} onLike={() => handleLike({ ...post, type: 'post' })} onComment={fetchTrendingContent} />
                    </div>
                  </Card>
                ))}
                {trendingPosts.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12 text-gray-600">
                      No trending posts yet
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Trending Blogs Sidebar */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-pink-600" />
                Trending Blogs
              </h2>
              <div className="space-y-4">
                {trendingBlogs.map((blog, index) => (
                  <Card key={blog.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => window.location.href = `/blog/${blog.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                            {blog.author_username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-600">{blog.author_username}</span>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{blog.title}</h3>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {blog.likes_count || 0}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {blog.comments_count || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {trendingBlogs.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-gray-600">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No trending blogs yet</p>
                    </CardContent>
                  </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                PenLink
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-8 sm:py-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-rose-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-2000"></div>

        <div className="relative w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Branding & Information */}
            <div className="hidden lg:block">
              <div className="max-w-lg">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  Where thoughts meet community
                </h2>
                
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  PenLink bridges the gap between professional blogging and social connection. Share your expertise through in-depth articles, engage in quick conversations, and build meaningful relationships with creators worldwide.
                </p>

                <div className="bg-white/60 rounded-2xl p-6 mb-8 border border-gray-100 shadow-lg">
                  <h3 className="font-bold text-gray-800 text-lg mb-3">🚀 What makes PenLink special?</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>Hybrid Platform:</strong> Long-form blogs + quick social posts in one place</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span><strong>Smart Discovery:</strong> AI-powered trending algorithm finds the best content</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-teal-500 font-bold">•</span>
                      <span><strong>Creator Focus:</strong> Tools designed for writers, bloggers, and thought leaders</span>
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Rich Blogging</h3>
                      <p className="text-gray-600">Create beautiful blog posts with rich formatting and engage your audience</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Social Connection</h3>
                      <p className="text-gray-600">Follow writers, share quick thoughts, and build meaningful connections</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">Trending Content</h3>
                      <p className="text-gray-600">Discover what's popular and stay updated with the latest conversations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full flex flex-col items-center justify-center">
              {/* Mobile Hero Section */}
              <div className="lg:hidden w-full max-w-md mb-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
                    Where thoughts meet community
                  </h2>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Share your expertise through blogs, engage in conversations, and connect with creators worldwide.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/60 rounded-xl p-4 border border-gray-100 shadow-md">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Rich Blogging</h3>
                    </div>
                    <p className="text-sm text-gray-600">Create beautiful posts with rich formatting</p>
                  </div>

                  <div className="bg-white/60 rounded-xl p-4 border border-gray-100 shadow-md">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Social Connect</h3>
                    </div>
                    <p className="text-sm text-gray-600">Follow writers and build connections</p>
                  </div>
                </div>
              </div>

              <Card className="w-full max-w-md shadow-2xl border-0 bg-white backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    {isLogin ? 'Welcome back!' : 'Join PenLink'}
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg text-gray-600">
                    {isLogin 
                      ? 'Sign in to continue your journey' 
                      : 'Create your account and start sharing your thoughts'
                    }
                  </CardDescription>
                </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-12 text-base"
                      data-testid="username-input"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-base"
                    data-testid="email-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base"
                    data-testid="password-input"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 transition-all duration-200 transform hover:scale-105" 
                  disabled={loading} 
                  data-testid="auth-submit-btn"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Please wait...</span>
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-base text-rose-600 hover:text-rose-700 font-medium hover:underline transition-colors"
                  data-testid="toggle-auth-btn"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : 'Already have an account? Sign in'
                  }
                </button>
              </div>

              {!isLogin && (
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  By creating an account, you agree to our Terms of Service and Privacy Policy. 
                  Join thousands of writers sharing their stories on PenLink.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mobile Features Section */}
          <div className="lg:hidden w-full max-w-md mt-8">
            <div className="bg-white/60 rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">
                🚀 Why creators love PenLink
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start space-x-3">
                  <span className="text-rose-500 font-bold text-xl flex-shrink-0">•</span>
                  <span className="text-sm"><strong>Hybrid Platform:</strong> Long-form blogs + quick social posts</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-amber-500 font-bold text-xl flex-shrink-0">•</span>
                  <span className="text-sm"><strong>Smart Discovery:</strong> AI-powered trending algorithm</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-teal-500 font-bold text-xl flex-shrink-0">•</span>
                  <span className="text-sm"><strong>Creator Focus:</strong> Tools for writers & thought leaders</span>
                </li>
              </ul>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
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
