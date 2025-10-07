import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useMessaging = (user) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ws, setWs] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [searchParams] = useSearchParams();

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
      setShouldAutoScroll(true);
      
      // Mark conversation as read
      await axios.put(`${API}/conversations/${conversationId}/read`).catch(err => console.error('Mark read failed:', err));
      
      // Mark all messages as read
      response.data.forEach(msg => {
        if (msg.sender_id !== user.id && (!msg.read_by || !msg.read_by.includes(user.id))) {
          axios.put(`${API}/messages/${msg.id}/read`).catch(err => console.error('Mark message read failed:', err));
        }
      });
      
      // Update unread count
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
    if (!activeConversation || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
      type: 'typing',
      conversation_id: activeConversation.id,
      typing: true
    }));
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
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
  const sendMessage = async (messageData) => {
    if (!activeConversation || sending) return;

    setSending(true);
    try {
      const response = await axios.post(`${API}/messages`, {
        ...messageData,
        conversation_id: activeConversation.id
      });
      
      setMessages(prev => [...prev, response.data]);
      setShouldAutoScroll(true);
      
      // Stop typing indicator
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'typing',
          conversation_id: activeConversation.id,
          typing: false
        }));
      }
      
      // Update conversation's last message
      setConversations(prevConvs =>
        prevConvs.map(conv =>
          conv.id === activeConversation.id
            ? { 
                ...conv, 
                last_message: messageData.content || (messageData.type === 'image' ? '📷 Photo' : '🎤 Voice message'), 
                last_message_at: new Date().toISOString() 
              }
            : conv
        ).sort((a, b) => new Date(b.last_message_at || b.updated_at) - new Date(a.last_message_at || a.updated_at))
      );
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Check if near bottom for auto-scroll
  const checkIfNearBottom = () => {
    return true; // Simplified for now
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
        
        if (data.type === 'new_message') {
          const newMessage = data.message;
          
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            setMessages(prev => [...prev, newMessage]);
            axios.put(`${API}/messages/${newMessage.id}/read`).catch(err => console.error('Failed to mark as read:', err));
          } else {
            setConversations(prevConvs => {
              const updated = prevConvs.map(conv => {
                if (conv.id === data.conversation_id) {
                  return {
                    ...conv,
                    last_message: newMessage.content || '📷 Photo',
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
              description: newMessage.content || '📷 Sent a photo',
              duration: 4000
            });
          }
        }
        
        if (data.type === 'user_status') {
          setOnlineUsers(prev => ({
            ...prev,
            [data.user_id]: {
              online: data.online,
              last_seen: data.last_seen
            }
          }));
        }
        
        if (data.type === 'typing_status') {
          if (data.conversation_id === activeConversation?.id && data.user_id !== user.id) {
            setTypingUsers(prev => ({
              ...prev,
              [data.conversation_id]: {
                user_id: data.user_id,
                typing: data.typing
              }
            }));
            
            if (data.typing) {
              setTimeout(() => {
                setTypingUsers(prev => ({
                  ...prev,
                  [data.conversation_id]: { ...prev[data.conversation_id], typing: false }
                }));
              }, 3000);
            }
          }
        }
        
        if (data.type === 'message_status') {
          setMessages(prev => prev.map(msg => {
            if (msg.id === data.message_id) {
              return {
                ...msg,
                delivered_to: data.delivered_to || msg.delivered_to,
                read_by: data.read_by || msg.read_by
              };
            }
            return msg;
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.warn('WebSocket connection error - will retry');
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected - will reconnect on next interaction');
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

  // Handle URL parameters
  useEffect(() => {
    if (conversations.length > 0) {
      const conversationId = searchParams.get('conversation');
      const userId = searchParams.get('user');
      
      if (conversationId) {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
          setActiveConversation(conv);
          fetchMessages(conv.id);
        }
      } else if (userId) {
        const conv = conversations.find(c => 
          c.participants.includes(userId) && c.participants.includes(user.id)
        );
        if (conv) {
          setActiveConversation(conv);
          fetchMessages(conv.id);
        }
      } else {
        // No URL parameters - clear active conversation to show list
        setActiveConversation(null);
        setMessages([]);
      }
    }
  }, [conversations, searchParams, user]);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    sending,
    onlineUsers,
    typingUsers,
    shouldAutoScroll,
    fetchMessages,
    sendMessage,
    handleTyping,
    checkIfNearBottom
  };
};
