import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Edit, Camera, User, MessageCircle, FileText, MapPin, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { BlogCard } from "@/components/BlogCard";
import { EditProfileModal } from "@/components/EditProfileModal";
import { EditCoverPhotoModal } from "@/components/EditCoverPhotoModal";
import { EditAvatarModal } from "@/components/EditAvatarModal";

const API = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api`;

const ProfilePage = ({ currentUser }) => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCover, setShowEditCover] = useState(false);
  const [showEditAvatar, setShowEditAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const [userRes, blogsRes, postsRes] = await Promise.all([
        axios.get(`${API}/users/${username}`),
        axios.get(`${API}/users/${username}/blogs`),
        axios.get(`${API}/users/${username}/posts`)
      ]);
      setUser(userRes.data);
      setBlogs(blogsRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-rose-50/30 to-amber-50/20 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section with Cover & Profile */}
        <div className="relative mb-4">
          {/* Cover Photo with Modern Gradient Overlay */}
          <div className="relative h-36 sm:h-48 lg:h-56 rounded-2xl overflow-hidden shadow-xl">
            {user.cover_photo ? (
              <>
                <img 
                  src={user.cover_photo} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-400 via-pink-500 to-amber-400 relative">
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="5" cy="5" r="1" fill="white" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
              </div>
            )}
            
            {isOwnProfile && (
              <button
                onClick={() => setShowEditCover(true)}
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">{user.cover_photo ? 'Edit Cover' : 'Add Cover'}</span>
              </button>
            )}
          </div>

          {/* Profile Card - Overlapping Design */}
          <div className="relative px-4 sm:px-6 -mt-12 sm:-mt-14">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                  {/* Avatar */}
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl bg-gradient-to-br from-rose-500 to-amber-500">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name || user.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold">
                          {(user.name || user.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowEditAvatar(true)}
                        className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center transition-colors shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                          {user.name || user.username}
                        </h1>
                        {user.name && (
                          <p className="text-gray-500 text-sm sm:text-base">@{user.username}</p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isOwnProfile ? (
                          <Button
                            onClick={() => setShowEditProfile(true)}
                            className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            <span>Edit Profile</span>
                          </Button>
                        ) : (
                          currentUser && (
                            <Button
                              onClick={handleFollow}
                              className={user.is_following 
                                ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300" 
                                : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg"
                              }
                              data-testid="follow-btn"
                            >
                              {user.is_following ? 'Following' : 'Follow'}
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-gray-700 mt-2 text-sm leading-relaxed line-clamp-2">{user.bio}</p>
                    )}
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                      {user.location && (
                        <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-4 h-4 text-rose-600" />
                        <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-2.5 sm:p-3 text-center border border-rose-100 hover:shadow-md transition-shadow">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{posts.length + blogs.length}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Posts</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-2.5 sm:p-3 text-center border border-amber-100 hover:shadow-md transition-shadow">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{user.followers_count || 0}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Followers</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-3 text-center border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{user.following_count || 0}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Following</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section with Modern Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Modern Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50/50 px-4 sm:px-8">
              <TabsList className="bg-transparent border-0 h-auto p-0 space-x-2 sm:space-x-4">
                <TabsTrigger 
                  value="posts" 
                  data-testid="profile-posts-tab"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-t-lg px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Posts</span>
                  <Badge variant="secondary" className="ml-2 bg-rose-100 text-rose-700">{posts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="blogs" 
                  data-testid="profile-blogs-tab"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-t-lg px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Blogs</span>
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">{blogs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="about"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-b-2 data-[state=active]:border-rose-600 rounded-t-lg px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">About</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              <TabsContent value="posts" className="mt-0">
                <div className="space-y-4 sm:space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onLike={() => {}} onComment={() => {}} />
                  ))}
                  {posts.length === 0 && (
                    <div className="text-center py-16 sm:py-20">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                        {isOwnProfile ? "Share your thoughts and ideas with the world!" : `${user.name || user.username} hasn't shared any posts yet.`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="blogs" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {blogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} onLike={() => {}} compact />
                  ))}
                  {blogs.length === 0 && (
                    <div className="col-span-full text-center py-16 sm:py-20">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No blogs yet</h3>
                      <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                        {isOwnProfile ? "Start writing and share your stories!" : `${user.name || user.username} hasn't published any blogs yet.`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                <div className="max-w-3xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Bio Card */}
                    {user.bio && (
                      <div className="sm:col-span-2 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-lg">
                          <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          Bio
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                      </div>
                    )}
                    
                    {/* Location Card */}
                    {user.location && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          Location
                        </h4>
                        <p className="text-gray-700">{user.location}</p>
                      </div>
                    )}
                    
                    {/* Birthday Card */}
                    {user.date_of_birth && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          Birthday
                        </h4>
                        <p className="text-gray-700">
                          {new Date(user.date_of_birth).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                    
                    {/* Joined Card */}
                    <div className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100 ${user.date_of_birth ? '' : 'sm:col-span-2'}`}>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        Joined PenLink
                      </h4>
                      <p className="text-gray-700">
                        {new Date(user.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
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