import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Type, Palette, Loader2, Smile } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateStoryModal = ({ onClose, onCreated }) => {
  const [contentType, setContentType] = useState('text');
  const [content, setContent] = useState('');
  const [storyImage, setStoryImage] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textElements, setTextElements] = useState([]);
  const [emojiElements, setEmojiElements] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  const bgGradients = [
    { gradient: '#ffffff', name: 'White' },
    { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', name: 'Purple' },
    { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', name: 'Pink' },
    { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', name: 'Blue' },
    { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', name: 'Warm' },
    { gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', name: 'Ocean' },
    { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', name: 'Pastel' },
    { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', name: 'Peach' },
  ];

  const emojis = ['😀', '😂', '😍', '🥳', '😎', '🔥', '❤️', '✨', '🎉', '💯', '🌟', '⭐', '🤔', '😢', '👍', '💪'];

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload/image`, formData);
      setStoryImage(`${BACKEND_URL}${response.data.url}`);
      toast.success('✨ Photo uploaded!');
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
      await axios.post(`${API}/stories`, {
        content: content || '',
        media_url: contentType === 'image' ? storyImage : '',
      });
      toast.success('🎉 Story posted successfully!', {
        description: 'Your story will be visible for 24 hours'
      });
      onCreated();
      onClose();
    } catch (error) {
      toast.error('❌ Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  const addEmojiToText = (emoji) => {
    setContent(content + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const addEmojiElement = (emoji) => {
    const newEmoji = {
      id: Date.now(),
      content: emoji,
      x: 50,
      y: 50,
      fontSize: 48
    };
    setEmojiElements([...emojiElements, newEmoji]);
    setShowEmojiPicker(false);
  };

  const handleDragStart = (e, id) => {
    setDraggingId(id);
  };

  const handleDrag = (e) => {
    if (!draggingId || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      setEmojiElements(emojiElements.map(el => 
        el.id === draggingId ? { ...el, x, y } : el
      ));
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header - Matching other modals */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-white via-white to-slate-50/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
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
            >
              <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[65px] sm:top-[73px] z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/60">
        <div className="flex gap-1 px-4 sm:px-6 pt-2">
          <button
            onClick={() => setContentType('text')}
            className={`flex-1 py-2.5 sm:py-3 px-4 font-semibold rounded-t-xl transition-all duration-300 flex items-center justify-center gap-2 relative ${
              contentType === 'text' 
                ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 shadow-md border-t border-x border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            {contentType === 'text' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600" />
            )}
            <Type className="w-4 h-4" />
            <span className="text-sm sm:text-base">Text</span>
          </button>
          <button
            onClick={() => setContentType('image')}
            className={`flex-1 py-2.5 sm:py-3 px-4 font-semibold rounded-t-xl transition-all duration-300 flex items-center justify-center gap-2 relative ${
              contentType === 'image' 
                ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 shadow-md border-t border-x border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            {contentType === 'image' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600" />
            )}
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm sm:text-base">Photo</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-slate-50/30 to-white">
        {contentType === 'text' ? (
          <div className="space-y-4">
            {/* WhatsApp-style Preview with Direct Input */}
            <div 
              ref={previewRef}
              className="relative w-full aspect-[9/16] max-h-[500px] mx-auto rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-200/60" 
              style={{ background: backgroundColor }}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {/* Editable Text in Preview */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={200}
                  className="w-full h-full text-center text-2xl font-bold bg-transparent border-none outline-none resize-none placeholder-gray-400"
                  style={{
                    color: textColor,
                    textShadow: textColor === '#ffffff' ? '2px 2px 4px rgba(0,0,0,0.4)' : '2px 2px 4px rgba(255,255,255,0.4)',
                  }}
                />
              </div>

              {/* Draggable Emoji Elements */}
              {emojiElements.map((emoji) => (
                <div
                  key={emoji.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, emoji.id)}
                  className="absolute cursor-move select-none group"
                  style={{
                    left: `${emoji.x}%`,
                    top: `${emoji.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${emoji.fontSize}px`,
                    zIndex: 10
                  }}
                >
                  {emoji.content}
                  <button
                    onClick={() => setEmojiElements(emojiElements.filter(e => e.id !== emoji.id))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs shadow-lg"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Character Counter */}
              {content && (
                <div className="absolute bottom-4 right-4 text-white/70 text-xs bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm font-semibold">
                  {content.length}/200
                </div>
              )}

              {/* Floating Action Buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* Color Picker Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      setShowEmojiPicker(false);
                    }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Palette className="w-5 h-5 text-white" />
                  </button>
                  
                  {/* Color Picker Popup */}
                  {showColorPicker && (
                    <div className="absolute top-0 right-12 bg-white rounded-2xl shadow-2xl p-3 w-64 border border-slate-200">
                      <p className="text-xs font-bold text-slate-700 mb-2">Background</p>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {bgGradients.map((bg, idx) => (
                          <button
                            key={idx}
                            onClick={() => setBackgroundColor(bg.gradient)}
                            className={`h-12 rounded-lg border-2 transition-all ${
                              backgroundColor === bg.gradient 
                                ? 'border-slate-600 scale-110' 
                                : 'border-slate-200 hover:scale-105'
                            }`}
                            style={{ background: bg.gradient }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-bold text-slate-700 mb-2">Text Color</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTextColor('#ffffff')}
                          className={`py-2 rounded-lg font-semibold text-sm ${
                            textColor === '#ffffff' 
                              ? 'bg-slate-700 text-white' 
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          White
                        </button>
                        <button
                          onClick={() => setTextColor('#000000')}
                          className={`py-2 rounded-lg font-semibold text-sm ${
                            textColor === '#000000' 
                              ? 'bg-slate-700 text-white' 
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Black
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emoji Picker Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowColorPicker(false);
                    }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 shadow-lg flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Smile className="w-5 h-5 text-white" />
                  </button>
                  
                  {/* Emoji Picker Popup */}
                  {showEmojiPicker && (
                    <div className="absolute top-0 right-12 bg-white rounded-2xl shadow-2xl p-3 w-64 border border-slate-200">
                      <p className="text-xs font-bold text-slate-700 mb-2">Add Emoji (drag to move)</p>
                      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => addEmojiElement(emoji)}
                            className="text-2xl hover:scale-125 transition-all p-1 hover:bg-slate-100 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
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
                className="relative w-full aspect-[9/16] max-h-[500px] mx-auto border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all flex flex-col items-center justify-center group"
              >
                <div className="p-6 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  {uploadingImage ? (
                    <Loader2 className="w-12 h-12 text-slate-600 animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 text-slate-600" />
                  )}
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-700">
                  {uploadingImage ? 'Uploading...' : 'Add Photo'}
                </p>
                <p className="text-sm text-slate-500 mt-1">Tap to upload image</p>
              </label>
            ) : (
              <div className="relative w-full aspect-[9/16] max-h-[500px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200">
                <img src={storyImage} alt="Story" className="w-full h-full object-cover" />
                
                <button
                  onClick={() => setStoryImage('')}
                  className="absolute top-4 right-4 p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>

                {content && (
                  <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                    <p className="text-center text-xl font-bold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                      {content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Submit Button */}
      <div className="sticky bottom-0 border-t border-slate-200/60 bg-gradient-to-t from-slate-50 via-white to-white/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4">
        <Button 
          onClick={handleCreate} 
          disabled={loading || (contentType === 'text' && !content.trim()) || (contentType === 'image' && !storyImage)}
          className="w-full bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 hover:from-slate-700 hover:via-slate-800 hover:to-slate-700 text-white px-8 py-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
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

// Story Viewer Component
const StoryViewer = ({ stories, initialIndex, onClose, onView }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory) return;
    
    onView(currentStory.id);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, currentStory, onView]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute top-4 left-4 right-16 z-10 flex items-center gap-3">
        <Avatar className="w-10 h-10 ring-2 ring-white shadow-lg">
          {currentStory.user_avatar ? (
            <img src={currentStory.user_avatar} alt={currentStory.username} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold">
              {currentStory.username?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="text-white font-semibold text-sm">{currentStory.username}</p>
          <p className="text-white/70 text-xs">
            {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-md h-full max-h-[90vh] mx-auto">
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: currentStory.media_url ? 'black' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {currentStory.media_url ? (
            <img src={currentStory.media_url} alt="Story" className="w-full h-full object-contain" />
          ) : null}
          
          {currentStory.content && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <p className="text-white text-2xl font-bold text-center leading-relaxed" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                {currentStory.content}
              </p>
            </div>
          )}

          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full cursor-pointer" onClick={handlePrev} />
            <div className="w-1/2 h-full cursor-pointer" onClick={handleNext} />
          </div>
        </div>
      </div>

      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        disabled={currentIndex === stories.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

// Main Stories Component
const Stories = ({ user }) => {
  const [storiesData, setStoriesData] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewerState, setViewerState] = useState({ show: false, stories: [], index: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data } = await axios.get(`${API}/stories`);
      setStoriesData(data);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStory = async (storyId) => {
    try {
      await axios.post(`${API}/stories/${storyId}/view`);
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 group"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 p-0.5 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold text-xl">
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-700 text-center mt-2">Create Story</p>
        </button>

        {loading ? (
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-3 w-16 bg-slate-200 rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          storiesData.map((userStories) => (
            <button
              key={userStories.user_id}
              onClick={() => setViewerState({ show: true, stories: userStories.stories, index: 0 })}
              className="flex-shrink-0 group"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className="w-full h-full rounded-full border-[3px] border-white overflow-hidden bg-slate-200">
                    {userStories.user_avatar ? (
                      <img src={userStories.user_avatar} alt={userStories.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-white font-bold text-xl">
                        {userStories.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-700 text-center mt-2 max-w-[80px] truncate">
                {userStories.username}
              </p>
            </button>
          ))
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl h-[95vh] p-0 overflow-hidden gap-0 border-none shadow-2xl">
          <CreateStoryModal
            onClose={() => setShowCreateModal(false)}
            onCreated={fetchStories}
          />
        </DialogContent>
      </Dialog>

      {viewerState.show && (
        <StoryViewer
          stories={viewerState.stories}
          initialIndex={viewerState.index}
          onClose={() => setViewerState({ show: false, stories: [], index: 0 })}
          onView={handleViewStory}
        />
      )}
    </>
  );
};

export { Stories };
export default Stories;
