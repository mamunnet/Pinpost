import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Trash2, Edit, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { EditPostModal } from "@/components/EditPostModal";
import { getPostAuthorAvatarUrl, getImageUrl } from "@/utils/imageUtils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PostCard = ({ post, user, onLike, onComment, onPostUpdate }) => {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

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
      
      // Show instant success notification
      toast.success('💬 Comment added successfully!', {
        description: 'Your comment has been posted and others will be notified.',
        duration: 3000
      });
      
      if (onComment) onComment();
    } catch (error) {
      toast.error('❌ Failed to add comment', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success('🗑️ Comment deleted successfully!', {
        description: 'Your comment has been removed.',
        duration: 3000
      });
      
      if (onComment) onComment();
    } catch (error) {
      toast.error('❌ Failed to delete comment', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    }
  };

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handlePostUpdated = (updatedPost) => {
    setCurrentPost(updatedPost);
    if (onPostUpdate) {
      onPostUpdate(updatedPost);
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
  let displayContent = currentPost.content;
  let postImage = null;
  if (currentPost.content && currentPost.content.includes('[IMAGE]')) {
    const parts = currentPost.content.split('[IMAGE]');
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
              {getPostAuthorAvatarUrl(currentPost) ? (
                <img src={getPostAuthorAvatarUrl(currentPost)} alt={currentPost.author_name || currentPost.author_username} className="w-full h-full object-cover rounded-full" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm sm:text-base">
                  {(currentPost.author_name || currentPost.author_username)[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link to={`/profile/${post.author_username}`} className="hover:underline">
                  <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                    {post.author_name || post.author_username}
                  </p>
                </Link>
                <span className="text-slate-400 text-xs sm:text-sm">•</span>
                <p className="text-xs sm:text-sm text-slate-500">{formatDate(post.created_at)}</p>
              </div>
              
              {/* Edit button - only show for post owner */}
              {user && user.id === post.author_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditPost}
                  className="text-slate-500 hover:text-slate-700 h-8 w-8 p-0"
                  title="Edit post"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
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
              <img src={getImageUrl(postImage)} alt="Post" className="w-full max-h-96 object-cover" />
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900">{comment.username}</p>
                        {user && (
                          String(user.id) === String(comment.user_id) || 
                          user.username === comment.username
                        ) && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors p-1 rounded hover:bg-red-50 ml-2"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={currentPost}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  );
};

export default PostCard;