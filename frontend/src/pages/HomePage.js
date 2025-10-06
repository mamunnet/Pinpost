import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageCircle, FileText, Heart } from "lucide-react";
import { toast } from "sonner";
import { EnhancedPostModal } from "@/components/EnhancedPostModal";
import { Stories } from "@/components/Stories";
import { PostCard } from "@/components/PostCard";
import { BlogCard } from "@/components/BlogCard";
import { getUserAvatarUrl } from "@/utils/imageUtils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// AdCard component - temporary placeholder for ads
const AdCard = ({ adIndex }) => (
  <div className="text-center p-4">
    <div className="text-slate-400 text-sm">Advertisement Space {adIndex + 1}</div>
    <div className="w-full h-32 bg-slate-100 rounded-lg mt-2 flex items-center justify-center">
      <span className="text-slate-400">Ad Content</span>
    </div>
  </div>
);

// TrendingSidebar component - temporary placeholder
const TrendingSidebar = ({ user }) => (
  <div className="bg-white rounded-lg p-4 border border-slate-200">
    <h3 className="font-semibold text-slate-800 mb-3">Trending</h3>
    <div className="text-slate-500 text-sm">Trending content will appear here</div>
  </div>
);

export const HomePage = ({ user }) => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialTab, setInitialTab] = useState('post');

  useEffect(() => {
    fetchFeed(true);
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) {
        return;
      }
      
      // Load more when user is near bottom (within 100px)
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        fetchFeed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page]);

  const fetchFeed = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const skip = currentPage * 10;
      
      const response = await axios.get(`${API}/feed?skip=${skip}&limit=10`);
      const newFeed = response.data;
      
      if (reset) {
        setFeed(newFeed);
      } else {
        setFeed(prevFeed => [...prevFeed, ...newFeed]);
      }
      
      setHasMore(newFeed.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (item) => {
    try {
      if (item.liked_by_user) {
        await axios.delete(`${API}/likes/${item.type}/${item.id}`);
      } else {
        await axios.post(`${API}/likes/${item.type}/${item.id}`);
      }
      
      // Update the item in feed without refetching entire feed
      setFeed(prevFeed => 
        prevFeed.map(feedItem => 
          feedItem.id === item.id && feedItem.type === item.type
            ? {
                ...feedItem, 
                liked_by_user: !feedItem.liked_by_user,
                likes_count: feedItem.liked_by_user 
                  ? (feedItem.likes_count || 1) - 1 
                  : (feedItem.likes_count || 0) + 1
              }
            : feedItem
        )
      );
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleComment = () => {
    // Refresh feed to get updated comment counts
    fetchFeed(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-3">
            {/* Stories Section */}
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border-slate-200 bg-white">
              <CardContent className="p-6">
                <Stories user={user} />
              </CardContent>
            </Card>

            {/* Separator */}
            <div className="border-b border-slate-300"></div>

            {/* Create Post Box - Premium Style */}
            <div className="bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-200/60">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Avatar className="w-9 h-9 sm:w-12 sm:h-12 ring-2 ring-slate-100 shadow-sm">
                  {getUserAvatarUrl(user) ? (
                    <img 
                      src={getUserAvatarUrl(user)} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                      onLoad={() => console.log('✅ HomePage - Avatar loaded successfully:', getUserAvatarUrl(user))}
                      onError={(e) => {
                        console.error('❌ HomePage - Avatar failed to load:', getUserAvatarUrl(user));
                        console.error('User object:', user);
                        console.error('Avatar field:', user.avatar);
                      }}
                    />
                  ) : (
                    <>
                      {console.log('⚠️ HomePage - No avatar URL for user:', user)}
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold text-sm sm:text-base">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <button
                  onClick={() => {
                    setInitialTab('post');
                    setShowCreateModal(true);
                  }}
                  className="flex-1 text-left px-3 py-2 sm:px-5 sm:py-3.5 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-full text-slate-600 transition-all duration-300 hover:shadow-md border border-slate-200 sm:border-2 hover:border-slate-300 text-sm sm:text-base font-medium"
                  data-testid="whats-on-mind-btn"
                >
                  <span className="hidden sm:inline">What's on your mind, {user.username}?</span>
                  <span className="sm:hidden">What's on your mind?</span>
                </button>
              </div>
              <div className="flex items-center justify-around mt-3 sm:mt-5 pt-3 sm:pt-5 border-t border-slate-100 gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setInitialTab('blog');
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 py-2 sm:py-3 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 rounded-lg sm:rounded-xl transition-all duration-300 group flex-1 justify-center border border-transparent hover:border-slate-200 hover:shadow-md"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 group-hover:from-slate-200 group-hover:to-slate-100 transition-all duration-300 shadow-sm">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 text-xs sm:text-base transition-colors">
                    <span className="hidden sm:inline">Write Blog</span>
                    <span className="sm:hidden">Blog</span>
                  </span>
                </button>
                <div className="w-px h-8 sm:h-10 bg-slate-200"></div>
                <button
                  onClick={() => {
                    setInitialTab('post');
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 py-2 sm:py-3 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 rounded-lg sm:rounded-xl transition-all duration-300 group flex-1 justify-center border border-transparent hover:border-slate-200 hover:shadow-md"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 group-hover:from-slate-200 group-hover:to-slate-100 transition-all duration-300 shadow-sm">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-slate-900 text-xs sm:text-base transition-colors">
                    <span className="hidden sm:inline">Quick Post</span>
                    <span className="sm:hidden">Post</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Create Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogContent className="max-w-3xl max-h-[95vh] p-0 overflow-hidden gap-0 border-none shadow-2xl">
                <EnhancedPostModal onClose={() => setShowCreateModal(false)} currentUser={user} initialTab={initialTab} />
              </DialogContent>
            </Dialog>

            {/* Separator */}
            <div className="border-b border-slate-300"></div>

            {/* Feed Content */}
            {feed.length === 0 && !loading ? (
              <div className="bg-white shadow-sm rounded-lg text-center py-12 px-4 border border-slate-200">
                <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Your feed is empty</h3>
                <p className="text-slate-600 mb-4">Follow some people or create your first post to get started!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <>
                {feed.map((item, index) => (
                  <div key={`${item.type}-${item.id}-${index}`} className="space-y-3">
                    {item.type === 'blog' ? (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-lg overflow-hidden">
                        <BlogCard blog={item} user={user} onLike={() => handleLike(item)} />
                      </div>
                    ) : (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-lg overflow-hidden">
                        <PostCard post={item} user={user} onLike={() => handleLike(item)} onComment={handleComment} />
                      </div>
                    )}
                    
                    {/* Enhanced Ad Placement */}
                    {(index + 1) % 5 === 0 && index < feed.length - 1 && (
                      <div className="my-6">
                        <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-6">
                          <AdCard key={`ad-${Math.floor(index / 5)}`} adIndex={Math.floor(index / 5)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Infinite Scroll Loading Indicator */}
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600 mr-3"></div>
                      <span className="text-slate-600 font-medium">Loading more posts...</span>
                    </div>
                  </div>
                )}
                
                {/* End of Feed Indicator */}
                {!hasMore && feed.length > 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center px-6 py-3 bg-slate-100 rounded-full">
                      <Heart className="w-5 h-5 text-slate-500 mr-2" />
                      <span className="text-slate-600 font-medium">You're all caught up!</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">You've seen all the latest posts from your network</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-3">
            <TrendingSidebar user={user} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;