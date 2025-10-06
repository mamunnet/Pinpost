import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Palette, Upload, Bold, Italic, List, Heading, Image as ImageIcon, AtSign, Loader2, X, FileText, MessageCircle } from "lucide-react";
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
      // First, search specifically in India with more detailed results
      const indiaResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(query)}` +
        `&countrycodes=in` + // Restrict to India
        `&limit=8` + // Get more results
        `&addressdetails=1` +
        `&extratags=1` + // Get extra tags for post offices
        `&featuretype=settlement,postal_code,administrative`, // Prioritize cities, postal codes, districts
        {
          headers: {
            'User-Agent': 'PenLink Social App'
          }
        }
      );

      const indiaData = await indiaResponse.json();
      
      // Map and format Indian locations
      const indianSuggestions = indiaData.map(item => ({
        display_name: item.display_name,
        name: item.name,
        address: item.address,
        type: item.type,
        class: item.class,
        formatted: formatLocationFromAddress(item.address, item.name, item.type),
        isIndia: true
      }));

      // If we got good Indian results, use them
      if (indianSuggestions.length >= 3) {
        setLocationSuggestions(indianSuggestions);
        setShowSuggestions(true);
        return;
      }

      // If not enough Indian results, do a broader search but still prioritize India
      const globalResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PenLink Social App'
          }
        }
      );

      const globalData = await globalResponse.json();
      
      const globalSuggestions = globalData.map(item => ({
        display_name: item.display_name,
        name: item.name,
        address: item.address,
        type: item.type,
        formatted: formatLocationFromAddress(item.address, item.name, item.type),
        isIndia: item.address?.country === 'India' || item.address?.country_code === 'in'
      }));

      // Combine results, prioritizing Indian locations
      const allSuggestions = [...indianSuggestions, ...globalSuggestions];
      const uniqueSuggestions = allSuggestions.filter((item, index, self) =>
        index === self.findIndex((t) => t.formatted === item.formatted)
      );

      // Sort: Indian locations first
      uniqueSuggestions.sort((a, b) => {
        if (a.isIndia && !b.isIndia) return -1;
        if (!a.isIndia && b.isIndia) return 1;
        return 0;
      });

      setLocationSuggestions(uniqueSuggestions.slice(0, 8));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
    }
  };

  // Format location from address object - Enhanced for Indian locations
  const formatLocationFromAddress = (address, name, type) => {
    const parts = [];
    
    // For Indian locations, prioritize local context
    const isIndia = address?.country === 'India' || address?.country_code === 'in';
    
    if (isIndia) {
      // Indian location formatting
      
      // Add name/place (could be post office, locality, etc.)
      if (name && !name.match(/^\d+$/)) { // Exclude if name is just numbers
        parts.push(name);
      }
      
      // Add post office if available
      if (address.post_office && address.post_office !== name) {
        parts.push(`${address.post_office} Post Office`);
      }
      
      // Add suburb/neighbourhood/locality
      if (address.suburb && address.suburb !== name) {
        parts.push(address.suburb);
      } else if (address.neighbourhood && address.neighbourhood !== name) {
        parts.push(address.neighbourhood);
      } else if (address.locality && address.locality !== name) {
        parts.push(address.locality);
      }
      
      // Add city/town/village (if not already in name)
      if (address.city && !parts.includes(address.city)) {
        parts.push(address.city);
      } else if (address.town && !parts.includes(address.town)) {
        parts.push(address.town);
      } else if (address.village && !parts.includes(address.village)) {
        parts.push(address.village);
      }
      
      // Add district (important for Indian context)
      if (address.state_district && !parts.some(p => p.includes(address.state_district))) {
        parts.push(address.state_district + ' District');
      } else if (address.county && !parts.some(p => p.includes(address.county))) {
        parts.push(address.county);
      }
      
      // Add state (abbreviated if possible)
      if (address.state) {
        const stateAbbr = getIndianStateAbbreviation(address.state);
        parts.push(stateAbbr);
      }
      
      // Add postal code if available
      if (address.postcode) {
        parts.push(address.postcode);
      }
      
      // Always add "India" for clarity
      if (!parts.includes('India')) {
        parts.push('India');
      }
    } else {
      // International location formatting (original logic)
      if (name) parts.push(name);
      
      if (address.city) parts.push(address.city);
      else if (address.town) parts.push(address.town);
      else if (address.village) parts.push(address.village);
      
      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);
    }
    
    // Remove duplicates and join
    const unique = [...new Set(parts)];
    return unique.join(', ');
  };

  // Helper function to abbreviate Indian states
  const getIndianStateAbbreviation = (state) => {
    const stateMap = {
      'West Bengal': 'WB',
      'Uttar Pradesh': 'UP',
      'Madhya Pradesh': 'MP',
      'Himachal Pradesh': 'HP',
      'Arunachal Pradesh': 'AP (AR)',
      'Andhra Pradesh': 'AP',
      'Tamil Nadu': 'TN',
      'Maharashtra': 'MH',
      'Gujarat': 'GJ',
      'Rajasthan': 'RJ',
      'Karnataka': 'KA',
      'Kerala': 'KL',
      'Odisha': 'OD',
      'Telangana': 'TG',
      'Bihar': 'BR',
      'Assam': 'AS',
      'Jharkhand': 'JH',
      'Chhattisgarh': 'CG',
      'Punjab': 'PB',
      'Haryana': 'HR',
      'Uttarakhand': 'UK',
      'Goa': 'GA',
      'Tripura': 'TR',
      'Meghalaya': 'ML',
      'Manipur': 'MN',
      'Nagaland': 'NL',
      'Mizoram': 'MZ',
      'Sikkim': 'SK',
      'Delhi': 'DL',
      'Jammu and Kashmir': 'JK',
      'Ladakh': 'LA',
      'Puducherry': 'PY',
      'Chandigarh': 'CH',
      'Dadra and Nagar Haveli and Daman and Diu': 'DN',
      'Lakshadweep': 'LD',
      'Andaman and Nicobar Islands': 'AN'
    };
    
    return stateMap[state] || state;
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
    <div className="relative flex flex-col h-full max-h-[95vh]">
      {/* Premium Header with Glassmorphism */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-white via-white to-slate-50/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                contentType === 'post'
                  ? 'bg-gradient-to-br from-slate-100 to-slate-50 shadow-sm'
                  : 'bg-gradient-to-br from-slate-100 to-slate-50 shadow-sm'
              }`}>
                {contentType === 'post' ? (
                  <MessageCircle className="w-5 h-5 text-slate-700" />
                ) : (
                  <FileText className="w-5 h-5 text-slate-700" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Content</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {contentType === 'post' ? 'Share your thoughts with the world' : 'Write and publish your story'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                contentType === 'post'
                  ? 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 text-slate-700'
                  : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 text-slate-700'
              }`}>
                {contentType === 'post' ? (
                  <>
                    <MessageCircle className="w-3 h-3" />
                    <span>Quick Post</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3" />
                    <span>Blog Article</span>
                  </>
                )}
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
      </div>

      {/* Premium Tab Selector */}
      <div className="sticky top-[73px] z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex gap-1 px-6 pt-3">
          <button
            onClick={() => setContentType('post')}
            className={`flex-1 py-3.5 px-6 font-semibold rounded-t-xl transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden group ${
              contentType === 'post' 
                ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 shadow-md border-t border-x border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            {contentType === 'post' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 shadow-lg" />
            )}
            <MessageCircle className={`w-4 h-4 transition-transform duration-300 ${contentType === 'post' ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className="tracking-wide">Quick Post</span>
          </button>
          <button
            onClick={() => setContentType('blog')}
            className={`flex-1 py-3.5 px-6 font-semibold rounded-t-xl transition-all duration-300 flex items-center justify-center gap-2.5 relative overflow-hidden group ${
              contentType === 'blog' 
                ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 shadow-md border-t border-x border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            {contentType === 'blog' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 shadow-lg" />
            )}
            <FileText className={`w-4 h-4 transition-transform duration-300 ${contentType === 'blog' ? 'scale-110' : 'group-hover:scale-105'}`} />
            <span className="tracking-wide">Blog Article</span>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar" style={{ maxHeight: 'calc(95vh - 180px)' }}>
        {contentType === 'post' ? (
          <div className="space-y-4">
            {/* Premium Post Textarea with Background */}
            <div className={`rounded-2xl p-5 shadow-sm border transition-all duration-300 ${bgColor !== 'transparent' ? 'border-transparent shadow-lg' : 'border-slate-200 hover:border-slate-300'} ${selectedBg?.gradient || ''}`} style={{backgroundColor: bgColor !== 'transparent' ? bgColor : undefined}}>
              <Textarea
                placeholder="What's on your mind? Share your thoughts..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={6}
                className={`resize-none border-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none transition-all duration-200 ${bgColor !== 'transparent' ? 'bg-transparent text-white placeholder:text-white/80 font-medium text-lg' : 'bg-transparent text-slate-900 placeholder:text-slate-400 text-base leading-relaxed'}`}
              />
            </div>

            {/* Premium Post Image Preview */}
            {postImage && (
              <div className="relative group rounded-2xl overflow-hidden shadow-lg border-2 border-slate-200">
                <img src={postImage} alt="Post" className="w-full max-h-96 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <button
                  onClick={() => setPostImage('')}
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {/* Location Input with Autocomplete */}
            {location !== null && (
              <div className="relative" ref={locationInputRef}>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={getCurrentLocation}
                    disabled={loadingLocation}
                    className="p-2 hover:bg-rose-50 rounded-full transition-colors flex-shrink-0 group relative"
                    title="Detect my location"
                  >
                    {loadingLocation ? (
                      <Loader2 className="w-5 h-5 text-rose-600 animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
                    )}
                    {/* Tooltip */}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Click to detect
                    </span>
                  </button>
                  <div className="relative flex-1">
                    <Input
                      placeholder="Location auto-detected or type to search..."
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
                        title="Clear location"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Location Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => {
                      // Determine location type badge
                      const getLocationTypeBadge = () => {
                        const type = suggestion.type?.toLowerCase();
                        const className = suggestion.class?.toLowerCase();
                        
                        if (type === 'post_office' || suggestion.formatted.includes('Post Office')) {
                          return { label: 'Post Office', color: 'bg-green-100 text-green-700' };
                        }
                        if (type === 'city' || type === 'administrative' && className === 'boundary') {
                          return { label: 'City', color: 'bg-blue-100 text-blue-700' };
                        }
                        if (type === 'town') {
                          return { label: 'Town', color: 'bg-indigo-100 text-indigo-700' };
                        }
                        if (type === 'village' || type === 'hamlet') {
                          return { label: 'Village', color: 'bg-purple-100 text-purple-700' };
                        }
                        if (type === 'suburb' || type === 'neighbourhood') {
                          return { label: 'Area', color: 'bg-cyan-100 text-cyan-700' };
                        }
                        if (suggestion.formatted.includes('District')) {
                          return { label: 'District', color: 'bg-orange-100 text-orange-700' };
                        }
                        if (type === 'state') {
                          return { label: 'State', color: 'bg-rose-100 text-rose-700' };
                        }
                        if (suggestion.isIndia) {
                          return { label: 'Location', color: 'bg-gray-100 text-gray-700' };
                        }
                        return null;
                      };
                      
                      const badge = getLocationTypeBadge();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => selectLocation(suggestion)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 flex items-start space-x-2 ${
                            suggestion.isIndia ? 'bg-green-50/30' : ''
                          }`}
                        >
                          <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${
                            suggestion.isIndia ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {suggestion.name}
                              </p>
                              {badge && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color} whitespace-nowrap`}>
                                  {badge.label}
                                </span>
                              )}
                              {suggestion.isIndia && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                                  🇮🇳 India
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {suggestion.formatted}
                            </p>
                          </div>
                        </button>
                      );
                    })}
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

            {/* Premium Background Color Picker */}
            {showBgPicker && (
              <div className="p-4 border-2 border-purple-200 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-600" />
                    Choose Background
                  </h3>
                  <button
                    onClick={() => setShowBgPicker(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {bgColors.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => {
                        setBgColor(bg.value);
                        setShowBgPicker(false);
                      }}
                      className={`h-20 rounded-xl ${bg.gradient} border-2 transition-all duration-300 relative group ${
                        bgColor === bg.value 
                          ? 'border-purple-600 shadow-lg scale-105' 
                          : 'border-slate-200 hover:border-purple-400 hover:scale-105 hover:shadow-md'
                      }`}
                    >
                      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold transition-opacity ${
                        bgColor === bg.value ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>{bg.name}</span>
                      {bgColor === bg.value && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Action Bar */}
            <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 px-6 py-4 bg-gradient-to-t from-white via-white to-transparent border-t border-slate-200/60 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageUpload}
                    className="hidden"
                    id="post-image-upload"
                  />
                  <label
                    htmlFor="post-image-upload"
                    className="p-2.5 hover:bg-green-50 rounded-xl cursor-pointer transition-all duration-200 group relative"
                    title="Add photo"
                  >
                    <ImageIcon className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Add Image
                    </span>
                  </label>
                  <button
                    onClick={() => {
                      if (location === null) {
                        setLocation('');
                        // Auto-detect location when enabling
                        setTimeout(() => getCurrentLocation(), 100);
                      } else {
                        setLocation(null);
                      }
                    }}
                    className="p-2.5 hover:bg-rose-50 rounded-xl relative group transition-all duration-200"
                    title={location === null ? "Add location (auto-detect)" : "Remove location"}
                  >
                    <MapPin className={`w-5 h-5 transition-all duration-200 ${
                      location !== null ? 'text-rose-600 scale-110' : 'text-gray-600 group-hover:text-rose-600 group-hover:scale-105'
                    }`} />
                    {/* Tooltip */}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {location === null ? 'Auto-detect location' : 'Remove location'}
                    </span>
                  </button>
                  <button
                    onClick={() => setShowBgPicker(!showBgPicker)}
                    className="p-2.5 hover:bg-purple-50 rounded-xl transition-all duration-200 group relative"
                    title="Background color"
                  >
                    <Palette className={`w-5 h-5 transition-all duration-200 ${bgColor !== 'transparent' ? 'text-purple-600 scale-110' : 'text-gray-600 group-hover:text-purple-600 group-hover:scale-105'}`} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Background Color
                    </span>
                  </button>
                </div>
                <Button 
                  onClick={handleCreatePost} 
                  disabled={loading}
                  className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-900 hover:to-black text-white px-8 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg min-w-[120px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Posting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Post</span>
                      <span className="text-lg">→</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Premium Blog Title Input */}
            <div className="relative">
              <Input
                placeholder="Enter your blog title..."
                value={blogTitle}
                onChange={(e) => setBlogTitle(e.target.value)}
                className="text-xl font-bold border-2 border-slate-200 focus:border-slate-500 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-slate-50/30 placeholder:text-slate-400"
              />
              {blogTitle && (
                <div className="absolute right-3 top-3 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                  {blogTitle.length} chars
                </div>
              )}
            </div>
            
            {/* Premium Cover Image Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-600" />
                Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBlogImageUpload}
                className="hidden"
                id="blog-image-upload"
              />
              {!blogImage ? (
                <label
                  htmlFor="blog-image-upload"
                  className="group relative flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl cursor-pointer bg-gradient-to-br from-slate-50/50 to-slate-50/30 hover:from-slate-100/60 hover:to-slate-100/40 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-100 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <Upload className="w-8 h-8 text-slate-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        {uploadingImage ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </span>
                        ) : (
                          'Click to upload cover image'
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="relative group rounded-2xl overflow-hidden shadow-lg border-2 border-slate-200">
                  <img src={blogImage} alt="Cover" className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <button
                    onClick={() => setBlogImage('')}
                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                  <label
                    htmlFor="blog-image-upload"
                    className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Change</span>
                  </label>
                </div>
              )}
            </div>

            {/* Premium Excerpt Input */}
            <div className="relative">
              <Input
                placeholder="Write a brief excerpt (summary)..."
                value={blogExcerpt}
                onChange={(e) => setBlogExcerpt(e.target.value)}
                className="border-2 border-slate-200 focus:border-slate-500 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-slate-50/30 placeholder:text-slate-400"
              />
              {blogExcerpt && (
                <div className="absolute right-3 top-3 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                  {blogExcerpt.length} chars
                </div>
              )}
            </div>

            {/* Premium Formatting Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-gradient-to-r from-slate-50 via-slate-50/30 to-slate-50 rounded-xl border-2 border-slate-200 shadow-sm">
              <button 
                onClick={() => insertFormatting('heading1')} 
                className="p-2.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-md group relative" 
                title="Heading 1"
              >
                <Heading className="w-4 h-4 text-slate-600 group-hover:text-slate-600" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Heading 1</span>
              </button>
              <button 
                onClick={() => insertFormatting('heading2')} 
                className="p-2.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-md text-sm font-bold text-slate-600 hover:text-slate-600 group relative" 
                title="Heading 2"
              >
                H2
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Heading 2</span>
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
              <button 
                onClick={() => insertFormatting('bold')} 
                className="p-2.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-md group relative" 
                title="Bold"
              >
                <Bold className="w-4 h-4 text-slate-600 group-hover:text-slate-600" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Bold</span>
              </button>
              <button 
                onClick={() => insertFormatting('italic')} 
                className="p-2.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-md group relative" 
                title="Italic"
              >
                <Italic className="w-4 h-4 text-slate-600 group-hover:text-slate-600" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Italic</span>
              </button>
              <button 
                onClick={() => insertFormatting('list')} 
                className="p-2.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-md group relative" 
                title="List"
              >
                <List className="w-4 h-4 text-slate-600 group-hover:text-slate-600" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">List</span>
              </button>
            </div>

            {/* Premium Blog Content Textarea */}
            <Textarea
              placeholder="Write your blog content... Use Markdown: # Heading, **bold**, *italic*, - list"
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              rows={12}
              className="resize-none font-serif border-2 border-slate-200 focus:border-slate-500 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-slate-50/20 placeholder:text-slate-400 leading-relaxed"
              data-testid="blog-content-textarea"
            />

            {/* Premium Tags Input */}
            <div className="space-y-2">
              <Input
                placeholder="Add tags (comma separated, e.g., technology, tutorial, tips)..."
                value={blogTags}
                onChange={(e) => setBlogTags(e.target.value)}
                className="border-2 border-slate-200 focus:border-slate-500 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-white to-slate-50/30 placeholder:text-slate-400"
              />
              {blogTags && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {blogTags.split(',').map((tag, idx) => tag.trim() && (
                    <span key={idx} className="px-3 py-1 bg-gradient-to-r from-slate-100 to-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 shadow-sm">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Premium Publish Button */}
            <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 px-6 py-4 bg-gradient-to-t from-white via-white to-transparent border-t border-slate-200/60 backdrop-blur-sm">
              <div className="flex justify-end">
                <Button 
                  onClick={handleCreateBlog} 
                  disabled={loading}
                  className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-700 hover:from-slate-700 hover:via-slate-800 hover:to-slate-800 text-white px-8 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg min-w-[160px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Publish Blog</span>
                      <span className="text-lg">→</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
