import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Circle } from 'lucide-react';
import { getUserAvatarUrl } from '@/utils/imageUtils';

const ConversationList = ({
  conversations,
  activeConversation,
  searchQuery,
  onSearchChange,
  onConversationClick,
  getOtherParticipant,
  formatTime,
  onlineUsers,
  user,
  loading
}) => {
  const navigate = useNavigate();

  const handleConversationClick = (conv) => {
    navigate(`/messages?conversation=${conv.id}`);
    if (onConversationClick) {
      onConversationClick(conv);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`${activeConversation ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-slate-200 flex flex-col bg-white shadow-sm`}>
      {/* Header - Modern Design */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-900">
          Messages
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search - Modern Design */}
      <div className="px-4 py-4 border-b border-slate-200 bg-slate-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-slate-300 bg-white focus:ring-2 focus:ring-slate-400 focus:border-slate-400 rounded-lg"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-500 text-sm">Loading conversations...</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No conversations found</p>
              <p className="text-slate-500 text-sm mt-1">Start a new conversation</p>
            </div>
          </div>
        ) : (
          <div>
            {filteredConversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isOnline = onlineUsers[other?.user_id]?.online;
              const unreadCount = conv.unread_count?.[user.id] || 0;
              const isActive = activeConversation?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={`flex items-center gap-4 px-4 py-4 cursor-pointer border-b border-slate-100 transition-all duration-200 hover:bg-slate-50 ${
                    isActive ? 'bg-slate-100 border-l-4 border-l-slate-800' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className={`w-14 h-14 border-2 transition-all ${
                      isActive ? 'border-slate-800 shadow-lg' : 'border-white shadow-md'
                    }`}>
                      <AvatarImage src={getUserAvatarUrl(other?.avatar)} />
                      <AvatarFallback className="bg-slate-700 text-white font-semibold text-lg">
                        {other?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <Circle className="absolute bottom-0 right-0 w-4 h-4 fill-green-500 text-green-500 border-2 border-white rounded-full shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold truncate ${
                        isActive ? 'text-slate-900' : unreadCount > 0 ? 'text-slate-900' : 'text-slate-800'
                      }`}>
                        {other?.username}
                      </h3>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                        {formatTime(conv.last_message_at || conv.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'font-semibold text-slate-900' : 'text-slate-600'
                      }`}>
                        {conv.last_message || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <Badge className="ml-2 bg-slate-800 hover:bg-slate-900 shadow-md flex-shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
