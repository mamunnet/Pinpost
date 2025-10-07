import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Image as ImageIcon, 
  Bold,
  Italic,
  List,
  Heading,
  X,
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Hash
} from "lucide-react";
import { toast } from "sonner";
import { getImageUrl, getUserAvatarUrl } from "@/utils/imageUtils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export const CreateBlogPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/auth');
    }
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/image?upload_type=blog`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      // Cloudinary returns full HTTPS URL
      const cloudinaryUrl = response.data.url;
      setCoverImage(cloudinaryUrl);
      toast.success('Cover image added successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const insertFormatting = (format) => {
    const textarea = document.querySelector('[data-blog-content]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = '';
    let cursorOffset = 0;

    switch(format) {
      case 'heading1':
        newText = `# ${selectedText || 'Heading 1'}`;
        cursorOffset = selectedText ? 0 : -9;
        break;
      case 'heading2':
        newText = `## ${selectedText || 'Heading 2'}`;
        cursorOffset = selectedText ? 0 : -9;
        break;
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? 0 : -9;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? 0 : -11;
        break;
      case 'list':
        newText = `\n- ${selectedText || 'List item'}`;
        cursorOffset = selectedText ? 0 : -9;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + newText.length + cursorOffset;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Blog title is required');
      return;
    }

    if (!content.trim()) {
      toast.error('Blog content cannot be empty');
      return;
    }

    setPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      await axios.post(`${API}/blogs`, {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || content.substring(0, 150) + '...',
        cover_image: coverImage,
        tags: tagsArray,
        is_draft: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Blog published successfully!');
      navigate('/blogs');
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish blog');
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error('At least add a title to save draft');
      return;
    }

    setSavingDraft(true);
    try {
      const token = localStorage.getItem('token');
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      await axios.post(`${API}/blogs`, {
        title: title.trim(),
        content: content.trim() || '',
        excerpt: excerpt.trim() || '',
        cover_image: coverImage || '',
        tags: tagsArray,
        is_draft: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Draft saved successfully!');
      
      // Also save to localStorage as backup
      const draft = {
        title,
        content,
        excerpt,
        coverImage,
        tags,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('blog_draft', JSON.stringify(draft));
      
      // Navigate to blogs page
      navigate('/blogs');
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('blog_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (window.confirm('You have an unsaved draft. Would you like to restore it?')) {
          setTitle(parsed.title || '');
          setContent(parsed.content || '');
          setExcerpt(parsed.excerpt || '');
          setCoverImage(parsed.coverImage || '');
          setTags(parsed.tags || '');
          toast.success('Draft restored!');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header - positioned below main Header */}
      <div className="fixed top-28 left-0 right-0 bg-white border-b shadow-sm z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (title || content) {
                  if (window.confirm('You have unsaved changes. Do you want to leave?')) {
                    navigate(-1);
                  }
                } else {
                  navigate(-1);
                }
              }}
              className="text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Write Blog Article</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreview(!preview)}
              className="hidden sm:flex"
            >
              <Eye className="w-4 h-4 mr-2" />
              {preview ? 'Edit' : 'Preview'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft}
            >
              {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline ml-2">Draft</span>
            </Button>
            
            <Button
              onClick={handlePublish}
              disabled={publishing || !title.trim() || !content.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pb-20" style={{ paddingTop: '180px' }}>
        {!preview ? (
          <Card className="shadow-md">
            <CardContent className="p-6 space-y-6">
              {/* Author Info */}
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getUserAvatarUrl(currentUser)} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {currentUser.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{currentUser.full_name || currentUser.username}</p>
                  <p className="text-xs text-gray-500">Writing a new article</p>
                </div>
              </div>

              <Separator />

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image (Optional)
                </label>
                {coverImage ? (
                  <div className="relative group">
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 p-2 bg-gray-900/70 hover:bg-gray-900 rounded-full transition"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload cover image</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Blog title..."
                  className="text-3xl font-bold border-0 focus-visible:ring-0 px-0 placeholder:text-gray-300"
                  maxLength={200}
                />
                {title.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt (Optional)
                </label>
                <Textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of your article..."
                  className="resize-none"
                  rows={3}
                  maxLength={300}
                />
                {excerpt.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">{excerpt.length}/300</p>
                )}
              </div>

              <Separator />

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('heading1')}
                  title="Heading 1"
                >
                  <Heading className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('heading2')}
                  title="Heading 2"
                >
                  <Heading className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('bold')}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('italic')}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('list')}
                  title="List"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div>
                <Textarea
                  data-blog-content
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article content... (Supports Markdown)"
                  className="min-h-[400px] text-base leading-relaxed resize-none font-serif"
                  maxLength={50000}
                />
                {content.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">{content.length}/50,000 characters</p>
                )}
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Tags (comma separated)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., Technology, Tutorial, Web Development"
                  className="focus-visible:ring-blue-500"
                />
                {tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.split(',').map((tag, index) => tag.trim() && (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Preview Mode */
          <Card className="shadow-md">
            <CardContent className="p-8">
              {coverImage && (
                <img src={coverImage} alt="Cover" className="w-full h-80 object-cover rounded-lg mb-8" />
              )}
              
              <h1 className="text-4xl font-bold mb-4">{title || 'Untitled'}</h1>
              
              {excerpt && (
                <p className="text-lg text-gray-600 mb-6">{excerpt}</p>
              )}

              <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getUserAvatarUrl(currentUser)} />
                  <AvatarFallback>{currentUser.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{currentUser.full_name || currentUser.username}</p>
                  <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <Separator className="mb-6" />

              <div className="prose max-w-none whitespace-pre-wrap font-serif text-base leading-relaxed">
                {content || 'Your content will appear here...'}
              </div>

              {tags && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
                  {tags.split(',').map((tag, index) => tag.trim() && (
                    <Badge key={index} variant="outline">
                      #{tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
