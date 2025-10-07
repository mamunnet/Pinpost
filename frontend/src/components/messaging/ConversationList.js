import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`${activeConversation ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-slate-200 flex flex-col bg-white`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold">Chats</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
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
                  onClick={() => onConversationClick(conv)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 border-b border-slate-100 transition-colors ${
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
  );
};

export default ConversationList;
