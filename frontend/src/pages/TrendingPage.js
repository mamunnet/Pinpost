import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, TrendingUp, FileText, Flame, Clock, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingItemSkeleton, BlogCardSkeleton } from "@/components/SkeletonLoader";

const API = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api`;

const TrendingPage = ({ user }) => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [trendingBlogs, setTrendingBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrendingContent();
  }, []);

  // Enhanced trending algorithm with time decay
  const calculateTrendingScore = (item) => {
    const likes = item.likes_count || 0;
    const comments = item.comments_count || 0;
    const createdAt = new Date(item.created_at);
    const now = new Date();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    
    // Engagement score: likes worth 1 point, comments worth 2 points
    const engagementScore = likes + (comments * 2);
    
    // Time decay: newer content gets a boost
    // Content loses 10% of score per day
    const timeDecay = Math.max(0.1, 1 - (hoursSinceCreation / 240)); // 240 hours = 10 days
    
    return engagementScore * timeDecay;
  };

  const fetchTrendingContent = async () => {
    try {
      setError(null);
      
      // Fetch all posts and blogs
      const [postsRes, blogsRes] = await Promise.all([
        axios.get(`${API}/posts`),
        axios.get(`${API}/blogs`)
      ]);
      
      // Filter out posts/blogs with no engagement
      const activePosts = postsRes.data.filter(p => 
        (p.likes_count || 0) + (p.comments_count || 0) > 0
      );
      
      const activeBlogs = blogsRes.data.filter(b => 
        (b.likes_count || 0) + (b.comments_count || 0) > 0
      );
      
      // Sort by trending score
      const sortedPosts = activePosts
        .map(post => ({ ...post, trendingScore: calculateTrendingScore(post) }))
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 10);
      
      const sortedBlogs = activeBlogs
        .map(blog => ({ ...blog, trendingScore: calculateTrendingScore(blog) }))
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 5);
      
      setTrendingPosts(sortedPosts);
      setTrendingBlogs(sortedBlogs);
    } catch (error) {
      console.error('Error fetching trending content:', error);
      setError('Failed to load trending content. Please try again.');
      toast.error('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (item, type) => {
    if (!user) {
      toast.error('Please login to like content');
      return;
    }
    
    try {
      const endpoint = type === 'blog' ? 'blog' : 'post';
      
      if (item.liked_by_user) {
        await axios.delete(`${API}/likes/${endpoint}/${item.id}`);
        toast.success('Like removed');
      } else {
        await axios.post(`${API}/likes/${endpoint}/${item.id}`);
        toast.success('❤️ Liked!');
      }
      
      // Refresh trending content
      fetchTrendingContent();
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like. Please try again.');
    }
  };
  
  // Format engagement score for display
  const formatEngagementScore = (score) => {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
    return Math.round(score).toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 sm:pt-28 pb-6 sm:pb-12">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Futuristic Header */}
        <div className="relative mb-4 sm:mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-4">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1">Trending Now</h1>
                  <p className="text-slate-200 text-xs sm:text-sm">What's happening now</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 text-slate-200 text-xs sm:text-sm">
                <span className="flex items-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1 sm:mr-2 animate-pulse"></div>
                  Live Updates
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{trendingPosts.length + trendingBlogs.length} items</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Trending Posts */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 overflow-hidden">
              {/* Modern Tab Header */}
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-white">Hot Posts</h2>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                    {trendingPosts.length}
                  </Badge>
                </div>
              </div>
              
              {/* Posts Content */}
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {loading ? (
                  <>
                    <TrendingItemSkeleton />
                    <TrendingItemSkeleton />
                    <TrendingItemSkeleton />
                    <TrendingItemSkeleton />
                  </>
                ) : (
                  <>
                    {trendingPosts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="group relative p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-300 border border-transparent hover:border-slate-200 cursor-pointer hover:shadow-md"
                    onClick={() => window.location.href = `/post/${post.id}`}
                  >
                    {/* Trending Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-600/5 to-slate-700/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative flex items-start gap-2 sm:gap-3">
                      {/* Enhanced Rank Badge with Trending Icon */}
                      <div className="relative flex-shrink-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        {/* Trending Fire Icon */}
                        <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                          <Flame className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                        </div>
                      </div>
                      
                      {/* Enhanced Profile Photo */}
                      <Avatar className="w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all duration-300 flex-shrink-0">
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
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-slate-700 transition-colors truncate">
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
                        <p className="text-xs sm:text-sm text-slate-700 line-clamp-2 group-hover:text-slate-600 transition-colors leading-relaxed mb-2 sm:mb-3 font-medium">
                          {post.content.length > 85 ? post.content.substring(0, 85) + '...' : post.content}
                        </p>
                        
                        {/* Enhanced Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(post, 'post');
                              }}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
                                post.liked_by_user 
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                  : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${post.liked_by_user ? 'fill-current' : ''}`} />
                              <span className="font-medium">{post.likes_count || 0}</span>
                            </button>
                            <span className="flex items-center gap-1 text-xs text-slate-500 px-2 py-1">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="font-medium">{post.comments_count || 0}</span>
                            </span>
                            {post.trendingScore && (
                              <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-semibold">
                                <Flame className="w-3 h-3" />
                                {formatEngagementScore(post.trendingScore)}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && trendingPosts.length === 0 && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-lg sm:rounded-xl p-6 sm:p-8 md:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <p className="text-slate-800 font-bold text-base sm:text-lg mb-2">No trending posts yet</p>
                    <p className="text-slate-600 text-sm sm:text-base">Posts with engagement will appear here</p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-2">Like and comment to boost content!</p>
                  </div>
                )}
                {error && !loading && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl p-6 text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                    <button
                      onClick={fetchTrendingContent}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Trending Blogs Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Blog Section */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 overflow-hidden">
              {/* Modern Header */}
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold text-white">Hot Reads</h2>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {trendingBlogs.length}
                  </Badge>
                </div>
              </div>
              
              {/* Blogs Content */}
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                {loading ? (
                  <>
                    <BlogCardSkeleton />
                    <BlogCardSkeleton />
                  </>
                ) : (
                  <>
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
                      className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer group-hover:transform group-hover:scale-105 group-hover:bg-gradient-to-br group-hover:from-slate-50 group-hover:to-white" 
                      onClick={() => window.location.href = `/blog/${blog.id}`}
                    >
                      {/* Author Info */}
                      <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
                        <Avatar className="w-5 h-5 sm:w-6 sm:h-6 ring-2 ring-slate-200">
                          <AvatarFallback className="text-xs bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                            {blog.author_username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs sm:text-sm font-medium text-slate-700 truncate">{blog.author_username}</span>
                        <div className="w-1 h-1 bg-slate-400 rounded-full flex-shrink-0"></div>
                        <span className="text-xs text-slate-500 flex-shrink-0">trending</span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3 text-slate-800 group-hover:text-slate-900">{blog.title}</h3>
                      
                      {/* Stats with Modern Design */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(blog, 'blog');
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
                              blog.liked_by_user 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${blog.liked_by_user ? 'fill-current' : ''}`} />
                            {blog.likes_count || 0}
                          </button>
                          <span className="flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {blog.comments_count || 0}
                          </span>
                          {blog.trendingScore && (
                            <span className="flex items-center bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-semibold">
                              <Flame className="w-3 h-3 mr-1" />
                              {formatEngagementScore(blog.trendingScore)}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && trendingBlogs.length === 0 && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-slate-800 mb-1">No trending blogs yet</p>
                    <p className="text-xs sm:text-sm text-slate-600">Blogs with engagement will appear here</p>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingPage;