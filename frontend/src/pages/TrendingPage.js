import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Heart, MessageCircle, TrendingUp, FileText, Flame, Clock, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api`;

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

export default TrendingPage;