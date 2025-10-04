import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, FileText, Users, Bell, Search, Plus, LogOut, User, Settings } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateContentModal = () => {
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
      setPostContent('');
      window.location.reload();
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
      setBlogTitle('');
      setBlogContent('');
      setBlogExcerpt('');
      setBlogTags('');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setContentType('post')}
          className={`px-4 py-2 font-medium transition-colors ${
            contentType === 'post'
              ? 'border-b-2 border-rose-600 text-rose-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Quick Post
        </button>
        <button
          onClick={() => setContentType('blog')}
          className={`px-4 py-2 font-medium transition-colors ${
            contentType === 'blog'
              ? 'border-b-2 border-rose-600 text-rose-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Blog Article
        </button>
      </div>

      {contentType === 'post' ? (
        <div className="space-y-4">
          <textarea
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <Button onClick={handleCreatePost} disabled={loading} className="w-full">
            Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="Enter blog title"
            value={blogTitle}
            onChange={(e) => setBlogTitle(e.target.value)}
          />
          <Input
            placeholder="Brief description"
            value={blogExcerpt}
            onChange={(e) => setBlogExcerpt(e.target.value)}
          />
          <textarea
            placeholder="Write your blog content..."
            value={blogContent}
            onChange={(e) => setBlogContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <Input
            placeholder="Tags (comma separated)"
            value={blogTags}
            onChange={(e) => setBlogTags(e.target.value)}
          />
          <Button onClick={handleCreateBlog} disabled={loading} className="w-full">
            Publish Blog
          </Button>
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
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
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
      console.error('Error handling notification');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      follow: '👤',
      like: '❤️',
      comment: '💬',
      reply: '↩️'
    };
    return icons[type] || '🔔';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" data-testid="notifications-bell">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-rose-600">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors border-b ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-2xl">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-1 text-left">
                    <p className="text-sm">
                      <span className="font-semibold">{notif.actor_username}</span>{' '}
                      {notif.message.replace(notif.actor_username, '').trim()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(notif.created_at)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 bg-rose-600 rounded-full mt-2"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export const Header = ({ user, logout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now, just navigate to home
      toast.info('Search feature coming soon!');
    }
  };

  return (
    <header className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                PenLink
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </Link>
              <Link
                to="/social"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Social</span>
              </Link>
              <Link
                to="/blogs"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">Blogs</span>
              </Link>
            </nav>
          </div>

          {/* Center: Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md mx-4">
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
          </form>

          {/* Right: Actions */}
          {user && (
            <div className="flex items-center space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" className="gap-2" data-testid="create-content-btn">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Content</DialogTitle>
                  </DialogHeader>
                  <CreateContentModal />
                </DialogContent>
              </Dialog>

              <NotificationsDropdown user={user} />

              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-1" data-testid="user-menu-btn">
                    <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-rose-500 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-1">
                    <Link to={`/profile/${user.username}`}>
                      <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left">
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                    </Link>
                    <Link to="/settings">
                      <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left text-red-600"
                      data-testid="logout-btn"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
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
