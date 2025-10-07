import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Circle, Bell } from 'lucide-react';
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

  const handleBack = () => {
    navigate('/messages');
    if (onBack) {
      onBack();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
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
    <div className="flex-1 flex flex-col bg-white">
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
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
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
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-bounce"></span>
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
        className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white" 
        ref={messageContainerRef}
        onScroll={checkIfNearBottom}
        style={{
          scrollBehavior: 'smooth',
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
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput
        activeConversation={activeConversation}
        onSendMessage={onSendMessage}
        onTyping={onTyping}
        sending={sending}
      />
    </div>
  );
};

export default ChatWindow;
