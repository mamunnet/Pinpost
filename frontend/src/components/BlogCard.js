import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Edit, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditBlogModal } from "@/components/EditBlogModal";
import { getPostAuthorAvatarUrl, getImageUrl } from "@/utils/imageUtils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BlogCard = ({ blog, user, onLike, compact = false, onBlogUpdate }) => {
  const navigate = useNavigate();
  const [currentBlog, setCurrentBlog] = useState(blog);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditBlog = (e) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleBlogUpdated = (updatedBlog) => {
    setCurrentBlog(updatedBlog);
    if (onBlogUpdate) {
      onBlogUpdate(updatedBlog);
    }
  };

  const handleDeleteBlog = async (e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API}/blogs/${currentBlog.id}`);
      toast.success('🗑️ Blog deleted successfully!', {
        description: 'Your blog article has been removed.',
        duration: 3000
      });
      // Reload or update parent component
      if (onBlogUpdate) {
        onBlogUpdate(null); // Signal deletion
      }
      window.location.reload(); // Refresh the page
    } catch (error) {
      toast.error('❌ Failed to delete blog', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    }
  };

  // ...existing code... (blog update handled via page navigation)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (compact) {
    return (
      <>
        <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer group relative rounded-xl sm:rounded-2xl border-slate-200/60 overflow-hidden" onClick={() => {
          console.log('🔍 BlogCard - Clicked blog:', currentBlog);
          console.log('📝 BlogCard - Blog ID:', currentBlog.id);
          console.log('📍 BlogCard - Navigating to:', `/blog/${currentBlog.id}`);
          navigate(`/blog/${currentBlog.id}`);
        }} data-testid="blog-card">
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
          
          {/* Badge - top right */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border border-slate-200 rounded-full shadow-md backdrop-blur-sm">
              <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-600" />
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-700 uppercase tracking-wider">Blog Article</span>
            </div>
          </div>
          
          <CardHeader className="space-y-2 sm:space-y-3 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-slate-100 shadow-sm">
                  {getPostAuthorAvatarUrl(currentBlog) ? (
                    <img src={getPostAuthorAvatarUrl(currentBlog)} alt={currentBlog.author_name || currentBlog.author_username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-xs sm:text-sm font-bold">
                      {(currentBlog.author_name || currentBlog.author_username)[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">{currentBlog.author_name || currentBlog.author_username}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">@{currentBlog.author_username} • {formatDate(currentBlog.created_at)}</p>
                </div>
              </div>
              
              {user && user.id === currentBlog.author_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                      className="relative z-40 text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg transition-all duration-300"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleEditBlog} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Blog
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteBlog} className="cursor-pointer text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Blog
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <CardTitle className="text-base sm:text-xl group-hover:text-slate-700 transition-colors line-clamp-2 font-bold leading-snug">{currentBlog.title}</CardTitle>
            <CardDescription className="line-clamp-2 text-slate-600 leading-relaxed text-xs sm:text-sm">{currentBlog.excerpt}</CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {currentBlog.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200 font-semibold shadow-sm hover:shadow-md transition-all duration-300 px-1.5 sm:px-2 py-0 sm:py-0.5">#{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-slate-600">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike();
                    // Animate emoji
                    const emojiId = Date.now();
                    setFloatingEmojis(prev => [...prev, {
                      id: emojiId,
                      emoji: currentBlog.liked_by_user ? '💔' : '❤️',
                      x: Math.random() * 50,
                      y: 0
                    }]);
                    setTimeout(() => {
                      setFloatingEmojis(prev => prev.filter(e => e.id !== emojiId));
                    }, 2000);
                  }}
                  className="flex items-center space-x-1 sm:space-x-1.5 hover:text-red-600 transition-colors group"
                >
                  <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300 ${currentBlog.liked_by_user ? 'fill-red-600 text-red-600' : ''}`} />
                  <span className="font-semibold">{currentBlog.likes_count}</span>
                </button>
                <span className="flex items-center space-x-1 sm:space-x-1.5 hover:text-slate-700 transition-colors group">
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">{currentBlog.comments_count}</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Edit Blog Modal */}
        {showEditModal && (
          <EditBlogModal
            isOpen={showEditModal}
            blog={currentBlog}
            onClose={() => setShowEditModal(false)}
            onBlogUpdated={handleBlogUpdated}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer relative rounded-2xl border-slate-200/60 overflow-hidden group" onClick={() => {
        console.log('🔍 BlogCard (Full) - Clicked blog:', currentBlog);
        console.log('📝 BlogCard (Full) - Blog ID:', currentBlog.id);
        console.log('📍 BlogCard (Full) - Navigating to:', `/blog/${currentBlog.id}`);
        navigate(`/blog/${currentBlog.id}`);
      }} data-testid="blog-card-full">
        {/* Badge - top right */}
        <div className="absolute top-4 right-4 z-20">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border border-slate-200 rounded-full shadow-md backdrop-blur-sm">
            <FileText className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Blog Article</span>
          </div>
        </div>
        
        {currentBlog.cover_image && (
          <div className="w-full h-48 overflow-hidden relative">
            <img src={getImageUrl(currentBlog.cover_image)} alt={currentBlog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${currentBlog.author_username}`} onClick={(e) => e.stopPropagation()}>
                <Avatar className="w-12 h-12 ring-2 ring-slate-100 shadow-md hover:ring-slate-300 transition-all">
                  {getPostAuthorAvatarUrl(currentBlog) ? (
                    <img src={getPostAuthorAvatarUrl(currentBlog)} alt={currentBlog.author_name || currentBlog.author_username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold">
                      {(currentBlog.author_name || currentBlog.author_username)[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
              <div>
                <p className="font-bold text-base text-slate-900">{currentBlog.author_name || currentBlog.author_username}</p>
                <p className="text-sm text-slate-500">@{currentBlog.author_username} • {formatDate(currentBlog.created_at)}</p>
              </div>
            </div>
            
            {user && user.id === currentBlog.author_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-40 text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg sm:rounded-xl transition-all duration-300"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEditBlog} className="cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Blog
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteBlog} className="cursor-pointer text-red-600 focus:text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Blog
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardTitle className="text-2xl group-hover:text-slate-700 transition-colors font-bold leading-tight">{currentBlog.title}</CardTitle>
          <CardDescription className="line-clamp-3 text-slate-600 leading-relaxed">{currentBlog.excerpt}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {currentBlog.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border-slate-200 font-semibold shadow-sm hover:shadow-md transition-all duration-300">#{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center space-x-5 text-slate-600">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl font-medium text-sm ${currentBlog.liked_by_user ? 'text-red-600 bg-gradient-to-r from-red-50 to-rose-50 shadow-sm' : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:shadow-sm'} transition-all duration-300 group`}
                data-testid="like-blog-btn"
              >
                <Heart className={`w-5 h-5 ${currentBlog.liked_by_user ? 'fill-current' : ''} group-hover:scale-110 transition-transform duration-300`} />
                <span className="font-semibold">{currentBlog.likes_count}</span>
              </button>
              <span className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:shadow-sm transition-all duration-300 group cursor-pointer font-medium text-sm">
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold">{currentBlog.comments_count}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Blog Modal */}
      {showEditModal && (
        <EditBlogModal
          isOpen={showEditModal}
          blog={currentBlog}
          onClose={() => setShowEditModal(false)}
          onBlogUpdated={handleBlogUpdated}
        />
      )}
    </>
  );
};

export default BlogCard;