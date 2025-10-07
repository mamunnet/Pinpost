import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Your Messages</h2>
          <p className="text-slate-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const otherUser = getOtherParticipant(activeConversation);
  const isOnline = onlineUsers[otherUser?.user_id]?.online;
  const isTyping = typingUsers[activeConversation.id]?.typing && 
                   typingUsers[activeConversation.id]?.user_id !== user.id;

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getUserAvatarUrl(otherUser?.avatar_url)} />
              <AvatarFallback>
                {otherUser?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">
              {otherUser?.username}
            </h2>
            <p className="text-xs text-slate-500">
              {isTyping ? (
                <span className="text-blue-500 font-medium">typing...</span>
              ) : isOnline ? (
                'Active now'
              ) : (
                formatLastSeen(onlineUsers[otherUser?.user_id]?.last_seen)
              )}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 p-4" 
        ref={messageContainerRef}
        onScroll={checkIfNearBottom}
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMe={message.sender_id === user.id}
              formatTime={formatTime}
              getUserAvatarUrl={getUserAvatarUrl}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
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
