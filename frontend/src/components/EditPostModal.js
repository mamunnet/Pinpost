import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X, Upload, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [postImage, setPostImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Parse post content when post changes
  useEffect(() => {
    if (post && post.content) {
      parsePostContent(post.content);
    }
  }, [post]);

  const parsePostContent = (rawContent) => {
    let textContent = rawContent;
    let extractedLocation = "";
    let extractedImage = "";

    // Extract image
    if (rawContent.includes('[IMAGE]')) {
      const parts = rawContent.split('[IMAGE]');
      textContent = parts[0];
      extractedImage = parts[1] || "";
    }

    // Extract location
    const locationMatch = textContent.match(/📍\s*(.+)$/m);
    if (locationMatch) {
      extractedLocation = locationMatch[1].trim();
      textContent = textContent.replace(/\n?📍\s*.+$/m, '');
    }

    setContent(textContent.trim());
    setLocation(extractedLocation);
    setPostImage(extractedImage);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result);
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

  const removeImage = () => {
    setPostImage("");
  };

  const handleSave = async () => {
    if (!content.trim() && !postImage) {
      toast.error("Post must have content or an image");
      return;
    }

    setLoading(true);
    try {
      // Reconstruct content in the correct format
      let finalContent = content.trim();
      
      if (location.trim()) {
        finalContent += `\n📍 ${location.trim()}`;
      }
      
      if (postImage) {
        finalContent += `\n[IMAGE]${postImage}`;
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API}/posts/${post.id}`,
        { content: finalContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Post updated successfully!", {
        description: "Your post has been updated.",
        duration: 3000
      });

      // Call the callback to update the post in the parent component
      if (onPostUpdated) {
        onPostUpdated(response.data);
      }

      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error("❌ Failed to update post", {
        description: error.response?.data?.detail || "Something went wrong",
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (post) {
      parsePostContent(post.content || "");
    }
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Edit Post</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content Input */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium">
              Content
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              className="mt-1 resize-none text-base leading-relaxed"
              disabled={loading}
            />
            <div className="text-xs text-slate-500 mt-1">
              {content.length}/1000 characters
            </div>
          </div>

          {/* Location Input */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium">
              Location (optional)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location..."
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Image Section */}
          <div>
            <Label className="text-sm font-medium">Image (optional)</Label>
            <div className="mt-1 space-y-3">
              {postImage && (
                <div className="relative">
                  <img
                    src={postImage}
                    alt="Post image"
                    className="w-full max-h-64 object-cover rounded-lg border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="post-image-upload"
                  disabled={loading || uploadingImage}
                />
                <label htmlFor="post-image-upload">
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
                          {postImage ? "Change Image" : "Add Image"}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="px-4"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || (!content.trim() && !postImage) || content.length > 1000 || uploadingImage}
              className="px-4 bg-slate-900 hover:bg-slate-800"
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

export default EditPostModal;