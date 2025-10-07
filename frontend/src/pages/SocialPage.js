import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heart, MessageCircle, Share2, Plus, Home, Users, TrendingUp, Search, ChevronRight } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { EnhancedPostModal } from "@/components/EnhancedPostModal";
import { NotificationTester } from "@/components/NotificationTester";
import { PostCardSkeleton, SidebarSkeleton } from "@/components/SkeletonLoader";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// AdCard component for enhanced ad placement
const AdCard = ({ adIndex }) => (
  <div className="text-center p-8">
    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <span className="text-white font-bold text-xl">Ad</span>
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">Advertisement Space #{adIndex + 1}</h3>
    <p className="text-slate-600 text-sm">Your targeted ad content could appear here</p>
  </div>
);

// WhoToFollow component
const WhoToFollow = ({ user }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${API}/users/suggestions?limit=5`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post(`${API}/follow/${userId}`);
      setSuggestions(suggestions.filter(s => s.id !== userId));
      toast.success('Successfully followed!');
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  if (loading) {
    return <SidebarSkeleton />;
  }

  if (suggestions.length === 0) {
    return <div className="text-center py-4 text-slate-500">No suggestions available</div>;
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <div key={suggestion.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {suggestion.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{suggestion.name || suggestion.username}</p>
              <p className="text-xs text-slate-500">@{suggestion.username}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleFollow(suggestion.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 text-xs"
          >
            Follow
          </Button>
        </div>
      ))}
    </div>
  );
};

export const SocialPage = ({ user }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all'); // all, following, trending
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    fetchPosts(true);
  }, [filter]);

  useEffect(() => {
    // Filter posts based on search query
    if (searchQuery.trim()) {
      const filtered = posts.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.author_name && post.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  }, [searchQuery, posts]);

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const skip = currentPage * 10;
      
      let endpoint = `${API}/posts?skip=${skip}&limit=10`;
      if (filter === 'following') {
        endpoint = `${API}/feed?skip=${skip}&limit=10&following_only=true`;
      } else if (filter === 'trending') {
        endpoint = `${API}/posts?skip=${skip}&limit=10&sort=trending`;
      }

      const response = await axios.get(endpoint);
      const newPosts = response.data;

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts([...posts, ...newPosts]);
      }

      setHasMore(newPosts.length === 10);
      setPage(currentPage + 1);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (post) => {
    try {
      if (post.liked_by_user) {
        await axios.delete(`${API}/likes/post/${post.id}`);
        // Show unlike notification
        toast('💔 Post unliked', {
          description: 'Removed from your liked posts',
          duration: 2000
        });
      } else {
        await axios.post(`${API}/likes/post/${post.id}`);
        // Show like notification
        toast.success('❤️ Post liked!', {
          description: 'Added to your liked posts and user notified',
          duration: 3000
        });
      }
      // Update post in the list immediately
      setPosts(posts.map(p => p.id === post.id ? {...p, liked_by_user: !p.liked_by_user, likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1} : p));
    } catch (error) {
      toast.error('❌ Failed to update like', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Futuristic Header */}
        <div className="relative mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-2xl p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Social Hub</h1>
                    <p className="text-slate-200 text-sm sm:text-base">Connect, share, and discover</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
              <div className="flex items-center space-x-4 text-slate-200 text-sm">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live Feed
                </span>
                <span>•</span>
                <span>{filteredPosts.length} posts loaded</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Main Feed */}
          <div className="flex-1 max-w-2xl mx-auto space-y-6">
            {/* Enhanced Filter Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 sticky top-24 z-10">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search posts, people, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-slate-50 border-slate-200 focus:border-slate-400 focus:ring-slate-400/20 rounded-xl text-slate-700 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Modern Filter Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === 'all' 
                      ? 'bg-white shadow-md text-slate-700 transform scale-105' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  All Posts
                </button>
                <button
                  onClick={() => setFilter('following')}
                  className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === 'following' 
                      ? 'bg-white shadow-md text-slate-700 transform scale-105' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Following
                </button>
                <button
                  onClick={() => setFilter('trending')}
                  className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === 'trending' 
                      ? 'bg-white shadow-md text-slate-700 transform scale-105' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </button>
              </div>
            </div>

            {/* Enhanced Posts Display */}
            {loading ? (
              <>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 text-center py-16 px-8">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  {searchQuery ? 'No posts found' : 'No posts yet'}
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
                  {searchQuery 
                    ? 'Try a different search query or explore trending topics'
                    : filter === 'following' 
                      ? 'Follow some people to see their posts in your feed'
                      : 'Be the first to share something amazing with the community!'}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setShowCreateModal(true)} 
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Post
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {filteredPosts.map((post, index) => (
                    <div key={post.id} className="group">
                      {/* Enhanced Post Card Container */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 overflow-hidden">
                        <PostCard post={post} user={user} onLike={() => handleLike(post)} onComment={() => fetchPosts(true)} />
                      </div>
                      
                      {/* Enhanced Ad Placement */}
                      {(index + 1) % 4 === 0 && index < filteredPosts.length - 1 && (
                        <div className="mt-6">
                          <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-6">
                            <AdCard adIndex={Math.floor(index / 4)} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Enhanced Load More Button */}
                {hasMore && !searchQuery && (
                  <div className="text-center py-8">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-800 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600 mr-3"></div>
                          Loading more posts...
                        </>
                      ) : (
                        <>
                          <span>Load More Posts</span>
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar - Suggestions */}
          <div className="hidden lg:block w-80 space-y-6">
            {/* Who to Follow */}
            <Card className="sticky top-20 shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Who to Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <WhoToFollow user={user} />
              </CardContent>
            </Card>

            {/* Notification Tester - for debugging */}
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
              <CardContent className="p-4">
                <NotificationTester />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-teal-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Your Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    Posts
                  </span>
                  <span className="font-bold text-blue-600">
                    {posts.filter(p => p.author_id === user?.id).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    Likes Given
                  </span>
                  <span className="font-bold text-rose-600">
                    {posts.filter(p => p.liked_by_user).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Engagement
                  </span>
                  <span className="font-bold text-green-600">
                    {posts.reduce((acc, p) => acc + (p.author_id === user?.id ? p.likes_count + p.comments_count : 0), 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <EnhancedPostModal onClose={() => {
            setShowCreateModal(false);
            fetchPosts(true);
          }} currentUser={user} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocialPage;