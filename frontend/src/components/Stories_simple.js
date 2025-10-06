import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, Type, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Simple Facebook-style Story Creator
const CreateStoryModal = ({ onClose, onCreated }) => {
  const [mode, setMode] = useState('text'); // 'text' or 'photo'
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [textColor, setTextColor] = useState('white');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const backgrounds = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];

  const emojis = ['😀', '😂', '😍', '🥳', '😎', '🔥', '❤️', '✨', '🎉', '💯', '🌟', '⭐'];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post(`${API}/api/upload/image`, formData);
      setPhoto(`${BACKEND_URL}${data.url}`);
      toast.success('Photo uploaded!');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !photo) {
      toast.error('Add some content first!');
      return;
    }

    setPosting(true);
    try {
      await axios.post(`${API}/api/stories`, {
        content: text || '',
        media_url: photo || '',
      });
      toast.success('Story posted! 🎉');
      onCreated();
      onClose();
    } catch (error) {
      toast.error('Failed to post story');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-slate-900">Create Story</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-3 font-semibold transition ${
              mode === 'text' 
                ? 'bg-slate-100 text-slate-900 border-b-2 border-slate-900' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Type className="w-4 h-4 inline mr-2" />
            Text
          </button>
          <button
            onClick={() => setMode('photo')}
            className={`flex-1 py-3 font-semibold transition ${
              mode === 'photo' 
                ? 'bg-slate-100 text-slate-900 border-b-2 border-slate-900' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Photo
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {mode === 'text' ? (
            // Text Story Preview - Click to change background
            <div
              onClick={() => setBgIndex((prev) => (prev + 1) % backgrounds.length)}
              className="relative w-full aspect-[9/16] max-h-[500px] mx-auto rounded-2xl shadow-2xl overflow-hidden cursor-pointer group"
              style={{ background: backgrounds[bgIndex] }}
            >
              {/* Hint */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <span className="text-white/60 text-xs bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Tap to change background
                </span>
              </div>

              {/* Text Content */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="What's on your mind?"
                  maxLength={200}
                  className="w-full text-center text-2xl font-bold bg-transparent border-none outline-none resize-none placeholder-white/50"
                  style={{
                    color: textColor,
                    textShadow: textColor === 'white' ? '2px 2px 4px rgba(0,0,0,0.3)' : '2px 2px 4px rgba(255,255,255,0.3)',
                  }}
                  rows={4}
                />
              </div>

              {/* Character count */}
              {text && (
                <div className="absolute bottom-4 right-4 text-white/60 text-xs bg-black/20 px-2 py-1 rounded-full">
                  {text.length}/200
                </div>
              )}
            </div>
          ) : (
            // Photo Story Preview
            <div className="relative w-full aspect-[9/16] max-h-[500px] mx-auto rounded-2xl shadow-2xl overflow-hidden bg-slate-100">
              {!photo ? (
                <label
                  htmlFor="photo-upload"
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition group"
                >
                  <div className="p-6 bg-white rounded-full shadow-lg group-hover:scale-110 transition">
                    {uploading ? (
                      <Loader2 className="w-12 h-12 text-slate-600 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-slate-600" />
                    )}
                  </div>
                  <p className="mt-4 text-slate-700 font-semibold">
                    {uploading ? 'Uploading...' : 'Add Photo'}
                  </p>
                  <p className="text-sm text-slate-500">Tap to upload</p>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <>
                  <img src={photo} alt="Story" className="w-full h-full object-cover" />
                  
                  {/* Remove photo button */}
                  <button
                    onClick={() => setPhoto('')}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Text overlay on photo */}
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Add text..."
                      maxLength={100}
                      className="w-full text-center text-xl font-bold bg-white/90 backdrop-blur-sm rounded-xl p-4 resize-none outline-none placeholder-slate-400 shadow-lg"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 border-t space-y-3">
          {/* Text Color Toggle */}
          {mode === 'text' && (
            <div className="flex gap-2">
              <button
                onClick={() => setTextColor('white')}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  textColor === 'white' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                White
              </button>
              <button
                onClick={() => setTextColor('black')}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  textColor === 'black' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Black
              </button>
            </div>
          )}

          {/* Quick Emojis */}
          <div className="flex gap-1 justify-center flex-wrap">
            {emojis.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => setText(text + emoji)}
                className="text-2xl hover:scale-125 transition p-1"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Share Button */}
          <Button
            onClick={handlePost}
            disabled={posting || (!text.trim() && !photo)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {posting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Posting...
              </>
            ) : (
              'Share to Story'
            )}
          </Button>
        </div>
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
    
    onView(currentStory._id);
    
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
  }, [currentIndex]);

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
      {/* Progress bars */}
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

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Story content */}
      <div className="relative w-full max-w-md h-full max-h-[90vh] mx-auto">
        <div
          onClick={handleNext}
          onContextMenu={(e) => { e.preventDefault(); handlePrev(); }}
          className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
          style={{
            background: currentStory.media_url ? 'black' : currentStory.content ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#333',
          }}
        >
          {currentStory.media_url ? (
            <img src={currentStory.media_url} alt="Story" className="w-full h-full object-contain" />
          ) : null}
          
          {currentStory.content && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <p className="text-white text-2xl font-bold text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                {currentStory.content}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation hints */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm">
        Tap to next • Long press to previous
      </div>
    </div>
  );
};

// Main Stories Component
const Stories = () => {
  const [stories, setStories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewerState, setViewerState] = useState({ show: false, stories: [], index: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data } = await axios.get(`${API}/api/stories`);
      setStories(data);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStory = async (storyId) => {
    try {
      await axios.post(`${API}/api/stories/${storyId}/view`);
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  const groupedStories = stories.reduce((acc, story) => {
    const authorId = story.author_id;
    if (!acc[authorId]) {
      acc[authorId] = {
        author: story.author,
        stories: [],
      };
    }
    acc[authorId].stories.push(story);
    return acc;
  }, {});

  return (
    <div className="py-4">
      <div className="flex gap-3 overflow-x-auto pb-2 px-4">
        {/* Create Story Card */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 group"
        >
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 border-4 border-white shadow-lg hover:shadow-xl transition overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto bg-slate-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">+</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-1">Create</p>
              </div>
            </div>
          </div>
        </button>

        {/* Story Avatars */}
        {Object.entries(groupedStories).map(([authorId, { author, stories: userStories }]) => (
          <button
            key={authorId}
            onClick={() => setViewerState({ show: true, stories: userStories, index: 0 })}
            className="flex-shrink-0 group"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 shadow-lg hover:shadow-xl transition">
                <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-200">
                  {author?.avatar_url ? (
                    <img src={author.avatar_url} alt={author.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-white font-bold text-xl">
                      {author?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-700 text-center mt-1 max-w-[80px] truncate">
                {author?.username || 'Unknown'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchStories}
        />
      )}

      {/* Story Viewer */}
      {viewerState.show && (
        <StoryViewer
          stories={viewerState.stories}
          initialIndex={viewerState.index}
          onClose={() => setViewerState({ show: false, stories: [], index: 0 })}
          onView={handleViewStory}
        />
      )}
    </div>
  );
};

export default Stories;
