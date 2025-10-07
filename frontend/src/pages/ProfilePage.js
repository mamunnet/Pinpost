import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Edit, Camera, User, MessageCircle, FileText, MapPin, Calendar, Heart, Users, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "@/components/PostCard";
import { BlogCard } from "@/components/BlogCard";
import { EditProfileModal } from "@/components/EditProfileModal";
import { EditCoverPhotoModal } from "@/components/EditCoverPhotoModal";
import { EditAvatarModal } from "@/components/EditAvatarModal";
import { getUserAvatarUrl, getUserCoverPhotoUrl } from "@/utils/imageUtils";
import { ProfileHeaderSkeleton, PostCardSkeleton, BlogCardSkeleton } from "@/components/SkeletonLoader";

const API = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api`;

const ProfilePage = ({ currentUser }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCover, setShowEditCover] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);
  const [canMessage, setCanMessage] = useState(false);

  useEffect(() => {
    fetchProfile();
    checkMessagingEligibility();
  }, [username]);

  const fetchProfile = async () => {
    console.log('🔍 ProfilePage - Fetching profile for username:', username);
    
    if (!username) {
      console.error('❌ ProfilePage - Username is undefined!');
      toast.error('Username not found');
      setLoading(false);
      return;
    }
    
    try {
      console.log('📡 ProfilePage - Making API calls for:', username);
      const [userRes, blogsRes, postsRes] = await Promise.all([
        axios.get(`${API}/users/${username}`),
        axios.get(`${API}/users/${username}/blogs`),
        axios.get(`${API}/users/${username}/posts`)
      ]);
      console.log('✅ ProfilePage - Profile loaded successfully:', userRes.data);
      setUser(userRes.data);
      setBlogs(blogsRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error('❌ ProfilePage - Error loading profile:', error);
      console.error('Username attempted:', username);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 404) {
        toast.error(`Profile not found for username: ${username}`);
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkMessagingEligibility = async () => {
    if (!currentUser) return;
    try {
      const userRes = await axios.get(`${API}/users/${username}`);
      const userId = userRes.data.id;
      
      // Check if can message this user
      const eligibilityRes = await axios.get(`${API}/conversations/check-eligibility/${userId}`);
      setCanMessage(eligibilityRes.data.can_message);
    } catch (error) {
      console.error('Failed to check messaging eligibility');
    }
  };

  const handleMessage = async () => {
    try {
      // Create or get existing conversation
      const res = await axios.post(`${API}/conversations`, {
        recipient_id: user.id
      });
      
      // Navigate to messages page
      navigate('/messages');
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Failed to start conversation');
      }
    }
  };

  const handleFollow = async () => {
    try {
      if (user.is_following) {
        await axios.delete(`${API}/users/${user.id}/follow`);
        toast.success('Unfollowed successfully');
      } else {
        await axios.post(`${API}/users/${user.id}/follow`);
        toast.success('Followed successfully');
      }
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          <ProfileHeaderSkeleton />
          <div className="mt-6 space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <BlogCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-20 sm:pt-24 pb-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Compact Hero Section with Cover & Profile */}
        <div className="relative mb-4 sm:mb-6">
          {/* Cover Photo - More Compact */}
          <div className="relative h-32 sm:h-40 lg:h-48 rounded-2xl overflow-hidden shadow-xl border border-slate-200/50">
            {getUserCoverPhotoUrl(user) ? (
              <>
                <img 
                  src={getUserCoverPhotoUrl(user)} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 relative">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="5" cy="5" r="1" fill="white" opacity="0.4"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-white/30" />
                </div>
              </div>
            )}
            
            {isOwnProfile && (
              <button
                onClick={() => setShowEditCover(true)}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{getUserCoverPhotoUrl(user) ? 'Edit Cover' : 'Add Cover'}</span>
              </button>
            )}
          </div>

          {/* Compact Profile Card */}
          <div className="relative px-2 sm:px-4 -mt-8 sm:-mt-10">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
                  {/* Compact Avatar */}
                  <div className="relative group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl overflow-hidden ring-2 sm:ring-4 ring-white shadow-lg bg-gradient-to-br from-rose-500 to-amber-500">
                      {getUserAvatarUrl(user) ? (
                        <img 
                          src={getUserAvatarUrl(user)} 
                          alt={user.name || user.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xl sm:text-2xl lg:text-4xl font-bold">
                          {(user.name || user.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowEditAvatar(true)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg"
                      >
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>

                  {/* Compact User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text">
                          {user.name || user.username}
                        </h1>
                        {user.name && (
                          <p className="text-slate-500 text-sm sm:text-base font-medium">@{user.username}</p>
                        )}
                      </div>

                      {/* Compact Action Button */}
                      <div className="flex-shrink-0">
                        {isOwnProfile ? (
                          <Button
                            onClick={() => setShowEditProfile(true)}
                            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span>Edit Profile</span>
                          </Button>
                        ) : (
                          currentUser && (
                            <div className="flex gap-2">
                              <Button
                                onClick={handleFollow}
                                className={user.is_following 
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm" 
                                  : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
                                }
                                data-testid="follow-btn"
                              >
                                {user.is_following ? 'Following' : 'Follow'}
                              </Button>
                              
                              {canMessage && (
                                <Button
                                  onClick={handleMessage}
                                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm"
                                  data-testid="message-btn"
                                >
                                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  <span>Message</span>
                                </Button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Compact Bio */}
                    {user.bio && (
                      <div className="mt-3 p-3 bg-slate-50/50 rounded-lg border border-slate-200/50">
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                    
                    {/* Compact Meta Info */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs sm:text-sm">
                      {user.location && (
                        <div className="flex items-center space-x-1.5 bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200/50">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                          <span className="text-slate-700 font-medium">{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5 bg-slate-100/80 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200/50">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                        <span className="text-slate-700 font-medium">Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Compact Stats Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center border border-slate-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 group-hover:text-slate-700">{posts.length + blogs.length}</div>
                        <div className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Posts</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center border border-blue-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 group-hover:text-blue-700">{user.followers_count || 0}</div>
                        <div className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Followers</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-2.5 sm:p-4 text-center border border-green-200/50 hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 group-hover:text-green-700">{user.following_count || 0}</div>
                        <div className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Following</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Content Section with Modern Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Compact Tab Navigation */}
            <div className="border-b border-slate-200/50 bg-slate-50/30 px-3 sm:px-4 lg:px-6">
              <TabsList className="bg-transparent border-0 h-auto p-0 space-x-2 sm:space-x-4">
                <TabsTrigger 
                  value="posts" 
                  data-testid="profile-posts-tab"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-slate-600 rounded-t-lg sm:rounded-t-xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 font-semibold transition-all duration-300 hover:bg-white/50 text-xs sm:text-sm"
                >
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Posts</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 bg-slate-100 text-slate-700 rounded-lg text-xs px-1.5 py-0.5">{posts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="blogs" 
                  data-testid="profile-blogs-tab"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-slate-600 rounded-t-lg sm:rounded-t-xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 font-semibold transition-all duration-300 hover:bg-white/50 text-xs sm:text-sm"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Blogs</span>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 bg-blue-100 text-blue-700 rounded-lg text-xs px-1.5 py-0.5">{blogs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="about"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-slate-600 rounded-t-lg sm:rounded-t-xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 font-semibold transition-all duration-300 hover:bg-white/50 text-xs sm:text-sm"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">About</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Compact Tab Content */}
            <div className="p-3 sm:p-4 lg:p-6">
              <TabsContent value="posts" className="mt-0">
                <div className="space-y-4 sm:space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="transition-all duration-300 hover:scale-[1.01]">
                      <PostCard post={post} onLike={() => {}} onComment={() => {}} />
                    </div>
                  ))}
                  {posts.length === 0 && (
                    <div className="text-center py-12 sm:py-16 lg:py-20">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-slate-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">No posts yet</h3>
                      <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                        {isOwnProfile ? "Share your thoughts and ideas with the world!" : `${user.name || user.username} hasn't shared any posts yet.`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="blogs" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {blogs.map((blog) => (
                    <div key={blog.id} className="transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
                      <BlogCard blog={blog} onLike={() => {}} compact />
                    </div>
                  ))}
                  {blogs.length === 0 && (
                    <div className="col-span-full text-center py-12 sm:py-16 lg:py-20">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FileText className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">No blogs yet</h3>
                      <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                        {isOwnProfile ? "Start writing and share your stories!" : `${user.name || user.username} hasn't published any blogs yet.`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                <div className="max-w-3xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {/* Compact Bio Card */}
                    {user.bio && (
                      <Card className="sm:col-span-2 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center text-base sm:text-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center mr-3 shadow-md">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            Bio
                          </h4>
                          <p className="text-slate-700 leading-relaxed text-sm sm:text-base">{user.bio}</p>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Compact Location Card */}
                    {user.location && (
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center text-base sm:text-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3 shadow-md">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            Location
                          </h4>
                          <p className="text-slate-700 font-medium text-sm sm:text-base">{user.location}</p>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Compact Birthday Card */}
                    {user.date_of_birth && (
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center text-base sm:text-lg">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mr-3 shadow-md">
                              <Calendar className="w-4 h-4 text-white" />
                            </div>
                            Birthday
                          </h4>
                          <p className="text-slate-700 font-medium text-sm sm:text-base">
                            {new Date(user.date_of_birth).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Compact Joined Card */}
                    <Card className={`bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ${user.date_of_birth ? '' : 'sm:col-span-2'}`}>
                      <CardContent className="p-4 sm:p-6">
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center text-base sm:text-lg">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center mr-3 shadow-md">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          Joined PenLink
                        </h4>
                        <p className="text-slate-700 font-medium text-sm sm:text-base">
                          {new Date(user.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal 
          user={user} 
          onClose={() => setShowEditProfile(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            setShowEditProfile(false);
          }}
        />
      )}

      {/* Edit Cover Photo Modal */}
      {showEditCover && (
        <EditCoverPhotoModal 
          user={user} 
          onClose={() => setShowEditCover(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            setShowEditCover(false);
          }}
        />
      )}

      {/* Edit Avatar Modal */}
      {showEditAvatar && (
        <EditAvatarModal 
          user={user} 
          onClose={() => setShowEditAvatar(false)}
          onUpdate={(updatedUser) => {
            setUser(updatedUser);
            setShowEditAvatar(false);
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;