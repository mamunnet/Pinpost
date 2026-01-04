import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, FileText, Users, Bell, Search, LogOut, User, Settings, TrendingUp, UserPlus, HelpCircle, Shield, Mail, Menu, Wifi, WifiOff, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SearchBar } from "@/components/SearchBar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Create WebSocket URL properly
const getWebSocketUrl = (userId) => {
  const wsProtocol = BACKEND_URL.startsWith('https') ? 'wss' : 'ws';
  const wsHost = BACKEND_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${wsHost}/ws/notifications/${userId}`;
};

const NotificationsDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
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

  const showInstantNotification = (notification) => {
    // Determine notification type and customize toast
    const notificationConfig = {
      follow: {
        icon: '👤',
        type: 'success',
        description: 'started following you'
      },
      like: {
        icon: '❤️',
        type: 'default',
        description: 'liked your post'
      },
      comment: {
        icon: '💬',
        type: 'info',
        description: 'commented on your post'
      },
      reply: {
        icon: '↩️',
        type: 'info',
        description: 'replied to your comment'
      }
    };

    const config = notificationConfig[notification.type] || {
      icon: '🔔',
      type: 'default',
      description: 'sent you a notification'
    };

    // Show instant toast notification
    const toastFunction = toast[config.type] || toast;
    toastFunction(
      `${config.icon} ${notification.actor_username} ${config.description}`, {
      description: notification.message,
      duration: 5000,
      action: {
        label: "View",
        onClick: () => {
          // Navigate to relevant content if available
          if (notification.post_id) {
            if (notification.post_type === 'blog') {
              navigate(`/blog/${notification.post_id}`);
            } else {
              navigate(`/post/${notification.post_id}`);
            }
          } else if (notification.type === 'follow') {
            navigate(`/profile/${notification.actor_username}`);
          }
        }
      }
    }
    );

    // Show browser notification if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const browserNotification = new Notification(`${config.icon} PenLink`, {
        body: `${notification.actor_username} ${config.description}`,
        icon: notification.actor_avatar || '/logo192.png',
        badge: '/logo192.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });

      // Auto close browser notification after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.post_id) {
          if (notification.post_type === 'blog') {
            navigate(`/blog/${notification.post_id}`);
          } else {
            navigate(`/post/${notification.post_id}`);
          }
        } else if (notification.type === 'follow') {
          navigate(`/profile/${notification.actor_username}`);
        }
        browserNotification.close();
      };
    }

    // Play subtle notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiE0fHNeSsFJG++7t6QQAoUVKzn6rRLFws=');
      audio.volume = 0.3;
      audio.play().catch(() => { }); // Ignore errors if audio doesn't work
    } catch (error) {
      // Ignore audio errors
    }
  };

  // WebSocket connection for real-time notifications
  // WebSocket connection for real-time notifications
  useEffect(() => {
    // Only proceed if we have a valid user ID. 
    // Using user?.id in dependency array prevents re-running on other user object changes.
    if (!user?.id) return;

    fetchNotifications();

    let isMounted = true;
    let connectTimeout;

    // Create WebSocket connection with proper error handling
    const connectWebSocket = () => {
      if (!isMounted) return;

      // Prevent multiple connections
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        const wsUrl = getWebSocketUrl(user.id);
        console.log('🔗 Connecting to WebSocket:', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) {
            ws.close();
            return;
          }
          setWsConnected(true);

          // Send periodic ping to keep connection alive
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 30000);

          ws.pingInterval = pingInterval;
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            if (event.data === 'pong') return; // Ignore pong responses

            const data = JSON.parse(event.data);

            if (data.type === 'new_notification') {
              const notification = data.notification;
              setNotifications(prev => [notification, ...prev]);
              setUnreadCount(prev => prev + 1);
              showInstantNotification(notification);
            }
          } catch (error) {
            // Silently handle parsing errors
          }
        };

        ws.onerror = (error) => {
          if (!isMounted) return;
          setWsConnected(false);
        };

        ws.onclose = (event) => {
          if (!isMounted) return;
          setWsConnected(false);
          if (ws.pingInterval) {
            clearInterval(ws.pingInterval);
          }
          wsRef.current = null;

          // Only reconnect if the component is still mounted and it wasn't a clean close
          if (event.code !== 1000 && event.code !== 1001 && document.visibilityState === 'visible') {
            // Add a small jitter to prevent thundering herd
            const delay = 3000 + Math.random() * 2000;
            setTimeout(() => {
              if (isMounted && user?.id) connectWebSocket();
            }, delay);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setWsConnected(false);
      }
    };

    // Debounce initial connection to handle React Strict Mode double-invocation
    connectTimeout = setTimeout(connectWebSocket, 100);

    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      isMounted = false;
      clearTimeout(connectTimeout);
      if (wsRef.current) {
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        // Force close immediately
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.id]);


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
        <button className="relative p-2 hover:bg-gray-100 rounded-full group" data-testid="notifications-bell">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-rose-600 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* WebSocket connection indicator */}
          <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`} title={wsConnected ? 'Real-time connected' : 'Offline mode'}></div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-rose-50 to-pink-50">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {wsConnected && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <Wifi className="w-3 h-3" />
                <span>Live</span>
              </div>
            )}
          </div>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500"><Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>No notifications</p></div>
          ) : (
            notifications.map((notif) => (
              <button key={notif.id} onClick={() => handleNotificationClick(notif)} className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 border-b text-left transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}>
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

export { NotificationsDropdown };

export const Header = ({ user, logout }) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navScrollRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread messages count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadMessages = async () => {
      try {
        const res = await axios.get(`${API}/conversations/unread-count`);
        setUnreadMessages(res.data.unread_count || 0);
      } catch (error) {
        console.error('Failed to fetch unread messages');
      }
    };

    fetchUnreadMessages();
  }, [user]);

  // Enable smooth scrolling with mouse drag
  useEffect(() => {
    const navScroll = navScrollRef.current;
    if (!navScroll) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const handleMouseDown = (e) => {
      isDown = true;
      navScroll.classList.add('cursor-grabbing');
      startX = e.pageX - navScroll.offsetLeft;
      scrollLeft = navScroll.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      navScroll.classList.remove('cursor-grabbing');
    };

    const handleMouseUp = () => {
      isDown = false;
      navScroll.classList.remove('cursor-grabbing');
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - navScroll.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed
      navScroll.scrollLeft = scrollLeft - walk;
    };

    navScroll.addEventListener('mousedown', handleMouseDown);
    navScroll.addEventListener('mouseleave', handleMouseLeave);
    navScroll.addEventListener('mouseup', handleMouseUp);
    navScroll.addEventListener('mousemove', handleMouseMove);

    return () => {
      navScroll.removeEventListener('mousedown', handleMouseDown);
      navScroll.removeEventListener('mouseleave', handleMouseLeave);
      navScroll.removeEventListener('mouseup', handleMouseUp);
      navScroll.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Check if current path matches the nav item
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 shadow-sm">
      {/* Mobile Header - Condensed single row (logo + search + notifications) */}
      {/* Mobile Header - Facebook Style */}
      <div className="lg:hidden bg-white shadow-sm z-50">
        {/* Top Row: Logo & Actions */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Pinpost
          </Link>

          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-2 rounded-full">
              <Search className="w-5 h-5 text-gray-700" />
            </div>

            {/* Messages Icon */}
            <Link to="/messages" className="relative bg-gray-100 p-2 rounded-full text-gray-700">
              <MessageCircle className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center border-2 border-white">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {user && <NotificationsDropdown user={user} />}
          </div>
        </div>

        {/* Bottom Row: Navigation Tabs */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link to="/" className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${isActive('/') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <Home className={`w-6 h-6 ${isActive('/') ? 'fill-current' : ''}`} />
          </Link>

          <Link to="/social" className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${isActive('/social') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <Users className={`w-6 h-6 ${isActive('/social') ? 'fill-current' : ''}`} />
          </Link>

          <Link to="/blogs" className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${isActive('/blogs') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <FileText className={`w-6 h-6 ${isActive('/blogs') ? 'fill-current' : ''}`} />
          </Link>

          <Link to="/trending" className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${isActive('/trending') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <TrendingUp className={`w-6 h-6 ${isActive('/trending') ? 'fill-current' : ''}`} />
          </Link>

          <Link to="/menu" className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${isActive('/menu') ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
            <Menu className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Desktop Header - Full two-row layout */}
      <div className="hidden lg:block">
        {/* Top Bar with Logo */}
        <div className="bg-slate-100 border-b border-slate-300">
          <div className="w-full px-3 sm:px-6">
            <div className="flex items-center justify-between h-12">
              <Link to="/" className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-base">P</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">PenLink</span>
              </Link>

              {/* Right Side - Search and Notifications */}
              <div className="flex items-center gap-2">
                {/* Desktop Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search PenLink..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white border-slate-300 focus:border-slate-400 focus:ring-slate-300"
                  />
                </div>

                {/* Notifications Dropdown */}
                {user && <NotificationsDropdown user={user} />}

                {/* Messages Icon */}
                <Link
                  to="/messages"
                  className={`relative p-2 rounded-full transition-all flex-shrink-0 ${isActive('/messages')
                    ? 'bg-slate-800 text-white'
                    : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  data-testid="messages-btn"
                >
                  <Mail className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold shadow-md">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Menu Icon */}
                <Link
                  to="/menu"
                  className={`relative p-2 rounded-full transition-all flex-shrink-0 ${isActive('/menu')
                    ? 'bg-slate-800 text-white'
                    : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  data-testid="menu-btn"
                >
                  <Menu className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation - Desktop Only */}
        <div className="w-full">
          <div className="flex items-center h-16 px-3 sm:px-6 gap-3 sm:gap-6 bg-white border-b border-slate-200/60 shadow-sm">
            {/* Left Navigation - Horizontal Scroll */}
            <nav
              ref={navScrollRef}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide cursor-grab select-none flex-1 lg:flex-initial"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
            >
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 flex-shrink-0 border shadow-sm hover:shadow ${isActive('/')
                  ? 'bg-slate-200 text-slate-900 border-slate-300'
                  : 'hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-transparent hover:border-slate-300'
                  }`}
                style={{ scrollSnapAlign: 'start' }}
                data-testid="nav-home"
              >
                <Home className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-medium text-sm sm:text-base">Home</span>
              </Link>

              <Link
                to="/social"
                className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 flex-shrink-0 border shadow-sm hover:shadow ${isActive('/social')
                  ? 'bg-slate-200 text-slate-900 border-slate-300'
                  : 'hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-transparent hover:border-slate-300'
                  }`}
                style={{ scrollSnapAlign: 'start' }}
                data-testid="nav-social"
              >
                <Users className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-medium text-sm sm:text-base">Social</span>
              </Link>

              <Link
                to="/blogs"
                className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 flex-shrink-0 border shadow-sm hover:shadow ${isActive('/blogs') || isActive('/blog')
                  ? 'bg-slate-200 text-slate-900 border-slate-300'
                  : 'hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-transparent hover:border-slate-300'
                  }`}
                style={{ scrollSnapAlign: 'start' }}
                data-testid="nav-blogs"
              >
                <FileText className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-medium text-sm sm:text-base">Blogs</span>
              </Link>

              <Link
                to="/trending"
                className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 flex-shrink-0 border shadow-sm hover:shadow ${isActive('/trending')
                  ? 'bg-slate-200 text-slate-900 border-slate-300'
                  : 'hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-transparent hover:border-slate-300'
                  }`}
                style={{ scrollSnapAlign: 'start' }}
                data-testid="nav-trending"
              >
                <TrendingUp className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-medium text-sm sm:text-base">Trending</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
