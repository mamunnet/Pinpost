import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Edit } from "lucide-react";
import { EditBlogModal } from "@/components/EditBlogModal";

export const BlogCard = ({ blog, user, onLike, compact = false, onBlogUpdate }) => {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(blog);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (compact) {
    return (
      <>
        <Card className="hover:shadow-xl transition-all cursor-pointer group" onClick={() => navigate(`/blog/${currentBlog.id}`)} data-testid="blog-card">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Avatar className="w-10 h-10">
                  {currentBlog.author_avatar ? (
                    <img src={currentBlog.author_avatar} alt={currentBlog.author_name || currentBlog.author_username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-rose-500 text-white text-sm">
                      {(currentBlog.author_name || currentBlog.author_username)[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{currentBlog.author_name || currentBlog.author_username}</p>
                  <p className="text-xs text-gray-500">@{currentBlog.author_username} • {formatDate(currentBlog.created_at)}</p>
                </div>
              </div>
              
              {user && user.id === currentBlog.author_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditBlog}
                  className="text-slate-500 hover:text-slate-700 h-8 w-8 p-0"
                  title="Edit blog"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
            <CardTitle className="text-xl group-hover:text-rose-600 transition-colors line-clamp-2">{currentBlog.title}</CardTitle>
            <CardDescription className="line-clamp-2">{currentBlog.excerpt}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {currentBlog.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Heart className={`w-4 h-4 ${currentBlog.liked_by_user ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>{currentBlog.likes_count}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{currentBlog.comments_count}</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <EditBlogModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          blog={currentBlog}
          onBlogUpdated={handleBlogUpdated}
        />
      </>
    );
  }

  return (
    <>
      <Card className="hover:shadow-xl transition-all cursor-pointer" onClick={() => navigate(`/blog/${currentBlog.id}`)} data-testid="blog-card-full">
        {currentBlog.cover_image && (
          <div className="w-full h-48 overflow-hidden">
            <img src={currentBlog.cover_image} alt={currentBlog.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${currentBlog.author_username}`} onClick={(e) => e.stopPropagation()}>
                <Avatar className="w-12 h-12">
                  {currentBlog.author_avatar ? (
                    <img src={currentBlog.author_avatar} alt={currentBlog.author_name || currentBlog.author_username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-rose-500 text-white">
                      {(currentBlog.author_name || currentBlog.author_username)[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
              <div>
                <p className="font-semibold text-base">{currentBlog.author_name || currentBlog.author_username}</p>
                <p className="text-sm text-gray-500">@{currentBlog.author_username} • {formatDate(currentBlog.created_at)}</p>
              </div>
            </div>
            
            {user && user.id === currentBlog.author_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditBlog}
                className="text-slate-500 hover:text-slate-700 h-8 w-8 p-0"
                title="Edit blog"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
          <CardTitle className="text-2xl hover:text-rose-600 transition-colors">{currentBlog.title}</CardTitle>
          <CardDescription className="line-clamp-3">{currentBlog.excerpt}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {currentBlog.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center space-x-6 text-gray-600">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike();
                }}
                className={`flex items-center space-x-1 ${currentBlog.liked_by_user ? 'text-rose-600' : 'hover:text-rose-600'} transition-colors`}
                data-testid="like-blog-btn"
              >
                <Heart className={`w-5 h-5 ${currentBlog.liked_by_user ? 'fill-current' : ''}`} />
                <span>{currentBlog.likes_count}</span>
              </button>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-5 h-5" />
                <span>{currentBlog.comments_count}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <EditBlogModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        blog={currentBlog}
        onBlogUpdated={handleBlogUpdated}
      />
    </>
  );
};

export default BlogCard;