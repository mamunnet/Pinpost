import React, { useState } from 'react';
import { Header } from '@/components/Header';
import ConversationList from '@/components/messaging/ConversationList';
import ChatWindow from '@/components/messaging/ChatWindow';
import { useMessaging } from '@/hooks/useMessaging';

const EnhancedMessagesPage = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    sending,
    onlineUsers,
    typingUsers,
    fetchMessages,
    sendMessage,
    handleTyping,
    checkIfNearBottom
  } = useMessaging(user);

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

  const handleConversationClick = (conv) => {
    setActiveConversation(conv);
    fetchMessages(conv.id);
  };

  const handleBack = () => {
    setActiveConversation(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-500">Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <Header user={user} />

      {/* Main Content - Account for fixed header height (top bar 48px + nav 64px = 112px) */}
      <div className="flex-1 flex overflow-hidden mt-28" style={{ height: 'calc(100vh - 112px)' }}>
        {/* Conversations List */}
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onConversationClick={handleConversationClick}
          getOtherParticipant={getOtherParticipant}
          formatTime={formatTime}
          onlineUsers={onlineUsers}
          user={user}
          loading={loading}
        />

        {/* Chat Window */}
        <ChatWindow
          activeConversation={activeConversation}
          messages={messages}
          user={user}
          getOtherParticipant={getOtherParticipant}
          onlineUsers={onlineUsers}
          formatLastSeen={formatLastSeen}
          formatTime={formatTime}
          typingUsers={typingUsers}
          onBack={handleBack}
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          sending={sending}
          checkIfNearBottom={checkIfNearBottom}
        />
      </div>
    </div>
  );
};

export default EnhancedMessagesPage;
