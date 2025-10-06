import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Heart, MessageCircle, Calendar, ArrowLeft, Share2, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading article...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-32 pb-12">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 mt-2 hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-all duration-300 group"
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
                    {(blog.author_name || blog.author_username)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link to={`/profile/${blog.author_username}`} className="font-bold text-lg text-slate-800 hover:text-slate-600 hover:underline transition-colors">
                  {blog.author_name || blog.author_username}
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
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-slate-800">{comment.username}</p>
                          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                          <p className="text-sm text-slate-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {user && user.id === comment.user_id && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
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

export default BlogDetailPage;