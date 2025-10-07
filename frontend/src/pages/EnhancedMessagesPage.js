import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Send, Search, MoreVertical, ArrowLeft, Check, CheckCheck, 
  Bell, Smile, Image as ImageIcon, Circle, Heart, UserPlus, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserAvatarUrl } from '@/utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EnhancedMessagesPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ws, setWs] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await axios.get(`${API}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications', error);
      toast.error('Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/conversations`);
      const convs = response.data;
      setConversations(convs);
      
      // Fetch online status for all participants
      const userIds = [...new Set(convs.flatMap(c => c.participants))];
      userIds.forEach(async (uid) => {
        try {
          const statusRes = await axios.get(`${API}/users/${uid}/status`);
          setOnlineUsers(prev => ({
            ...prev,
            [uid]: statusRes.data
          }));
        } catch (err) {
          console.error('Failed to fetch user status', err);
        }
      });
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API}/conversations/${conversationId}/messages`);
      setMessages(response.data);
      scrollToBottom();
      
      // Mark conversation as read
      await axios.put(`${API}/conversations/${conversationId}/read`);
      
      // Update unread count in conversation list
      setConversations(prevConvs => 
        prevConvs.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: { ...conv.unread_count, [user.id]: 0 } }
            : conv
        )
      );
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  // Send typing indicator
  const handleTyping = () => {
    if (!activeConversation) return;
    
    // Send typing=true immediately
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        conversation_id: activeConversation.id,
        typing: true
      }));
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to send typing=false after 2 seconds
    const timeout = setTimeout(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'typing',
          conversation_id: activeConversation.id,
          typing: false
        }));
      }
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const response = await axios.post(`${API}/messages`, {
        content: messageInput,
        conversation_id: activeConversation.id
      });
      
      setMessages([...messages, response.data]);
      setMessageInput('');
      scrollToBottom();
      
      // Stop typing indicator
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'typing',
          conversation_id: activeConversation.id,
          typing: false
        }));
      }
      
      // Update conversation's last message in list
      setConversations(prevConvs =>
        prevConvs.map(conv =>
          conv.id === activeConversation.id
            ? { ...conv, last_message: messageInput, last_message_at: new Date().toISOString() }
            : conv
        ).sort((a, b) => new Date(b.last_message_at || b.updated_at) - new Date(a.last_message_at || a.updated_at))
      );
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // WebSocket setup
  useEffect(() => {
    if (!user) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = BACKEND_URL.replace('http://', '').replace('https://', '');
    const websocket = new WebSocket(`${wsProtocol}//${wsHost}/ws/notifications/${user.id}`);

    websocket.onopen = () => {
      console.log('WebSocket connected for messages');
    };

    websocket.onmessage = (event) => {
      if (event.data === 'pong') return;
      
      try {
        const data = JSON.parse(event.data);
        
        // Handle new messages
        if (data.type === 'new_message') {
          const newMessage = data.message;
          
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
            axios.put(`${API}/messages/${newMessage.id}/read`);
          } else {
            setConversations(prevConvs => {
              const updated = prevConvs.map(conv => {
                if (conv.id === data.conversation_id) {
                  return {
                    ...conv,
                    last_message: newMessage.content,
                    last_message_at: newMessage.created_at,
                    unread_count: {
                      ...conv.unread_count,
                      [user.id]: (conv.unread_count[user.id] || 0) + 1
                    }
                  };
                }
                return conv;
              });
              return updated.sort((a, b) => 
                new Date(b.last_message_at || b.updated_at) - 
                new Date(a.last_message_at || a.updated_at)
              );
            });
            
            toast.info(`💬 ${newMessage.sender_username}`, {
              description: newMessage.content,
              duration: 4000
            });
          }
        }
        
        // Handle user online/offline status
        if (data.type === 'user_status') {
          setOnlineUsers(prev => ({
            ...prev,
            [data.user_id]: {
              online: data.online,
              last_seen: data.last_seen
            }
          }));
        }
        
        // Handle typing indicators
        if (data.type === 'typing_status') {
          setTypingUsers(prev => ({
            ...prev,
            [data.conversation_id]: {
              user_id: data.user_id,
              typing: data.typing
            }
          }));
          
          // Clear typing after 3 seconds
          if (data.typing) {
            setTimeout(() => {
              setTypingUsers(prev => ({
                ...prev,
                [data.conversation_id]: { ...prev[data.conversation_id], typing: false }
              }));
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user, activeConversation]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get other participant details
  const getOtherParticipant = (conversation) => {
    if (!conversation || !user) return null;
    return conversation.participant_details.find(p => p.user_id !== user.id);
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Format last seen
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Offline';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Active now';
    if (minutes < 60) return `Active ${minutes}m ago`;
    if (hours < 24) return `Active ${hours}h ago`;
    if (days === 1) return 'Active yesterday';
    if (days < 7) return `Active ${days}d ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get message status icon
  const getMessageStatusIcon = (message) => {
    if (message.sender_id !== user.id) return null;
    
    const isRead = message.read_by && message.read_by.length > 1;
    const isDelivered = message.delivered_to && message.delivered_to.length > 0;
    
    if (isRead) {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    } else if (isDelivered) {
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    } else {
      return <Check className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    await markNotificationAsRead(notification.id);
    setShowNotifications(false);
    
    if (notification.post_id) {
      navigate(`/posts/${notification.post_id}`);
    } else if (notification.blog_id) {
      navigate(`/blogs/${notification.blog_id}`);
    } else if (notification.sender_id) {
      navigate(`/profile/${notification.sender_id}`);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <Header user={user} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className={`${activeConversation ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-slate-200 flex flex-col bg-white`}>
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Chats</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowNotifications(true);
                fetchNotifications();
              }}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </div>

          <div className="px-4 py-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-200"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">No conversations yet</p>
              </div>
            ) : (
              <div>
                {filteredConversations.map(conv => {
                  const other = getOtherParticipant(conv);
                  const isOnline = onlineUsers[other?.user_id]?.online;
                  const unreadCount = conv.unread_count?.[user.id] || 0;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv);
                        fetchMessages(conv.id);
                      }}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 border-b border-slate-100 ${
                        activeConversation?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={getUserAvatarUrl(other?.avatar_url)} />
                          <AvatarFallback>{other?.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <Circle className="absolute bottom-0 right-0 w-4 h-4 fill-green-500 text-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {other?.username}
                          </h3>
                          <span className="text-xs text-slate-500">
                            {formatTime(conv.last_message_at || conv.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600 truncate">
                            {conv.last_message || 'No messages yet'}
                          </p>
                          {unreadCount > 0 && (
                            <Badge className="ml-2 bg-blue-500">{unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-slate-50">
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setActiveConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getUserAvatarUrl(getOtherParticipant(activeConversation)?.avatar_url)} />
                    <AvatarFallback>
                      {getOtherParticipant(activeConversation)?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers[getOtherParticipant(activeConversation)?.user_id]?.online && (
                    <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {getOtherParticipant(activeConversation)?.username}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {onlineUsers[getOtherParticipant(activeConversation)?.user_id]?.online
                      ? 'Active now'
                      : formatLastSeen(onlineUsers[getOtherParticipant(activeConversation)?.user_id]?.last_seen)
                    }
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMe = message.sender_id === user.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-slate-900'} rounded-2xl px-4 py-2 shadow-sm`}>
                        <p className="text-sm break-words">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
                            {formatTime(message.created_at)}
                          </span>
                          {isMe && getMessageStatusIcon(message)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {typingUsers[activeConversation.id]?.typing && 
                 typingUsers[activeConversation.id]?.user_id !== user.id && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input - Sticky */}
            <div className="bg-white border-t border-slate-200 p-4 flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 border-slate-200"
              />
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!messageInput.trim() || sending}
                size="icon"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Your Messages</h2>
              <p className="text-slate-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Notifications Modal */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          
          {notificationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-slate-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMessagesPage;
