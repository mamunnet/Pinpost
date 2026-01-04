import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, MessageCircle, Calendar, ArrowLeft, Share2, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BlogDetailSkeleton } from "@/components/SkeletonLoader";
import { getUserAvatarUrl } from "@/utils/imageUtils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const BlogDetailPage = ({ user }) => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('BlogDetailPage mounted with blogId:', blogId);
    console.log('URL params:', { blogId });
    fetchBlog();
    fetchComments();
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const response = await axios.get(`${API}/blogs/${blogId}`);
      setBlog(response.data);
    } catch (error) {
      console.error('Failed to load blog:', error);
      console.error('Blog ID:', blogId);
      console.error('API URL:', `${API}/blogs/${blogId}`);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      toast.error('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/blog/${blogId}/comments`);
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
      await axios.post(`${API}/blog/${blogId}/comments`, { content: commentContent });
      setCommentContent('');
      fetchComments();
      fetchBlog();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      fetchBlog(); // Refresh blog to update comment count
      toast.success('🗑️ Comment deleted successfully!', {
        description: 'Your comment has been removed.',
        duration: 3000
      });
    } catch (error) {
      toast.error('❌ Failed to delete comment', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <BlogDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Article not found</h3>
          <p className="text-slate-600 mb-2">This article may have been removed or doesn't exist.</p>
          <p className="text-sm text-slate-500">Blog ID: {blogId}</p>
          <p className="text-sm text-slate-500">Check the browser console for more details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-28 sm:pt-32 pb-6 sm:pb-12">
      <article className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Enhanced Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-8 mt-1 sm:mt-2 hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-all duration-300 group text-sm sm:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Articles
        </Button>

        {/* Enhanced Article Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
          {/* Article Header */}
          <div className="p-4 sm:p-8 lg:p-12">
            <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-8">
              <Link to={`/profile/${blog.author_username}`}>
                <Avatar className="w-10 h-10 sm:w-14 sm:h-14 ring-2 sm:ring-4 ring-slate-200 hover:ring-slate-300 transition-all">
                  {blog.author_avatar ? (
                    <img
                      src={blog.author_avatar}
                      alt={blog.author_name || blog.author_username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm sm:text-lg font-bold">
                      {(blog.author_name || blog.author_username)[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
              <div>
                <Link to={`/profile/${blog.author_username}`} className="font-bold text-sm sm:text-lg text-slate-800 hover:text-slate-600 hover:underline transition-colors">
                  {blog.author_name || blog.author_username}
                </Link>
                <p className="text-xs sm:text-sm text-slate-500 flex items-center">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-6 leading-tight text-slate-900" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }}>
              {blog.title}
            </h1>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-8">
              {blog.tags.map((tag) => (
                <Badge key={tag} className="bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border-0 px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                  {tag}
                </Badge>
              ))}
            </div>

            {blog.cover_image && (
              <div className="relative mb-4 sm:mb-8 rounded-xl sm:rounded-2xl overflow-hidden group">
                <img
                  src={blog.cover_image}
                  alt={blog.title}
                  className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
          </div>

          {/* Enhanced Article Content */}
          <div className="px-4 sm:px-8 lg:px-12 pb-4 sm:pb-8">
            <div
              className="text-slate-800 text-sm sm:text-base lg:text-lg leading-relaxed sm:leading-loose whitespace-pre-wrap break-words"
              style={{
                fontFamily: "'Georgia', 'Charter', 'Iowan Old Style', 'Times New Roman', serif",
                fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                lineHeight: '1.7',
                letterSpacing: '0.01em'
              }}
              data-testid="blog-content"
            >
              {blog.content}
            </div>
          </div>

          {/* Enhanced Interaction Bar */}
          <div className="border-t border-slate-200 bg-slate-50/50 px-4 sm:px-8 lg:px-12 py-3 sm:py-6">
            <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-8">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1.5 sm:space-x-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 ${blog.liked_by_user
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                data-testid="like-blog-detail-btn"
              >
                <Heart className={`w-4 h-4 sm:w-6 sm:h-6 ${blog.liked_by_user ? 'fill-current' : ''}`} />
                <span className="font-semibold text-sm sm:text-base">{blog.likes_count}</span>
              </button>

              <div className="flex items-center space-x-1.5 sm:space-x-3 px-2 sm:px-4 py-1.5 sm:py-2 text-slate-600">
                <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="font-semibold text-sm sm:text-base">{blog.comments_count}</span>
              </div>

              <button className="flex items-center space-x-1.5 sm:space-x-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-105">
                <Share2 className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="font-semibold text-sm sm:text-base hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Comments Section */}
        <div className="mt-6 sm:mt-12 space-y-4 sm:space-y-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200/50 p-4 sm:p-8">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-slate-600" />
              Comments
            </h2>

            {user && (
              <div className="mb-4 sm:mb-8 p-3 sm:p-6 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
                <div className="flex space-x-2 sm:space-x-4">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-slate-200">
                    {getUserAvatarUrl(user) ? (
                      <img src={getUserAvatarUrl(user)} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold text-xs sm:text-base">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      rows={3}
                      className="border-slate-300 focus:border-slate-500 focus:ring-slate-500/20 bg-white text-sm sm:text-base"
                      data-testid="blog-comment-input"
                    />
                    <Button
                      onClick={handleComment}
                      className="mt-2 sm:mt-4 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-300 text-sm sm:text-base h-8 sm:h-10"
                      data-testid="blog-comment-submit-btn"
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Comments List */}
            <div className="space-y-3 sm:space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-2 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-1 sm:mb-2">No comments yet</h3>
                  <p className="text-sm sm:text-base text-slate-500">Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2 sm:space-x-4 bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 border border-slate-200 hover:border-slate-300 transition-colors">
                    <Link to={`/profile/${comment.username}`}>
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-slate-200 hover:ring-slate-300 transition-all">
                        {comment.avatar ? (
                          <img src={comment.avatar} alt={comment.username} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold text-xs sm:text-base">
                            {comment.username[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                          <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{comment.username}</p>
                          <div className="w-1 h-1 bg-slate-400 rounded-full flex-shrink-0"></div>
                          <p className="text-xs sm:text-sm text-slate-500 flex-shrink-0">
                            {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        {user && user.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs sm:text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-0.5 sm:gap-1 transition-colors flex-shrink-0"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed text-sm sm:text-base break-words">{comment.content}</p>
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

export default BlogDetailPage;