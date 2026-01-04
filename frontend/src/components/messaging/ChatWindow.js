import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Circle, Bell, ArrowDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { getUserAvatarUrl } from '@/utils/imageUtils';

const ChatWindow = ({
  activeConversation,
  messages,
  user,
  getOtherParticipant,
  onlineUsers,
  formatLastSeen,
  formatTime,
  typingUsers,
  onBack,
  onSendMessage,
  onTyping,
  sending,
  checkIfNearBottom
}) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesLength = useRef(messages.length);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadBelowCount, setUnreadBelowCount] = useState(0);

  const handleBack = () => {
    navigate('/messages');
    if (onBack) {
      onBack();
    }
  };

  // Check if user is near bottom of messages
  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom); // Show button when not near bottom
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  // Only auto-scroll if user is near bottom or if it's a new message from current user
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current;
    
    if (isNewMessage && messages.length > 0) {
      // Only scroll if near bottom OR if the new message is from current user
      const lastMessage = messages[messages.length - 1];
      if (isNearBottomRef.current || lastMessage?.sender_id === user.id) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 10);
      }
    }
    
    prevMessagesLength.current = messages.length;
  }, [messages.length, user.id]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (activeConversation) {
      isNearBottomRef.current = true;
      prevMessagesLength.current = 0; // Reset message count
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 50);
    }
  }, [activeConversation?.id]);

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bell className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Messages</h2>
          <p className="text-slate-600">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const otherUser = getOtherParticipant(activeConversation);
  const isOnline = onlineUsers[otherUser?.user_id]?.online;
  const isTyping = typingUsers[activeConversation.id]?.typing && 
                   typingUsers[activeConversation.id]?.user_id !== user.id;

  return (
    <div className="flex-1 flex flex-col bg-white relative">
      {/* Chat Header - Modern Design */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-slate-100 rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Avatar className="w-12 h-12 border-2 border-slate-100">
              <AvatarImage src={getUserAvatarUrl(otherUser?.avatar_url)} />
              <AvatarFallback className="bg-slate-700 text-white font-semibold">
                {otherUser?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <Circle className="absolute bottom-0 right-0 w-3.5 h-3.5 fill-green-500 text-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">
              {otherUser?.username}
            </h2>
            <p className="text-xs text-slate-600">
              {isTyping ? (
                <span className="text-slate-700 font-medium flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-slate-700 rounded-full animate-bounce"></span>
                  typing...
                </span>
              ) : isOnline ? (
                <span className="text-green-600 font-medium">Active now</span>
              ) : (
                formatLastSeen(onlineUsers[otherUser?.user_id]?.last_seen)
              )}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
          <MoreVertical className="w-5 h-5 text-slate-600" />
        </Button>
      </div>

      {/* Messages Area - Improved Scroll */}
      <div 
        className="flex-1 overflow-y-auto p-6 bg-slate-50 pb-4" 
        ref={messageContainerRef}
        onScroll={handleScroll}
        style={{
          overscrollBehavior: 'contain'
        }}
      >
        <div className="space-y-3 max-w-4xl mx-auto">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMe={message.sender_id === user.id}
              formatTime={formatTime}
              getUserAvatarUrl={getUserAvatarUrl}
            />
          ))}

          {/* Typing Indicator - Modern Design */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white rounded-2xl px-5 py-3 shadow-md border border-slate-100">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute bottom-24 right-6 z-10 animate-fade-in">
          <Button
            onClick={scrollToBottom}
            size="icon"
            className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowDown className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Message Input - Sticky at bottom */}
      <div className="sticky bottom-0 left-0 right-0 z-20">
        <MessageInput
          activeConversation={activeConversation}
          onSendMessage={onSendMessage}
          onTyping={onTyping}
          sending={sending}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
