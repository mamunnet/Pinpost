import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Palette, Upload, Bold, Italic, List, Heading, Image as ImageIcon, AtSign, Loader2, X } from "lucide-react";
import { toast } from "sonner";

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

export const EnhancedPostModal = ({ onClose, currentUser, initialTab = 'post' }) => {
  const [contentType, setContentType] = useState(initialTab);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');
  const [location, setLocation] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationInputRef = useRef(null);
  const [bgColor, setBgColor] = useState('transparent');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  
  // Blog fields
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogImage, setBlogImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationInputRef.current && !locationInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for locations as user types (Nominatim Search API)
  const searchLocations = async (query) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PenLink Social App'
          }
        }
      );

      const data = await response.json();
      
      const suggestions = data.map(item => ({
        display_name: item.display_name,
        name: item.name,
        address: item.address,
        formatted: formatLocationFromAddress(item.address, item.name)
      }));

      setLocationSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  // Format location from address object
  const formatLocationFromAddress = (address, name) => {
    const parts = [];
    
    // Add the name/place first
    if (name) parts.push(name);
    
    // Add city/town/village
    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.village) parts.push(address.village);
    
    // Add state/region
    if (address.state) parts.push(address.state);
    
    // Add country
    if (address.country) parts.push(address.country);
    
    // Remove duplicates and join
    const unique = [...new Set(parts)];
    return unique.join(', ');
  };

  // Handle location input change
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    
    // Debounce search
    if (value.length >= 3) {
      clearTimeout(window.locationSearchTimeout);
      window.locationSearchTimeout = setTimeout(() => {
        searchLocations(value);
      }, 300); // Wait 300ms after user stops typing
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select a location from suggestions
  const selectLocation = (suggestion) => {
    setLocation(suggestion.formatted);
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  // Get user's real location using browser Geolocation API
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    toast.info('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use OpenStreetMap's Nominatim service for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'PenLink Social App'
              }
            }
          );
          
          const data = await response.json();
          
          if (data && data.address) {
            const formatted = formatLocationFromAddress(data.address, data.name);
            setLocation(formatted);
            toast.success('📍 Location detected!');
          } else {
            // Fallback to coordinates
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            toast.success('Location coordinates added!');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Fallback to coordinates if geocoding fails
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          toast.success('Location coordinates added!');
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Make sure GPS/Location services are enabled.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An error occurred while getting location.';
        }
        
        toast.error(errorMessage);
        // Keep the location input open for manual entry
        setLocation('');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 0
      }
    );
  };

  const handlePostImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingPostImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result);
        toast.success('Image uploaded!');
        setUploadingPostImage(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setUploadingPostImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
      setUploadingPostImage(false);
    }
  };

  const handleBlogImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlogImage(reader.result);
        toast.success('Image uploaded!');
        setUploadingImage(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
      setUploadingImage(false);
    }
  };

  const insertFormatting = (format) => {
    const textarea = document.querySelector('[data-testid="blog-content-textarea"]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = blogContent.substring(start, end);
    let newText = '';

    switch(format) {
      case 'heading1':
        newText = `# ${selectedText || 'Heading'}`;
        break;
      case 'heading2':
        newText = `## ${selectedText || 'Subheading'}`;
        break;
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        break;
      case 'list':
        newText = `- ${selectedText || 'list item'}`;
        break;
      default:
        return;
    }

    const newContent = blogContent.substring(0, start) + newText + blogContent.substring(end);
    setBlogContent(newContent);
    
    setTimeout(() => textarea.focus(), 0);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !postImage) {
      toast.error('Please write something or add an image');
      return;
    }

    setLoading(true);
    try {
      let content = postContent;
      if (location) {
        content += `\n📍 ${location}`;
      }
      if (postImage) {
        content += `\n[IMAGE]${postImage}`;
      }
      
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
      <div className="pb-4 border-b">
        <h2 className="text-xl font-semibold text-center">Create {contentType === 'post' ? 'Post' : 'Blog'}</h2>
      </div>

      {/* Type Selector */}
      <div className="flex border-b mt-4">
        <button
          onClick={() => setContentType('post')}
          className={`flex-1 py-3 font-medium ${contentType === 'post' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-600'}`}
        >
          Quick Post
        </button>
        <button
          onClick={() => setContentType('blog')}
          className={`flex-1 py-3 font-medium ${contentType === 'blog' ? 'border-b-2 border-rose-600 text-rose-600' : 'text-gray-600'}`}
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
              />
            </div>

            {/* Post Image Preview */}
            {postImage && (
              <div className="relative">
                <img src={postImage} alt="Post" className="w-full max-h-96 object-cover rounded-lg" />
                <button
                  onClick={() => setPostImage('')}
                  className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-sm hover:bg-black/80"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Location Input with Autocomplete */}
            {location !== null && (
              <div className="relative" ref={locationInputRef}>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div className="relative flex-1">
                    <Input
                      placeholder="Search location (e.g., Lalgola) or detect"
                      value={location}
                      onChange={handleLocationChange}
                      onFocus={() => location.length >= 3 && setShowSuggestions(true)}
                      className="pr-8"
                      disabled={loadingLocation}
                    />
                    {location && !loadingLocation && (
                      <button
                        onClick={() => {
                          setLocation('');
                          setLocationSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {loadingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-1" />
                        Detect
                      </>
                    )}
                  </Button>
                </div>

                {/* Location Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectLocation(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 flex items-start space-x-2"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {suggestion.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {suggestion.display_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {showSuggestions && location.length >= 3 && locationSuggestions.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-500 text-center">
                      No locations found. Try a different search or detect your location.
                    </p>
                  </div>
                )}
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePostImageUpload}
                  className="hidden"
                  id="post-image-upload"
                />
                <label
                  htmlFor="post-image-upload"
                  className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                  title="Add photo"
                >
                  <ImageIcon className="w-5 h-5 text-green-600" />
                </label>
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
              <Button onClick={handleCreatePost} disabled={loading}>
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
            />
            
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Cover Image</label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBlogImageUpload}
                  className="hidden"
                  id="blog-image-upload"
                />
                <label
                  htmlFor="blog-image-upload"
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                </label>
                {blogImage && (
                  <div className="flex items-center space-x-2">
                    <img src={blogImage} alt="Preview" className="h-10 w-10 object-cover rounded" />
                    <button
                      onClick={() => setBlogImage('')}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Input
              placeholder="Brief excerpt"
              value={blogExcerpt}
              onChange={(e) => setBlogExcerpt(e.target.value)}
            />

            {/* Formatting Toolbar */}
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border">
              <button onClick={() => insertFormatting('heading1')} className="p-2 hover:bg-gray-200 rounded" title="Heading 1">
                <Heading className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('heading2')} className="p-2 hover:bg-gray-200 rounded text-sm font-bold" title="Heading 2">
                H2
              </button>
              <button onClick={() => insertFormatting('bold')} className="p-2 hover:bg-gray-200 rounded" title="Bold">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('italic')} className="p-2 hover:bg-gray-200 rounded" title="Italic">
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => insertFormatting('list')} className="p-2 hover:bg-gray-200 rounded" title="List">
                <List className="w-4 h-4" />
              </button>
            </div>

            <Textarea
              placeholder="Write your blog content... (Markdown: # Heading, **bold**, *italic*, - list)"
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
            />

            <div className="flex justify-end pt-3 border-t">
              <Button onClick={handleCreateBlog} disabled={loading}>
                Publish Blog
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
