import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, X, ChevronLeft, ChevronRight, Heart, Smile, ThumbsUp, Eye, Upload, Image as ImageIcon, Type, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateStoryModal = ({ onClose, onCreated }) => {
  const [contentType, setContentType] = useState('text'); // 'text' or 'image'
  const [content, setContent] = useState('');
  const [storyImage, setStoryImage] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emojiElements, setEmojiElements] = useState([]); // [{id, emoji, x, y, size}]
  const [draggingEmojiId, setDraggingEmojiId] = useState(null);

  // Drag handler for emojis
  const handleEmojiDragStart = (e, emojiId) => {
    e.stopPropagation();
    setDraggingEmojiId(emojiId);
  };

  const handleEmojiDrag = (e) => {
    if (!draggingEmojiId) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp values between 5 and 95 to keep emojis inside
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));
    
    setEmojiElements(emojiElements.map(e => 
      e.id === draggingEmojiId ? {...e, x: clampedX, y: clampedY} : e
    ));
  };

  const handleEmojiDragEnd = () => {
    setDraggingEmojiId(null);
  };

  // Premium gradient backgrounds
  const bgGradients = [
    { name: 'Purple', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Sunset', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Ocean', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Fire', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Forest', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    { name: 'Berry', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { name: 'Night', gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
    { name: 'Peach', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    { name: 'Sky', gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)' },
    { name: 'Rose', gradient: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)' },
    { name: 'Mint', gradient: 'linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)' },
    { name: 'Slate', gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' },
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload/image`, formData);
      setStoryImage(response.data.url);
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    if (contentType === 'text' && !content.trim()) {
      toast.error('Please add some text to your story');
      return;
    }
    if (contentType === 'image' && !storyImage) {
      toast.error('Please upload an image for your story');
      return;
    }

    setLoading(true);
    try {
      const storyData = {
        content: content || '',
        media_url: contentType === 'image' ? storyImage : '',
      };
      
      await axios.post(`${API}/stories`, storyData);
      toast.success('✨ Story posted successfully!', {
        description: 'Your story will be visible for 24 hours',
        duration: 3000
      });
      onCreated();
      onClose();
    } catch (error) {
      toast.error('❌ Failed to create story', {
        description: 'Please try again or check your connection.',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[95vh] bg-white">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-white via-white to-slate-50/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-sm">
                <Plus className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Create Story</h2>
                <p className="text-xs text-slate-500 mt-0.5">Share a moment • 24 hours</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="group p-2 rounded-xl hover:bg-slate-100 transition-all duration-300 hover:shadow-md border border-transparent hover:border-slate-200"
              title="Close"
            >
              <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Type Selector */}
      <div className="sticky top-[65px] sm:top-[73px] z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/60">
        <div className="flex gap-1 px-4 sm:px-6 pt-2">
          <button
            onClick={() => setContentType('text')}
            className={`flex-1 py-2.5 sm:py-3 px-4 font-semibold rounded-t-xl transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group ${
              contentType === 'text' 
                ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 shadow-md border-t border-x border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            {contentType === 'text' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 shadow-lg" />
            )}
            <Type className={`w-4 h-4 transition-transform duration-300 ${contentType === 'text' ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className="tracking-wide text-sm sm:text-base">Text</span>
          </button>
          <button
            onClick={() => setContentType('image')}
            className={`flex-1 py-2.5 sm:py-3 px-4 font-semibold rounded-t-xl transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group ${
              contentType === 'image' 
                ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 shadow-md border-t border-x border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            {contentType === 'image' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 shadow-lg" />
            )}
            <ImageIcon className={`w-4 h-4 transition-transform duration-300 ${contentType === 'image' ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className="tracking-wide text-sm sm:text-base">Photo</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gradient-to-b from-slate-50/30 to-white">
        {contentType === 'text' ? (
          <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-y-auto">
            {/* Premium Preview */}
            <div 
              className="relative w-full aspect-[9/16] max-h-[400px] rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-200/60"
              style={{ background: backgroundColor }}
              onMouseMove={handleEmojiDrag}
              onMouseUp={handleEmojiDragEnd}
              onMouseLeave={handleEmojiDragEnd}
            >
              {/* Live Text Preview */}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div 
                  className="text-center font-bold leading-relaxed break-words cursor-move select-none"
                  style={{ 
                    fontSize: `${textSize}px`,
                    color: textColor,
                    textShadow: textColor === '#ffffff' ? '2px 2px 8px rgba(0,0,0,0.3)' : '2px 2px 8px rgba(255,255,255,0.3)'
                  }}
                >
                  {content || "What's on your mind?"}
                </div>
              </div>

              {/* Emoji Elements */}
              {emojiElements.map((emojiEl) => (
                <div
                  key={emojiEl.id}
                  className="absolute cursor-move select-none group"
                  style={{
                    left: `${emojiEl.x}%`,
                    top: `${emojiEl.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${emojiEl.size}px`,
                    zIndex: 10
                  }}
                >
                  {emojiEl.emoji}
                  {/* Delete button on hover */}
                  <button
                    onClick={() => setEmojiElements(emojiElements.filter(e => e.id !== emojiEl.id))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                  {/* Size controls */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEmojiElements(emojiElements.map(e => 
                        e.id === emojiEl.id ? {...e, size: Math.max(24, e.size - 8)} : e
                      ))}
                      className="w-5 h-5 bg-white/90 rounded-full shadow-md text-xs flex items-center justify-center"
                    >
                      −
                    </button>
                    <button
                      onClick={() => setEmojiElements(emojiElements.map(e => 
                        e.id === emojiEl.id ? {...e, size: Math.min(96, e.size + 8)} : e
                      ))}
                      className="w-5 h-5 bg-white/90 rounded-full shadow-md text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {/* Character Counter */}
              {content && (
                <div className="absolute bottom-4 right-4 text-white/60 text-xs font-semibold bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
                  {content.length}/200
                </div>
              )}
            </div>

            {/* Text Input Area - Clear and Prominent */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Type className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-bold text-slate-700">Story Text</span>
              </div>
              <textarea
                placeholder="Type your story here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 resize-none transition-all duration-300 focus:bg-white"
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTextSize(Math.max(16, textSize - 2))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                    title="Decrease size"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-xs font-semibold text-slate-600 min-w-[40px] text-center">{textSize}px</span>
                  <button
                    onClick={() => setTextSize(Math.min(48, textSize + 2))}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                    title="Increase size"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs font-semibold text-slate-600">{content.length}/200</span>
              </div>
            </div>

            {/* Professional Control Panel */}
            <div className="space-y-3">
              {/* Color Picker - Always Visible */}
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-700">Background</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {bgGradients.map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBackgroundColor(bg.gradient)}
                      className={`h-10 rounded-lg border-2 transition-all duration-300 relative ${
                        backgroundColor === bg.gradient 
                          ? 'border-slate-600 shadow-md scale-110 ring-2 ring-slate-400' 
                          : 'border-slate-200 hover:border-slate-400 hover:scale-105'
                      }`}
                      style={{ background: bg.gradient }}
                      title={bg.name}
                    >
                      {backgroundColor === bg.gradient && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Controls */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTextColor('#ffffff')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold text-sm transition-all shadow-sm ${
                    textColor === '#ffffff' ? 'ring-2 ring-slate-600 scale-105 shadow-md' : 'hover:shadow-md hover:scale-105'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  White
                </button>
                <button
                  onClick={() => setTextColor('#000000')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 font-semibold text-sm transition-all border border-slate-300 shadow-sm ${
                    textColor === '#000000' ? 'ring-2 ring-slate-600 scale-105 shadow-md' : 'hover:shadow-md hover:scale-105'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Black
                </button>
              </div>

              {/* Emoji Picker */}
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-700">Add Emojis (tap to place)</span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {['😀', '😂', '😍', '🥳', '😎', '🤔', '😢', '😡', '👍', '❤️', '🔥', '✨', '🎉', '💯', '🌟', '⭐'].map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const newEmoji = {
                          id: Date.now() + idx,
                          emoji: emoji,
                          x: 50, // center (percentage)
                          y: 50,
                          size: 48
                        };
                        setEmojiElements([...emojiElements, newEmoji]);
                      }}
                      className="text-2xl hover:scale-125 transition-transform duration-200 p-1.5 hover:bg-slate-100 rounded-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="story-image-upload"
            />
            {!storyImage ? (
              <label
                htmlFor="story-image-upload"
                className="relative w-full flex-1 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all duration-300 flex flex-col items-center justify-center group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-md">
                    {uploadingImage ? (
                      <Loader2 className="w-12 h-12 text-slate-600 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-slate-600" />
                    )}
                  </div>
                  <div className="text-center px-6">
                    <p className="text-lg font-semibold text-slate-700 mb-1">
                      {uploadingImage ? 'Uploading...' : 'Add Photo'}
                    </p>
                    <p className="text-sm text-slate-500">Tap to upload or drag and drop</p>
                  </div>
                </div>
              </label>
            ) : (
              <>
                {/* Image Preview */}
                <div className="relative w-full flex-1 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200">
                  <img src={storyImage} alt="Story" className="w-full h-full object-cover" />
                  
                  {/* Text Overlay for Image Stories */}
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <textarea
                      placeholder="Add text..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={100}
                      className="w-full bg-white/90 backdrop-blur-md text-slate-900 text-center text-xl font-bold rounded-2xl p-4 resize-none focus:outline-none placeholder:text-slate-500 border-2 border-slate-200 focus:border-slate-400 transition-all shadow-lg"
                      rows={2}
                      style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.5)' }}
                    />
                  </div>

                  {/* Emoji Elements for Image Stories */}
                  {emojiElements.map((emojiEl) => (
                    <div
                      key={emojiEl.id}
                      className="absolute cursor-move select-none group"
                      style={{
                        left: `${emojiEl.x}%`,
                        top: `${emojiEl.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${emojiEl.size}px`,
                        zIndex: 10
                      }}
                    >
                      {emojiEl.emoji}
                      {/* Delete button on hover */}
                      <button
                        onClick={() => setEmojiElements(emojiElements.filter(e => e.id !== emojiEl.id))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                      {/* Size controls */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEmojiElements(emojiElements.map(e => 
                            e.id === emojiEl.id ? {...e, size: Math.max(24, e.size - 8)} : e
                          ))}
                          className="w-5 h-5 bg-white/90 rounded-full shadow-md text-xs flex items-center justify-center"
                        >
                          −
                        </button>
                        <button
                          onClick={() => setEmojiElements(emojiElements.map(e => 
                            e.id === emojiEl.id ? {...e, size: Math.min(96, e.size + 8)} : e
                          ))}
                          className="w-5 h-5 bg-white/90 rounded-full shadow-md text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <label
                      htmlFor="story-image-upload"
                      className="p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full cursor-pointer transition-all shadow-md hover:shadow-lg"
                    >
                      <Upload className="w-5 h-5 text-slate-700" />
                    </label>
                    <button
                      onClick={() => setStoryImage('')}
                      className="p-2 bg-red-600/90 hover:bg-red-600 backdrop-blur-sm rounded-full transition-all shadow-md hover:shadow-lg"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Character Counter */}
                  {content && (
                    <div className="absolute bottom-4 right-4 text-white text-xs font-semibold bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                      {content.length}/100
                    </div>
                  )}
                </div>

                {/* Professional Control Panel for Images */}
                <div className="space-y-3">
                  {/* Emoji Picker */}
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Smile className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-700">Add Emojis (tap to place)</span>
                    </div>
                    <div className="grid grid-cols-8 gap-1">
                      {['😀', '😂', '😍', '🥳', '😎', '🤔', '😢', '😡', '👍', '❤️', '🔥', '✨', '🎉', '💯', '🌟', '⭐'].map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const newEmoji = {
                              id: Date.now() + idx,
                              emoji: emoji,
                              x: 50, // center (percentage)
                              y: 50,
                              size: 48
                            };
                            setEmojiElements([...emojiElements, newEmoji]);
                          }}
                          className="text-2xl hover:scale-125 transition-transform duration-200 p-1.5 hover:bg-slate-100 rounded-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 border-t border-slate-200/60 bg-gradient-to-t from-slate-50 via-white to-white/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <Button 
          onClick={handleCreate} 
          disabled={loading || (contentType === 'text' && !content.trim()) || (contentType === 'image' && !storyImage)}
          className="w-full bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 hover:from-slate-700 hover:via-slate-800 hover:to-slate-700 text-white px-8 py-3 sm:py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sharing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Share to Story</span>
              <span className="text-xl">→</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

const StoryViewer = ({ stories, initialIndex, onClose, onView }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);
  
  const currentStory = stories[currentIndex];

  const handleReaction = async (reaction) => {
    try {
      await axios.post(`${API}/stories/${currentStory.id}/react`, { reaction });
      setShowReactions(false);
      toast.success(`Reacted with ${reaction}!`);
    } catch (error) {
      toast.error('Failed to react to story');
    }
  };

  useEffect(() => {
    if (currentStory) {
      onView(currentStory.id);
      setProgress(0);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + 2;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [currentIndex, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentStory) return null;

  const formatTime = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all"
              style={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white">
              {currentStory.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">{currentStory.username}</p>
            <p className="text-white text-xs opacity-80">{formatTime(currentStory.created_at)}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Story content */}
      <div className="text-white text-center px-8 py-12">
        <p className="text-2xl font-medium leading-relaxed">{currentStory.content}</p>
      </div>

      {/* Story Stats & Reactions */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-white text-sm opacity-80">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{currentStory.views_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{currentStory.reactions_count || 0}</span>
            </div>
          </div>
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-white text-sm font-medium"
          >
            React 💕
          </button>
        </div>
        
        {/* Reactions Panel */}
        {showReactions && (
          <div className="mt-3 bg-white/90 rounded-full p-2 flex items-center justify-center space-x-1">
            {['❤️', '😍', '😂', '😮', '😢', '👍'].map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  );
};

export const Stories = ({ user }) => {
  const [stories, setStories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingStories, setViewingStories] = useState(null);
  const [viewingIndex, setViewingIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await axios.get(`${API}/stories`);
      setStories(response.data);
    } catch (error) {
      console.error('Failed to load stories');
    }
  };

  const handleViewStory = async (storyId) => {
    try {
      await axios.post(`${API}/stories/${storyId}/view`);
    } catch (error) {
      console.error('Failed to mark story as viewed');
    }
  };

  const openStoryViewer = (userStories, index = 0) => {
    setViewingStories(userStories.stories);
    setViewingIndex(index);
  };

  return (
    <>
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Create Story */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group"
          data-testid="create-story-btn"
        >
          <div className="relative transform transition-all duration-200 group-hover:scale-105">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-slate-200 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-lg">
                {user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-slate-600 rounded-full p-1.5 border-2 border-white shadow-sm">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs font-medium text-slate-700 group-hover:text-slate-800 transition-colors">Create Story</span>
        </button>

        {/* User Stories */}
        {stories.map((userStory) => (
          <button
            key={userStory.user_id}
            onClick={() => openStoryViewer(userStory)}
            className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group"
            data-testid="story-avatar"
          >
            <div className="relative transform transition-all duration-200 group-hover:scale-105">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-slate-400 via-slate-500 to-slate-600 p-1 shadow-md">
                <Avatar className="w-full h-full border-4 border-white">
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-lg">
                    {userStory.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              {userStory.story_count > 1 && (
                <div className="absolute -top-1 -right-1 bg-slate-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                  {userStory.story_count}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 max-w-[80px] truncate transition-colors">
              {userStory.username}
            </span>
          </button>
        ))}
      </div>

      {/* Create Story Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <CreateStoryModal 
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              fetchStories();
              setShowCreateModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Story Viewer Modal */}
      <Dialog open={!!viewingStories} onOpenChange={() => setViewingStories(null)}>
        <DialogContent className="max-w-lg h-[80vh] p-0 bg-black">
          {viewingStories && (
            <StoryViewer
              stories={viewingStories}
              initialIndex={viewingIndex}
              onClose={() => setViewingStories(null)}
              onView={handleViewStory}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
