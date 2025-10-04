import { useState } from "react";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Smile, MapPin, Palette, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import EmojiPicker from 'emoji-picker-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const bgColors = [
  { name: 'None', value: 'transparent', gradient: 'bg-white' },
  { name: 'Sunset', value: '#FF6B6B', gradient: 'bg-gradient-to-br from-red-400 to-orange-400' },
  { name: 'Ocean', value: '#4ECDC4', gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
  { name: 'Forest', value: '#95E1D3', gradient: 'bg-gradient-to-br from-green-300 to-emerald-500' },
  { name: 'Purple', value: '#A855F7', gradient: 'bg-gradient-to-br from-purple-400 to-pink-400' },
  { name: 'Golden', value: '#F59E0B', gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500' },
];

export const EnhancedPostModal = ({ onClose }) => {
  const [contentType, setContentType] = useState('post');
  const [postContent, setPostContent] = useState('');
  const [location, setLocation] = useState('');
  const [bgColor, setBgColor] = useState('transparent');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  
  // Blog fields
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogImage, setBlogImage] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleEmojiClick = (emojiData) => {
    if (contentType === 'post') {
      setPostContent(prev => prev + emojiData.emoji);
    } else {
      setBlogContent(prev => prev + emojiData.emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error('Please write something');
      return;
    }

    setLoading(true);
    try {
      const content = location 
        ? `${postContent}\n📍 ${location}` 
        : postContent;
      
      await axios.post(`${API}/posts`, { content });
      toast.success('Post created!');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/blogs`, {
        title: blogTitle,
        content: blogContent,
        excerpt: blogExcerpt,
        cover_image: blogImage,
        tags: blogTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      toast.success('Blog published!');
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast.error('Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const selectedBg = bgColors.find(bg => bg.value === bgColor);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <h2 className="text-xl font-semibold">Create {contentType === 'post' ? 'Post' : 'Blog'}</h2>
        <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full" data-testid="close-modal-btn">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Type Selector */}
      <div className="flex border-b mt-4">
        <button
          onClick={() => setContentType('post')}
          className={`flex-1 py-3 font-medium ${contentType === 'post' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-600'}`}
          data-testid="select-post-type"
        >
          Quick Post
        </button>
        <button
          onClick={() => setContentType('blog')}
          className={`flex-1 py-3 font-medium ${contentType === 'blog' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-600'}`}
          data-testid="select-blog-type"
        >
          Blog Article
        </button>
      </div>

      {/* Content */}
      <div className="mt-4">
        {contentType === 'post' ? (
          <div className="space-y-4">
            {/* Post Textarea with Background */}
            <div className={`rounded-lg p-4 ${selectedBg?.gradient || ''}`} style={{backgroundColor: bgColor !== 'transparent' ? bgColor : undefined}}>
              <Textarea
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={6}
                className={`resize-none border-0 ${bgColor !== 'transparent' ? 'bg-transparent text-white placeholder:text-white/80 font-medium text-lg' : ''}`}
                data-testid="post-textarea"
              />
            </div>

            {/* Location Input */}
            {location !== null && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <Input
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1"
                  data-testid="location-input"
                />
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute z-50 mt-2">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}

            {/* Background Color Picker */}
            {showBgPicker && (
              <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg bg-white">
                {bgColors.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => {
                      setBgColor(bg.value);
                      setShowBgPicker(false);
                    }}
                    className={`h-16 rounded-lg ${bg.gradient} border-2 ${bgColor === bg.value ? 'border-rose-600' : 'border-gray-200'} hover:scale-105 transition-transform`}
                  >
                    <span className="text-xs font-medium">{bg.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setLocation(location === null ? '' : null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Add location"
                >
                  <MapPin className={`w-5 h-5 ${location !== null ? 'text-rose-600' : 'text-gray-600'}`} />
                </button>
                <button
                  onClick={() => setShowBgPicker(!showBgPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Background color"
                >
                  <Palette className={`w-5 h-5 ${bgColor !== 'transparent' ? 'text-rose-600' : 'text-gray-600'}`} />
                </button>
              </div>
              <Button onClick={handleCreatePost} disabled={loading} data-testid="publish-post-btn">
                Post
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Blog title"
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              className="text-lg font-semibold"
              data-testid="blog-title-input"
            />
            <Input
              placeholder="Cover image URL (optional)"
              value={blogImage}
              onChange={(e) => setBlogImage(e.target.value)}
              data-testid="blog-image-input"
            />
            <Input
              placeholder="Brief excerpt"
              value={blogExcerpt}
              onChange={(e) => setBlogExcerpt(e.target.value)}
              data-testid="blog-excerpt-input"
            />
            <Textarea
              placeholder="Write your blog content... (Markdown supported)"
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              rows={12}
              className="resize-none font-serif"
              data-testid="blog-content-textarea"
            />
            <Input
              placeholder="Tags (comma separated)"
              value={blogTags}
              onChange={(e) => setBlogTags(e.target.value)}
              data-testid="blog-tags-input"
            />
            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Smile className="w-5 h-5 text-gray-600" />
              </button>
              <Button onClick={handleCreateBlog} disabled={loading} data-testid="publish-blog-btn">
                Publish Blog
              </Button>
            </div>
            {showEmojiPicker && (
              <div className="absolute z-50 right-0">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
