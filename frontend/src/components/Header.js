import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, FileText, Users, Bell, Search, Plus, LogOut, User, Settings, TrendingUp, UserPlus, HelpCircle, Shield, Mail } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateContentModal = ({ onClose }) => {
  const [contentType, setContentType] = useState('post');
  const [postContent, setPostContent] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error('Please write something');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/posts`, { content: postContent });
      toast.success('Post created!');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/blogs`, {
        title: blogTitle,
        content: blogContent,
        excerpt: blogExcerpt,
        tags: blogTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Blog published!');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error('Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex border-b">
        <button onClick={() => setContentType('post')} className={`px-4 py-2 font-medium ${contentType === 'post' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-600'}`}>Quick Post</button>
        <button onClick={() => setContentType('blog')} className={`px-4 py-2 font-medium ${contentType === 'blog' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-600'}`}>Blog Article</button>
      </div>
      {contentType === 'post' ? (
        <div className="space-y-4">
          <Textarea placeholder="What's on your mind?" value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={4} />
          <Button onClick={handleCreatePost} disabled={loading} className="w-full">Post</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input placeholder="Blog title" value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} />
          <Input placeholder="Brief description" value={blogExcerpt} onChange={(e) => setBlogExcerpt(e.target.value)} />
          <Textarea placeholder="Write your blog content..." value={blogContent} onChange={(e) => setBlogContent(e.target.value)} rows={10} />
          <Input placeholder="Tags (comma separated)" value={blogTags} onChange={(e) => setBlogTags(e.target.value)} />
          <Button onClick={handleCreateBlog} disabled={loading} className="w-full">Publish Blog</Button>
        </div>
      )}
    </div>
  );
};

const NotificationsDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        axios.get(`${API}/notifications`),
        axios.get(`${API}/notifications/unread-count`)
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`);
      fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await axios.put(`${API}/notifications/${notif.id}/read`);
      }
      if (notif.post_id) {
        if (notif.post_type === 'blog') {
          navigate(`/blog/${notif.post_id}`);
        } else {
          navigate('/social');
        }
      } else if (notif.type === 'follow') {
        navigate(`/profile/${notif.actor_username}`);
      }
      setOpen(false);
      fetchNotifications();
    } catch (error) {
      console.error('Error');
    }
  };

  const formatTime = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-full" data-testid="notifications-bell">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-rose-600">{unreadCount > 9 ? '9+' : unreadCount}</Badge>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500"><Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>No notifications</p></div>
          ) : (
            notifications.map((notif) => (
              <button key={notif.id} onClick={() => handleNotificationClick(notif)} className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 border-b text-left ${!notif.read ? 'bg-blue-50' : ''}`}>
                <div className="text-2xl">{notif.type === 'follow' ? '👤' : notif.type === 'like' ? '❤️' : '💬'}</div>
                <div className="flex-1"><p className="text-sm"><span className="font-semibold">{notif.actor_username}</span> {notif.message.replace(notif.actor_username, '').trim()}</p><p className="text-xs text-gray-500 mt-1">{formatTime(notif.created_at)}</p></div>
                {!notif.read && <div className="w-2 h-2 bg-rose-600 rounded-full mt-2"></div>}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export const Header = ({ user, logout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  return (
    <header className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link to="/" className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xl flex-shrink-0 shadow-lg">P</Link>
            <nav className="nav-scroll flex items-center gap-2 sm:gap-3 scrollbar-hide" style={{maxWidth: '400px', minWidth: '250px'}}>
              <Link to="/" className="flex items-center space-x-2 px-4 sm:px-5 py-3 rounded-xl hover:bg-gray-100 text-gray-700 whitespace-nowrap transition-all duration-200 flex-shrink-0" data-testid="nav-home">
                <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden md:inline font-semibold text-base">Home</span>
              </Link>
              <Link to="/social" className="flex items-center space-x-2 px-4 sm:px-5 py-3 rounded-xl hover:bg-gray-100 text-gray-700 whitespace-nowrap transition-all duration-200 flex-shrink-0" data-testid="nav-social">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden md:inline font-semibold text-base">Social</span>
              </Link>
              <Link to="/blogs" className="flex items-center space-x-2 px-4 sm:px-5 py-3 rounded-xl hover:bg-gray-100 text-gray-700 whitespace-nowrap transition-all duration-200 flex-shrink-0" data-testid="nav-blogs">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden md:inline font-semibold text-base">Blogs</span>
              </Link>
              <Link to="/trending" className="flex items-center space-x-2 px-4 sm:px-5 py-3 rounded-xl hover:bg-gray-100 text-gray-700 whitespace-nowrap transition-all duration-200 flex-shrink-0" data-testid="nav-trending">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden md:inline font-semibold text-base">Trending</span>
              </Link>
            </nav>
          </div>
          <div className="hidden lg:block flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                type="text" 
                placeholder="Search PenLink..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10 bg-gray-100 border-none" 
              />
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <NotificationsDropdown user={user} />
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all" data-testid="user-menu-btn">
                    <Avatar className="w-8 h-8 ring-2 ring-gray-200">
                      <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-sm font-semibold">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium text-gray-700">{user.username}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="end">
                  <div className="bg-white rounded-lg shadow-lg border">
                    {/* User Info Section */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-lg font-bold">
                            {user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="py-2">
                      <Link to={`/profile/${user.username}`}>
                        <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                          <User className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">My Profile</p>
                            <p className="text-xs text-gray-500">View and edit your profile</p>
                          </div>
                        </button>
                      </Link>

                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                        <UserPlus className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Create Group</p>
                          <p className="text-xs text-gray-500">Start a new community</p>
                        </div>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                        <Settings className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Settings</p>
                          <p className="text-xs text-gray-500">Privacy and account settings</p>
                        </div>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                        <HelpCircle className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Help & Support</p>
                          <p className="text-xs text-gray-500">Get help and contact us</p>
                        </div>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Privacy Policy</p>
                          <p className="text-xs text-gray-500">Review our terms and policies</p>
                        </div>
                      </button>

                      <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Feedback</p>
                          <p className="text-xs text-gray-500">Share your thoughts with us</p>
                        </div>
                      </button>

                      <div className="border-t border-gray-100 mt-2">
                        <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 text-left transition-colors text-red-600" data-testid="logout-btn">
                          <LogOut className="w-5 h-5" />
                          <div>
                            <p className="font-medium">Sign Out</p>
                            <p className="text-xs text-red-500">Sign out of your account</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
