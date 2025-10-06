import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Search, MoreVertical, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getUserAvatarUrl } from '@/utils/imageUtils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessagesPage = ({ user }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/conversations`);
      setConversations(response.data);
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
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message') {
        const newMessage = data.message;
        
        // If message is for active conversation, add it to messages
        if (activeConversation && newMessage.conversation_id === activeConversation.id) {
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
          
          // Mark as read immediately
          axios.put(`${API}/messages/${newMessage.id}/read`);
        } else {
          // Update conversation list with new message
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
          
          // Show notification
          toast.info(`💬 ${newMessage.sender_username}`, {
            description: newMessage.content,
            duration: 4000
          });
        }
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
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Conversations List - Left Sidebar */}
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-slate-200 bg-white flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <p className="text-slate-500 mb-2">No conversations yet</p>
              <p className="text-sm text-slate-400">Start messaging users you mutually follow</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const other = getOtherParticipant(conversation);
              const unreadCount = conversation.unread_count?.[user.id] || 0;
              const isActive = activeConversation?.id === conversation.id;

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setActiveConversation(conversation);
                    fetchMessages(conversation.id);
                  }}
                  className={`w-full flex items-center space-x-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    isActive ? 'bg-slate-100' : ''
                  }`}
                >
                  <Avatar className="w-12 h-12 ring-2 ring-white">
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold">
                      {other?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-900">{other?.username}</p>
                      {conversation.last_message_at && (
                        <span className="text-xs text-slate-400">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600 truncate max-w-[200px]">
                        {conversation.last_message || 'Start a conversation'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Area - Right Side */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setActiveConversation(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold">
                {getOtherParticipant(activeConversation)?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">
                {getOtherParticipant(activeConversation)?.username}
              </h2>
              <p className="text-xs text-slate-500">Active now</p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </Button>
          </div>

          {/* Messages Container */}
          <div
            ref={messageContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          >
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user.id;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              const isRead = message.read_by?.length > 1; // More than just sender

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                >
                  {!isOwn && showAvatar && (
                    <Avatar className="w-8 h-8 mb-1">
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-xs">
                        {message.sender_username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8" />}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-900'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    <div className="flex items-center space-x-1 mt-1 px-2">
                      <span className="text-xs text-slate-400">
                        {formatTime(message.created_at)}
                      </span>
                      {isOwn && (
                        <span className="text-xs text-slate-400">
                          {isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOwn && showAvatar && (
                    <Avatar className="w-8 h-8 mb-1">
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-xs">
                        {user.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {isOwn && !showAvatar && <div className="w-8" />}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex space-x-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1 border-slate-200 focus:border-slate-400"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!messageInput.trim() || sending}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Send className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Your Messages</h2>
            <p className="text-slate-500">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
