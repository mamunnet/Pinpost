import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Share2, Trash2, Edit, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { EditPostModal } from "@/components/EditPostModal";
import { getPostAuthorAvatarUrl, getImageUrl, getUserAvatarUrl } from "@/utils/imageUtils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const PostCard = ({ post, user, onLike, onComment, onPostUpdate, compact = false }) => {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUsers, setMentionUsers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Dynamic Styles based on density
  const cardClasses = `bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/60 overflow-hidden relative ${compact ? 'p-0' : ''}`;
  const headerPadding = compact ? 'px-3 pt-3' : 'px-3 sm:px-6 pt-3 sm:pt-5';
  const avatarSize = compact ? 'w-9 h-9' : 'w-9 h-9 sm:w-12 sm:h-12';
  const contentPadding = compact ? 'px-3 py-2 mx-3 rounded-lg' : 'px-3 sm:px-6 py-2 sm:py-3 mx-3 sm:mx-6 rounded-lg';
  const actionPadding = compact ? 'pt-2 pb-2 mx-3' : 'pt-2 sm:pt-4 mx-3 sm:mx-6 pb-3 sm:pb-4';

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
      setShowMentions(false);

      // Update comment count locally
      setCurrentPost({ ...currentPost, comments_count: (currentPost.comments_count || 0) + 1 });
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API}/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));

      // Update comment count locally
      setCurrentPost({ ...currentPost, comments_count: Math.max((currentPost.comments_count || 1) - 1, 0) });
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentContent.trim()) return;

    try {
      const response = await axios.put(`${API}/comments/${commentId}`, {
        content: editCommentContent
      });

      setComments(comments.map(c => c.id === commentId ? { ...c, content: editCommentContent } : c));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleReply = (comment) => {
    setReplyingToCommentId(comment.id);
    setReplyContent(`@${comment.username} `);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;

    try {
      const response = await axios.post(`${API}/comments/post/${post.id}`, {
        content: replyContent,
        reply_to: replyingToCommentId
      });
      setComments([response.data, ...comments]);
      setReplyingToCommentId(null);
      setReplyContent('');

      // Update comment count locally
      setCurrentPost({ ...currentPost, comments_count: (currentPost.comments_count || 0) + 1 });
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const handleCommentInputChange = (e) => {
    const value = e.target.value;
    setCommentContent(value);

    // Check for @ mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const searchTerm = textBeforeCursor.substring(lastAtSymbol + 1);
      if (searchTerm.length > 0 && !searchTerm.includes(' ')) {
        setMentionSearch(searchTerm);
        setShowMentions(true);
        setCursorPosition(cursorPos);
        searchMentionUsers(searchTerm);
      } else if (searchTerm.length === 0) {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const searchMentionUsers = async (search) => {
    try {
      const response = await axios.get(`${API}/users/search?q=${search}&limit=5`);
      setMentionUsers(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const selectMention = (username) => {
    const textBeforeCursor = commentContent.substring(0, cursorPosition);
    const textAfterCursor = commentContent.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const newContent = textBeforeCursor.substring(0, lastAtSymbol) + `@${username} ` + textAfterCursor;
    setCommentContent(newContent);
    setShowMentions(false);
  };

  const handleEditPost = () => {
    setShowEditModal(true);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`${API}/posts/${post.id}`);
      toast.success('🗑️ Post deleted successfully!', {
        description: 'Your post has been removed.',
        duration: 3000
      });
      // Reload or update parent component
      if (onPostUpdate) {
        onPostUpdate(null); // Signal deletion
      }
      window.location.reload(); // Refresh the feed
    } catch (error) {
      toast.error('❌ Failed to delete post', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    }
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
    <div className={cardClasses} data-testid="post-card">
      <div className={compact ? "space-y-2" : "space-y-2 sm:space-y-4"}>
        {/* Header */}
        <div className={`flex items-start space-x-2 sm:space-x-3 ${headerPadding}`}>
          <Link to={`/profile/${post.author_username}`} className="group flex-shrink-0">
            <Avatar className={`${avatarSize} ring-2 ring-slate-100 group-hover:ring-slate-300 transition-all shadow-sm`}>
              {getPostAuthorAvatarUrl(currentPost) ? (
                <img
                  src={getPostAuthorAvatarUrl(currentPost)}
                  alt={currentPost.author_name || currentPost.author_username}
                  className="w-full h-full object-cover rounded-full"
                />
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
                  <p className={`font-semibold text-slate-900 ${compact ? 'text-sm' : 'text-sm sm:text-base'} truncate`}>
                    {post.author_name || post.author_username}
                  </p>
                </Link>
                <span className="text-slate-400 text-xs sm:text-sm">•</span>
                <p className="text-xs sm:text-sm text-slate-500">{formatDate(post.created_at)}</p>
              </div>

              {/* 3-dot Menu - only show for post owner */}
              {user && user.id === post.author_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 w-8 p-0 rounded-lg transition-all duration-300"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleEditPost} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeletePost} className="cursor-pointer text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Badge - inline on left */}
        <div className={compact ? "px-3" : "px-3 sm:px-6"}>
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border border-slate-200 rounded-full shadow-sm">
            <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600" />
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 uppercase tracking-wider">Quick Post</span>
          </div>
        </div>

        {/* Content - Clickable to navigate to post detail */}
        <div
          onClick={() => navigate(`/post/${post.id}`)}
          className={`cursor-pointer hover:bg-slate-50/60 transition-all duration-200 border border-[#E5EBF2] bg-gradient-to-br from-white to-slate-50/30 ${contentPadding}`}
        >
          {displayContent.trim() && (
            <p className={`text-slate-800 whitespace-pre-wrap leading-relaxed ${compact ? 'text-sm' : 'text-sm sm:text-[15px]'}`}>{displayContent}</p>
          )}

          {/* Image */}
          {postImage && (
            <div className={`mt-3 rounded-xl overflow-hidden shadow-md`}>
              <img src={getImageUrl(postImage)} alt="Post" className="w-full max-h-96 object-cover" />
            </div>
          )}
        </div>

        {/* Floating Emojis */}
        {floatingEmojis.map((emoji) => (
          <div
            key={emoji.id}
            className="absolute pointer-events-none z-50 animate-float-up"
            style={{
              left: `${emoji.x}px`,
              bottom: `${emoji.y}px`,
              fontSize: '2.5rem',
              animation: 'floatUp 2s ease-out forwards'
            }}
          >
            {emoji.emoji}
          </div>
        ))}

        {/* Stats Bar */}
        <div className={`${compact ? 'px-3 py-1.5' : 'px-3 sm:px-6 py-2'} bg-slate-50/50 flex items-center justify-between text-xs sm:text-sm text-slate-600`}>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="font-semibold">{post.likes_count || 0} {post.likes_count === 1 ? 'like' : 'likes'}</span>
            <span className="font-semibold">{post.comments_count || 0} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className={`border-t border-slate-100 ${actionPadding}`}>
          <div className="flex items-center justify-around">
            <div className="relative flex-1">
              <button
                onClick={(e) => {
                  onLike();
                  // Animate emoji
                  const rect = e.currentTarget.getBoundingClientRect();
                  const emojiId = Date.now();
                  setFloatingEmojis(prev => [...prev, {
                    id: emojiId,
                    emoji: post.liked_by_user ? '💔' : '❤️',
                    x: Math.random() * 50,
                    y: 0
                  }]);
                  setTimeout(() => {
                    setFloatingEmojis(prev => prev.filter(e => e.id !== emojiId));
                  }, 2000);
                }}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                className={`w-full flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-2 rounded-lg hover:bg-slate-50 font-semibold text-xs sm:text-sm ${post.liked_by_user
                  ? 'text-red-600'
                  : 'text-slate-600'
                  } transition-all duration-300 group`}
                data-testid="like-post-btn"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${post.liked_by_user ? 'fill-current' : ''} group-hover:scale-110 transition-transform duration-300`} />
                <span>Like</span>
              </button>

              {/* Reaction Picker */}
              {showReactions && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border-2 border-slate-200/60 px-2 sm:px-4 py-1.5 sm:py-3 flex space-x-1 sm:space-x-1.5 z-10"
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {['❤️', '😍', '😂', '👍', '😮', '😢'].map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onLike();
                        // Animate selected emoji
                        const emojiId = Date.now();
                        setFloatingEmojis(prev => [...prev, {
                          id: emojiId,
                          emoji: emoji,
                          x: Math.random() * 50,
                          y: 0
                        }]);
                        setTimeout(() => {
                          setFloatingEmojis(prev => prev.filter(e => e.id !== emojiId));
                        }, 2000);
                        setShowReactions(false);
                      }}
                      className="text-xl sm:text-2xl hover:scale-125 transition-all duration-300 p-1 sm:p-2 hover:bg-slate-50 rounded-lg animate-bounce-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchComments}
              className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-all duration-300 group font-semibold text-xs sm:text-sm"
              data-testid="comment-post-btn"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Comment</span>
            </button>

            <button className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-all duration-300 group font-semibold text-xs sm:text-sm">
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className={`mt-3 sm:mt-4 space-y-3 sm:space-y-4 border-t border-slate-100 pt-4 sm:pt-5 pb-4 ${compact ? 'px-3' : 'px-4 sm:px-6'}`}>
            {/* Add Comment Input */}
            <div className="relative">
              <div className="flex space-x-2 sm:space-x-3">
                <Input
                  placeholder="Add a comment... (Use @ to mention)"
                  value={commentContent}
                  onChange={handleCommentInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && !showMentions && handleComment()}
                  className="flex-1 border-2 border-slate-200 focus:border-slate-400 focus:ring-slate-300 rounded-xl text-sm shadow-sm placeholder:text-slate-400"
                  data-testid="comment-input"
                />
                <Button
                  onClick={handleComment}
                  size="sm"
                  className="hover:scale-105 transition-all duration-300 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-2 text-xs rounded-xl shadow-md hover:shadow-lg font-semibold"
                  data-testid="submit-comment-btn"
                >
                  Post
                </Button>
              </div>

              {/* Mention Dropdown */}
              {showMentions && mentionUsers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-2xl border-2 border-slate-200 max-h-48 overflow-y-auto z-20">
                  {mentionUsers.map((mentionUser) => (
                    <button
                      key={mentionUser.id}
                      onClick={() => selectMention(mentionUser.username)}
                      className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Avatar className="w-8 h-8">
                        {getUserAvatarUrl(mentionUser) ? (
                          <img src={getUserAvatarUrl(mentionUser)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="text-xs bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                            {mentionUser.username[0].toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">@{mentionUser.username}</p>
                        <p className="text-xs text-slate-500">{mentionUser.name || mentionUser.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comments List */}
            {comments.map((comment) => (
              <React.Fragment key={comment.id}>
                <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-br from-slate-50/80 to-white rounded-xl hover:shadow-md transition-all duration-300 border border-slate-100">
                  <Avatar className="w-7 h-7 sm:w-9 sm:h-9 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                      {comment.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    {editingCommentId === comment.id ? (
                      // Edit Mode
                      <div className="space-y-2">
                        <Input
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          className="w-full border-2 border-slate-300 focus:border-slate-500 rounded-lg text-sm"
                          autoFocus
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleUpdateComment(comment.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded-lg"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentContent('');
                            }}
                            size="sm"
                            variant="outline"
                            className="px-3 py-1 text-xs rounded-lg"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="bg-white rounded-xl p-3 border border-slate-200/60 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-900">{comment.username}</p>
                            <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">{comment.content}</p>

                            {/* Comment Actions */}
                            <div className="flex items-center space-x-3 mt-2">
                              <button
                                onClick={() => handleReply(comment)}
                                className="text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors"
                              >
                                Reply
                              </button>
                              {user && (
                                String(user.id) === String(comment.user_id) ||
                                user.username === comment.username
                              ) && (
                                  <>
                                    <button
                                      onClick={() => handleEditComment(comment)}
                                      className="text-xs text-slate-500 hover:text-green-600 font-semibold transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="text-xs text-slate-500 hover:text-red-600 font-semibold transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Input - Shows below the comment being replied to */}
                {replyingToCommentId === comment.id && (
                  <div className="ml-9 sm:ml-12 mt-2">
                    <div className="flex space-x-2 sm:space-x-3 bg-blue-50/50 p-3 rounded-xl border-2 border-blue-200">
                      <Input
                        placeholder="Write your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply()}
                        className="flex-1 border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-400 rounded-xl text-sm shadow-sm"
                        autoFocus
                      />
                      <Button
                        onClick={handleSubmitReply}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 text-xs rounded-xl shadow-md font-semibold"
                      >
                        Reply
                      </Button>
                      <Button
                        onClick={() => {
                          setReplyingToCommentId(null);
                          setReplyContent('');
                        }}
                        size="sm"
                        variant="outline"
                        className="px-2 sm:px-3 py-2 text-xs rounded-xl border-blue-300 hover:bg-blue-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </React.Fragment>
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