import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Bookmark, ArrowLeft, Trash2, Edit, MoreHorizontal, Send } from "lucide-react";
import { toast } from "sonner";
import { getUserAvatarUrl, getImageUrl } from "@/utils/imageUtils";
import { Header } from "@/components/Header";
import { PostDetailSkeleton } from "@/components/SkeletonLoader";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PostDetailPage = ({ user, logout }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReactions, setShowReactions] = useState(false);

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const fetchPostDetails = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        axios.get(`${API}/posts/${postId}`),
        axios.get(`${API}/comments/post/${postId}`)
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data);
    } catch (error) {
      console.error('Failed to load post:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      if (post.liked_by_user) {
        await axios.delete(`${API}/likes/post/${post.id}`);
      } else {
        await axios.post(`${API}/likes/post/${post.id}`);
      }
      fetchPostDetails();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;

    try {
      await axios.post(`${API}/comments/post/${post.id}`, {
        content: commentContent
      });
      setCommentContent('');
      fetchPostDetails();
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/comments/${commentId}`);
      fetchPostDetails();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  if (loading) {
    return (
      <>
        <Header user={user} logout={logout} />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4">
            <PostDetailSkeleton />
          </div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header user={user} logout={logout} />
        <div className="min-h-screen flex items-center justify-center pt-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-4">The post you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </div>
        </div>
      </>
    );
  }

  const isOwnPost = user && user.id === post.author_id;

  // Extract image from content if present
  let displayContent = post.content;
  let postImage = null;
  let postLocation = null;

  if (post.content) {
    // Extract image first
    if (post.content.includes('[IMAGE]')) {
      const parts = post.content.split('[IMAGE]');
      displayContent = parts[0].trim();
      // Get image URL and remove any trailing content (like location that might be after)
      const imageUrlRaw = parts[1] ? parts[1].trim() : null;
      if (imageUrlRaw) {
        // Extract just the URL (first line after [IMAGE])
        const imageLines = imageUrlRaw.split('\n');
        postImage = imageLines[0].trim();
      }
    }
    
    // Extract location from the text part
    const locationMatch = displayContent.match(/📍\s*(.+?)(?:\n|$)/);
    if (locationMatch) {
      postLocation = locationMatch[1].trim();
      displayContent = displayContent.replace(/📍\s*.+?(?:\n|$)/, '').trim();
    }
  }

  return (
    <>
      <Header user={user} logout={logout} />
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 pt-28 sm:pt-32 pb-6 sm:pb-12">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 sm:mb-6 mt-1 sm:mt-2 hover:bg-gray-100 text-slate-600 hover:text-slate-800 transition-all duration-300 group text-sm sm:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>

          {/* Main Post Card */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardContent className="p-0">
              {/* Post Header */}
              <div className="p-4 sm:p-6 bg-gradient-to-r from-white to-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                    <Link to={`/profile/${post.author_username}`}>
                      <Avatar className="w-10 h-10 sm:w-14 sm:h-14 ring-2 ring-white shadow-lg hover:ring-rose-200 transition-all">
                        {post.author_avatar ? (
                          <img 
                            src={post.author_avatar} 
                            alt={post.author_name || post.author_username} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-sm sm:text-lg font-bold">
                            {(post.author_name || post.author_username)[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${post.author_username}`} 
                        className="block hover:underline"
                      >
                        <p className="font-bold text-gray-900 text-sm sm:text-lg truncate">
                          {post.author_name || post.author_username}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">@{post.author_username}</p>
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">{formatDate(post.created_at)}</p>
                    </div>
                  </div>
                  {isOwnPost && (
                    <Button variant="ghost" size="sm" className="hover:bg-gray-100 h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Post Content */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                {displayContent && (
                  <p className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {displayContent}
                  </p>
                )}

                {/* Post Image */}
                {postImage && (
                  <div className="rounded-lg sm:rounded-xl overflow-hidden mt-3 sm:mt-4 bg-gray-100">
                    <img 
                      src={getImageUrl(postImage)} 
                      alt="Post" 
                      className="w-full max-h-[400px] sm:max-h-[600px] object-contain"
                      onError={(e) => {
                        console.error('❌ PostDetailPage - Image failed to load:', postImage);
                        console.error('Processed URL:', getImageUrl(postImage));
                      }}
                    />
                  </div>
                )}

                {/* Location */}
                {postLocation && (
                  <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-gray-600">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {postLocation}
                  </div>
                )}
              </div>

              <Separator />

              {/* Stats Bar */}
              <div className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gray-50 flex items-center justify-between text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <span className="font-semibold">{post.likes_count || 0} {post.likes_count === 1 ? 'like' : 'likes'}</span>
                  <span className="font-semibold">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="px-4 sm:px-6 py-1.5 sm:py-2 flex items-center justify-around bg-white">
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={handleLike}
                    onMouseEnter={() => setShowReactions(true)}
                    onMouseLeave={() => setShowReactions(false)}
                    className={`flex-1 text-sm sm:text-base h-8 sm:h-10 ${post.liked_by_user ? 'text-rose-600 hover:bg-rose-50' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 ${post.liked_by_user ? 'fill-current' : ''}`} />
                    <span className="font-semibold">Like</span>
                  </Button>

                  {/* Reaction Picker */}
                  {showReactions && (
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-full shadow-xl border border-gray-200 px-3 py-2 flex space-x-1 z-10"
                      onMouseEnter={() => setShowReactions(true)}
                      onMouseLeave={() => setShowReactions(false)}
                    >
                      {['❤️', '😍', '😂', '👍', '😮', '😢'].map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            handleLike();
                            setShowReactions(false);
                          }}
                          className="text-2xl hover:scale-125 transition-transform p-1.5 hover:bg-gray-50 rounded-full"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" className="flex-1 text-gray-600 hover:bg-gray-50 text-sm sm:text-base h-8 sm:h-10">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="font-semibold">Comment</span>
                </Button>
                <Button variant="ghost" onClick={handleShare} className="flex-1 text-gray-600 hover:bg-gray-50 text-sm sm:text-base h-8 sm:h-10">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="font-semibold hidden sm:inline">Share</span>
                </Button>
              </div>

              <div className="border-t-2 sm:border-t-4 border-gray-100">
                {/* Add Comment Input */}
                {user && (
                  <div className="px-4 sm:px-6 py-2 sm:py-3 bg-white border-b">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                        {getUserAvatarUrl(user) ? (
                          <img src={getUserAvatarUrl(user)} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-xs">
                            {user.username[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                          className="flex-1 bg-gray-100 border-0 focus:ring-1 focus:ring-rose-200 rounded-full px-3 sm:px-4 h-8 sm:h-9 text-xs sm:text-sm"
                        />
                        <Button 
                          onClick={handleComment}
                          disabled={!commentContent.trim()}
                          size="sm"
                          className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 rounded-full px-3 sm:px-4 h-8 sm:h-9"
                        >
                          <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="bg-white px-4 sm:px-6 py-2 sm:py-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-4 sm:py-6">
                      <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-1 sm:mb-2" />
                      <p className="text-gray-500 font-medium text-xs sm:text-sm">No comments yet</p>
                      <p className="text-xs text-gray-400 mt-0.5 sm:mt-1">Be the first to comment!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-1.5 sm:space-x-2">
                          <Link to={`/profile/${comment.username}`}>
                            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 hover:ring-2 hover:ring-rose-200 transition-all">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold">
                                {comment.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-100 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2">
                              <Link 
                                to={`/profile/${comment.username}`}
                                className="font-semibold text-xs sm:text-sm hover:underline text-gray-900"
                              >
                                {comment.username}
                              </Link>
                              <p className="text-xs sm:text-sm text-gray-800 mt-0.5 break-words">
                                {comment.content}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3 mt-0.5 sm:mt-1 px-1 sm:px-2">
                              <button className="text-[10px] sm:text-xs text-gray-500 hover:text-rose-600 font-semibold">
                                Like
                              </button>
                              <button className="text-[10px] sm:text-xs text-gray-500 hover:text-blue-600 font-semibold">
                                Reply
                              </button>
                              <span className="text-[10px] sm:text-xs text-gray-400">
                                {formatDate(comment.created_at)}
                              </span>
                              {user && user.id === comment.user_id && (
                                <button 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-[10px] sm:text-xs text-red-500 hover:text-red-700 font-semibold ml-auto flex items-center gap-0.5 sm:gap-1"
                                >
                                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
