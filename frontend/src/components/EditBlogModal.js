import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const EditBlogModal = ({ isOpen, onClose, blog, onBlogUpdated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initialize form data when blog changes
  useEffect(() => {
    if (blog) {
      setTitle(blog.title || "");
      setContent(blog.content || "");
      setExcerpt(blog.excerpt || "");
      setTags(blog.tags ? blog.tags.join(", ") : "");
      setCoverImage(blog.cover_image || "");
    }
  }, [blog]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      const serverUrl = `${BACKEND_URL}${response.data.url}`;
      setCoverImage(serverUrl);
      toast.success("📸 Image uploaded successfully!");
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("❌ Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Blog title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Blog content cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await axios.put(
        `${API}/blogs/${blog.id}`,
        {
          title: title.trim(),
          content: content.trim(),
          excerpt: excerpt.trim(),
          cover_image: coverImage,
          tags: tagsArray
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Blog updated successfully!", {
        description: "Your blog article has been updated.",
        duration: 3000
      });

      // Call the callback to update the blog in the parent component
      if (onBlogUpdated) {
        onBlogUpdated(response.data);
      }

      onClose();
    } catch (error) {
      console.error('Error updating blog:', error);
      toast.error("❌ Failed to update blog", {
        description: error.response?.data?.detail || "Something went wrong",
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (blog) {
      setTitle(blog.title || "");
      setContent(blog.content || "");
      setExcerpt(blog.excerpt || "");
      setTags(blog.tags ? blog.tags.join(", ") : "");
      setCoverImage(blog.cover_image || "");
    }
    onClose();
  };

  if (!blog) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Edit Blog Article</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog title..."
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Excerpt */}
          <div>
            <Label htmlFor="excerpt" className="text-sm font-medium">
              Excerpt
            </Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of your blog post..."
              rows={2}
              className="mt-1 resize-none"
              disabled={loading}
            />
          </div>

          {/* Cover Image */}
          <div>
            <Label className="text-sm font-medium">Cover Image</Label>
            <div className="mt-1 space-y-3">
              {coverImage && (
                <div className="relative">
                  <img
                    src={coverImage}
                    alt="Blog cover"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCoverImage("")}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="blog-image-upload"
                  disabled={loading || uploadingImage}
                />
                <label htmlFor="blog-image-upload">
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    disabled={loading || uploadingImage}
                    asChild
                  >
                    <span>
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {coverImage ? "Change Image" : "Upload Image"}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="technology, programming, tutorial (comma separated)"
              className="mt-1"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Separate tags with commas
            </p>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium">
              Content *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your blog content..."
              rows={12}
              className="mt-1 resize-none text-sm leading-relaxed"
              disabled={loading}
            />
            <div className="text-xs text-slate-500 mt-1">
              {content.length} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="px-6"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !title.trim() || !content.trim() || uploadingImage}
              className="px-6 bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBlogModal;