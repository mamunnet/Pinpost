import React from 'react';
import { Check, CheckCheck, Play, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getUserAvatarUrl } from '@/utils/imageUtils';

const MessageBubble = ({ message, isMe, formatTime, getUserAvatarUrl }) => {
  const isRead = message.read_by && message.read_by.length > 1;
  const isDelivered = message.delivered_to && message.delivered_to.length > 0;

  const getMessageStatusIcon = () => {
    if (!isMe) return null;
    
    if (isRead) {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    } else if (isDelivered) {
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    } else {
      return <Check className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const renderContent = () => {
    // Debug logging
    console.log('Message data:', { 
      type: message.type, 
      image_url: message.image_url, 
      voice_url: message.voice_url,
      content: message.content 
    });

    // Image message
    if (message.type === 'image' && message.image_url) {
      return (
        <div className="space-y-2">
          <img 
            src={message.image_url} 
            alt="Shared image" 
            className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90"
            onClick={() => window.open(message.image_url, '_blank')}
            onError={(e) => {
              console.error('Image failed to load:', message.image_url);
              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">Failed to load</text></svg>';
            }}
          />
          {message.content && (
            <p className="text-sm break-words">{message.content}</p>
          )}
        </div>
      );
    }
    
    // Voice message
    if (message.type === 'voice' && message.voice_url) {
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <Button
            size="icon"
            variant="ghost"
            className={`rounded-full ${isMe ? 'hover:bg-blue-600' : 'hover:bg-slate-100'}`}
            onClick={() => {
              const audio = new Audio(message.voice_url);
              audio.play();
            }}
          >
            <Play className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <div className={`h-8 flex items-center gap-0.5 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-0.5 rounded-full ${isMe ? 'bg-blue-200' : 'bg-slate-300'}`}
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
          <a
            href={message.voice_url}
            download
            className={`p-1 rounded ${isMe ? 'hover:bg-blue-600' : 'hover:bg-slate-100'}`}
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      );
    }

    // Text message
    return <p className="text-sm break-words">{message.content}</p>;
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
      {!isMe && (
        <Avatar className="w-8 h-8 mr-2">
          <AvatarImage src={getUserAvatarUrl(message.sender_avatar)} />
          <AvatarFallback>{message.sender_username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[70%] ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-slate-900'} rounded-2xl px-4 py-2 shadow-sm`}>
        {renderContent()}
        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>
            {formatTime(message.created_at)}
          </span>
          {getMessageStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
