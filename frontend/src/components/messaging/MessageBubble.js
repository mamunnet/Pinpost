import React, { useState } from 'react';
import { Check, CheckCheck, Play, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getUserAvatarUrl } from '@/utils/imageUtils';
import ImagePreviewModal from './ImagePreviewModal';

const MessageBubble = ({ message, isMe, formatTime, getUserAvatarUrl }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const isRead = message.read_by && message.read_by.length > 1;
  const isDelivered = message.delivered_to && message.delivered_to.length > 0;

  const getMessageStatusIcon = () => {
    if (!isMe) return null;
    
    if (isRead) {
      return <CheckCheck className="w-3.5 h-3.5 text-slate-600" />;
    } else if (isDelivered) {
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    } else {
      return <Check className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const renderContent = () => {
    // Image message
    if (message.type === 'image' && message.image_url) {
      return (
        <div className="space-y-2">
          <div className="relative group">
            <img 
              src={message.image_url} 
              alt="Shared image" 
              className="rounded-xl max-w-full h-auto max-h-80 object-cover cursor-pointer hover:opacity-95 transition-all shadow-md"
              onClick={() => setShowImageModal(true)}
              onError={(e) => {
                console.error('Image failed to load:', message.image_url);
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50">Failed to load</text></svg>';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-xl flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
          {message.content && (
            <p className="text-sm break-words leading-relaxed">{message.content}</p>
          )}
        </div>
      );
    }
    
    // Voice message
    if (message.type === 'voice' && message.voice_url) {
      return (
        <div className="flex items-center gap-3 min-w-[220px]">
          <Button
            size="icon"
            variant="ghost"
            className={`rounded-full flex-shrink-0 ${isMe ? 'hover:bg-slate-700/20' : 'hover:bg-slate-200'}`}
            onClick={() => {
              const audio = new Audio(message.voice_url);
              audio.play();
            }}
          >
            <Play className="w-4 h-4" fill="currentColor" />
          </Button>
          <div className="flex-1">
            <div className={`h-8 flex items-center gap-0.5 ${isMe ? 'text-slate-100' : 'text-slate-400'}`}>
              {[...Array(25)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-0.5 rounded-full transition-all ${isMe ? 'bg-white/40' : 'bg-slate-300'}`}
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          </div>
          <a
            href={message.voice_url}
            download
            className={`p-1.5 rounded-full flex-shrink-0 ${isMe ? 'hover:bg-slate-700/20' : 'hover:bg-slate-200'}`}
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      );
    }

    // Text message
    return <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
        {!isMe && (
          <Avatar className="w-8 h-8 mr-2 flex-shrink-0 border-2 border-white shadow-sm">
            <AvatarImage src={getUserAvatarUrl(message.sender_avatar)} />
            <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white text-xs">
              {message.sender_username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={`max-w-[75%] md:max-w-[60%] ${
          isMe 
            ? 'bg-slate-800 text-white shadow-lg' 
            : 'bg-white text-slate-900 shadow-md border border-slate-100'
        } rounded-2xl px-4 py-2.5 transition-all hover:shadow-xl ${
          isMe ? 'hover:bg-slate-900' : 'hover:border-slate-200'
        }`}>
          {renderContent()}
          <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs font-medium ${isMe ? 'text-slate-300' : 'text-slate-500'}`}>
              {formatTime(message.created_at)}
            </span>
            {getMessageStatusIcon()}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {message.type === 'image' && message.image_url && (
        <ImagePreviewModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={message.image_url}
          sender={message.sender_username}
        />
      )}
    </>
  );
};

export default MessageBubble;
