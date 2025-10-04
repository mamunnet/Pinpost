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
import { Heart, MessageCircle, Share2, Bookmark, Edit, Trash2, Plus, Home, FileText, User, LogOut, Search } from "lucide-react";
import { SocialPage } from "@/pages/SocialPage";

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

  return children({ user, token, login, logout, loading });
};

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CreateContentModal = () => {
  const [contentType, setContentType] = useState('post');
  const [postContent, setPostContent] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error('Please write something');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/posts`, { content: postContent });
      toast.success('Post created!');
      setPostContent('');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/blogs`, {
        title: blogTitle,
        content: blogContent,
        excerpt: blogExcerpt,
        tags: blogTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Blog published!');
      setBlogTitle('');
      setBlogContent('');
      setBlogExcerpt('');
      setBlogTags('');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={contentType} onValueChange={setContentType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="post" data-testid="tab-post">Quick Post</TabsTrigger>
          <TabsTrigger value="blog" data-testid="tab-blog">Blog Article</TabsTrigger>
        </TabsList>

        <TabsContent value="post" className="space-y-4 mt-6">
          <Textarea
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={4}
            className="resize-none"
            data-testid="post-content-input"
          />
          <Button onClick={handleCreatePost} disabled={loading} className="w-full" data-testid="publish-post-btn">
            Post
          </Button>
        </TabsContent>

        <TabsContent value="blog" className="space-y-4 mt-6">
          <div>
            <Label>Title</Label>
            <Input
              placeholder="Enter blog title"
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              data-testid="blog-title-input"
            />
          </div>
          <div>
            <Label>Excerpt (Optional)</Label>
            <Input
              placeholder="Brief description"
              value={blogExcerpt}
              onChange={(e) => setBlogExcerpt(e.target.value)}
              data-testid="blog-excerpt-input"
            />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea
              placeholder="Write your blog content..."
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              rows={10}
              className="resize-none"
              data-testid="blog-content-input"
            />
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <Input
              placeholder="tech, design, productivity"
              value={blogTags}
              onChange={(e) => setBlogTags(e.target.value)}
              data-testid="blog-tags-input"
            />
          </div>
          <Button onClick={handleCreateBlog} disabled={loading} className="w-full" data-testid="publish-blog-btn">
            Publish Blog
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PostCard = ({ post, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid="post-card">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <Link to={`/profile/${post.author_username}`}>
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white">
                {post.author_username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${post.author_username}`} className="font-semibold hover:underline">
                {post.author_username}
              </Link>
              <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
            </div>
            <p className="mt-2 text-gray-800 whitespace-pre-wrap">{post.content}</p>

            <div className="flex items-center space-x-6 mt-4">
              <button
                onClick={onLike}
                className={`flex items-center space-x-2 ${post.liked_by_user ? 'text-rose-600' : 'text-gray-600 hover:text-rose-600'} transition-colors`}
                data-testid="like-post-btn"
              >
                <Heart className={`w-5 h-5 ${post.liked_by_user ? 'fill-current' : ''}`} />
                <span className="text-sm">{post.likes_count}</span>
              </button>
              <button
                onClick={fetchComments}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                data-testid="comment-post-btn"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.comments_count}</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {showComments && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    data-testid="comment-input"
                  />
                  <Button onClick={handleComment} size="sm" data-testid="submit-comment-btn">Post</Button>
                </div>
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8">
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
          </div>
        </div>
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
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-rose-500 text-white text-xs">
                {blog.author_username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{blog.author_username}</p>
              <p className="text-xs text-gray-500">{formatDate(blog.created_at)}</p>
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
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-rose-500 text-white">
                {blog.author_username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <p className="font-semibold">{blog.author_username}</p>
            <p className="text-sm text-gray-500">{formatDate(blog.created_at)}</p>
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
  const [trendingUsers, setTrendingUsers] = useState([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const response = await axios.get(`${API}/users/trending?limit=5`);
      setTrendingUsers(response.data);
    } catch (error) {
      console.error('Failed to load trending');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trending Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trendingUsers.map((trendingUser) => (
          <div key={trendingUser.id} className="flex items-center justify-between">
            <Link to={`/profile/${trendingUser.username}`} className="flex items-center space-x-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {trendingUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{trendingUser.username}</p>
                <p className="text-xs text-gray-500">{trendingUser.followers_count} followers</p>
              </div>
            </Link>
            {!trendingUser.is_following && (
              <Button size="sm" variant="outline" onClick={() => handleFollow(trendingUser.id)}>
                Follow
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const HomePage = ({ user }) => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Welcome to PenLink
              </h1>
              <p className="text-gray-600">Where thoughts meet community</p>
            </div>

            {feed.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-600 mb-4">No content yet. Be the first to create!</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button data-testid="start-creating-btn">
                        <Plus className="w-4 h-4 mr-2" />
                        Start Creating
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Content</DialogTitle>
                      </DialogHeader>
                      <CreateContentModal />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              feed.map((item) => (
                <div key={`${item.type}-${item.id}`}>
                  {item.type === 'blog' ? (
                    <BlogCard blog={item} onLike={() => handleLike(item)} />
                  ) : (
                    <PostCard post={item} onLike={() => handleLike(item)} onComment={fetchFeed} />
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Blog Articles</h1>
          <p className="text-gray-600">Discover thoughtful long-form content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} onLike={() => handleLike(blog)} compact />
          ))}
        </div>
      </div>
    </div>
  );
};

const BlogDetailPage = ({ user }) => {
  const { blogId } = useParams();
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
    <div className="min-h-screen bg-white pt-20 pb-12">
      <article className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Link to={`/profile/${blog.author_username}`}>
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white">
                  {blog.author_username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${blog.author_username}`} className="font-semibold hover:underline">
                {blog.author_username}
              </Link>
              <p className="text-sm text-gray-500">
                {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-4 leading-tight">{blog.title}</h1>
          
          <div className="flex space-x-2 mb-6">
            {blog.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>

          {blog.cover_image && (
            <img src={blog.cover_image} alt={blog.title} className="w-full h-96 object-cover rounded-lg mb-6" />
          )}
        </div>

        <div className="prose prose-lg max-w-none mb-12" data-testid="blog-content">
          <div className="whitespace-pre-wrap leading-relaxed">{blog.content}</div>
        </div>

        <div className="border-t border-b py-4 mb-8">
          <div className="flex items-center space-x-8">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${blog.liked_by_user ? 'text-rose-600' : 'text-gray-600 hover:text-rose-600'} transition-colors`}
              data-testid="like-blog-detail-btn"
            >
              <Heart className={`w-6 h-6 ${blog.liked_by_user ? 'fill-current' : ''}`} />
              <span className="font-semibold">{blog.likes_count}</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-600">
              <MessageCircle className="w-6 h-6" />
              <span className="font-semibold">{blog.comments_count}</span>
            </div>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Comments</h2>
          
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

const EditProfileModal = ({ user, onUpdate }) => {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(`${API}/users/profile`, { username, bio });
      toast.success('Profile updated!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Username</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
      </div>
      <Button onClick={handleUpdate} disabled={loading} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

const ProfilePage = ({ currentUser }) => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('blogs');

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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">User not found</div>;
  }

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-gradient-to-br from-rose-500 via-amber-500 to-teal-500 text-white text-3xl">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{user.username}</h1>
                  <p className="text-gray-600 mt-1">{user.bio || 'No bio yet'}</p>
                  <div className="flex space-x-6 mt-3 text-sm">
                    <div>
                      <span className="font-bold">{user.followers_count}</span>
                      <span className="text-gray-600 ml-1">Followers</span>
                    </div>
                    <div>
                      <span className="font-bold">{user.following_count}</span>
                      <span className="text-gray-600 ml-1">Following</span>
                    </div>
                  </div>
                </div>
              </div>
              {isOwnProfile ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="edit-profile-btn">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <EditProfileModal user={user} onUpdate={fetchProfile} />
                  </DialogContent>
                </Dialog>
              ) : currentUser && (
                <Button
                  onClick={handleFollow}
                  variant={user.is_following ? "outline" : "default"}
                  data-testid="follow-btn"
                >
                  {user.is_following ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="blogs" data-testid="profile-blogs-tab">Blogs ({blogs.length})</TabsTrigger>
            <TabsTrigger value="posts" data-testid="profile-posts-tab">Posts ({posts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="blogs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} onLike={() => {}} compact />
              ))}
            </div>
            {blogs.length === 0 && (
              <Card>
                <CardContent className="text-center py-12 text-gray-600">
                  No blogs yet
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="posts">
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onLike={() => {}} />
              ))}
            </div>
            {posts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12 text-gray-600">
                  No posts yet
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-amber-50 to-teal-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-2">
            PenLink
          </CardTitle>
          <CardDescription className="text-base">
            {isLogin ? 'Welcome back!' : 'Join our community'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="username-input"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="auth-submit-btn">
              {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-rose-600 hover:underline"
              data-testid="toggle-auth-btn"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <AuthContext>
        {({ user, token, login, logout, loading }) => {
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

          return (
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Header user={user} logout={logout} />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage user={user} />} />
                    <Route path="/social" element={<SocialPage user={user} />} />
                    <Route path="/blogs" element={<BlogsPage user={user} />} />
                    <Route path="/blog/:blogId" element={<BlogDetailPage user={user} />} />
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
