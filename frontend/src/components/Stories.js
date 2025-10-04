import { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, ChevronLeft, ChevronRight, Heart, Smile, ThumbsUp, Eye } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateStoryModal = ({ onClose, onCreated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!content.trim()) {
      toast.error('Please add some text to your story');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/stories`, { content });
      toast.success('Story posted!');
      onCreated();
      onClose();
    } catch (error) {
      toast.error('Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Create a Story</h3>
      <Textarea
        placeholder="Share something with your story..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="resize-none"
      />
      <Button onClick={handleCreate} disabled={loading} className="w-full">
        Share Story
      </Button>
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
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {/* Create Story */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group"
          data-testid="create-story-btn"
        >
          <div className="relative">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-gray-200">
              <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-lg">
                {user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-rose-600 rounded-full p-1.5 border-2 border-white">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">Create Story</span>
        </button>

        {/* User Stories */}
        {stories.map((userStory) => (
          <button
            key={userStory.user_id}
            onClick={() => openStoryViewer(userStory)}
            className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group"
            data-testid="story-avatar"
          >
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-1">
                <Avatar className="w-full h-full border-4 border-white">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-teal-500 text-white text-lg">
                    {userStory.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              {userStory.story_count > 1 && (
                <div className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {userStory.story_count}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 max-w-[80px] truncate">
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
