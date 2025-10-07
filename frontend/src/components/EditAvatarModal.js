import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, Upload, Trash2, Move, RotateCcw, ImageIcon } from 'lucide-react';
import axios from 'axios';
import { getUserAvatarUrl } from '@/utils/imageUtils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

export const EditAvatarModal = ({ user, onClose, onUpdate }) => {
  const originalAvatar = user.avatar ? getUserAvatarUrl(user) : '';
  const [avatarUrl, setAvatarUrl] = useState(originalAvatar);
  const [previewUrl, setPreviewUrl] = useState(originalAvatar);
  const [uploadedServerUrl, setUploadedServerUrl] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setUploading(true);
        
        // Create preview URL immediately
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        setPosition({ x: 0, y: 0 });
        setHasChanges(true);
        
        // Upload to server
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API}/upload/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        });
        
        // Store the server URL (relative path like /uploads/xxx.jpg)
        const serverPath = response.data.url; // This should be /uploads/filename.jpg
        setUploadedServerUrl(serverPath);
        setAvatarUrl(serverPath); // Store relative path for saving to DB
        
        // Update preview with full URL for display
        const fullUrl = `${BACKEND_URL}${serverPath}`;
        setPreviewUrl(fullUrl);
        
        toast.success('Image uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Upload failed');
        // Revert to original on error
        setPreviewUrl(originalAvatar);
        setAvatarUrl(user.avatar || '');
        setHasChanges(false);
      } finally {
        setUploading(false);
      }
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleMouseDown = (e) => {
    if (!avatarUrl) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (!avatarUrl) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const getImageStyle = () => {
    return {
      transform: `translate(${position.x}px, ${position.y}px)`,
      cursor: isDragging ? 'grabbing' : 'grab'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    
    console.log('� EditAvatarModal - Saving avatar');
    console.log('Avatar URL to save:', avatarUrl);
    setLoading(true);

    try {
      const response = await axios.put(`${API}/users/avatar`, {
        avatar: avatarUrl // Send relative path (/uploads/xxx.jpg)
      });
      
      console.log('✅ EditAvatarModal - Save successful');
      toast.success('Profile picture updated successfully!');
      
      // Pass the updated user data back
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('❌ EditAvatarModal - Save failed:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreOriginal = () => {
    if (originalAvatar) {
      setPreviewUrl(originalAvatar);
      setAvatarUrl(user.avatar || '');
      setUploadedServerUrl('');
      setPosition({ x: 0, y: 0 });
      setHasChanges(false);
      toast.success('Restored to original photo');
    } else {
      toast.error('No original photo to restore');
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API}/users/avatar`);
      toast.success('Profile picture removed successfully!');
      onUpdate(response.data);
      onClose();
    } catch (error) {
      toast.error('Failed to remove profile picture');
      console.error('Avatar removal error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Edit Profile Picture</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Photo Badge */}
          {originalAvatar && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-blue-300">
                  <img src={originalAvatar} alt="Current" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Current Photo</p>
                  <p className="text-xs text-blue-600">Your existing profile picture</p>
                </div>
              </div>
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRestoreOriginal}
                  className="flex items-center space-x-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </Button>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-gray-200 bg-gradient-to-br from-rose-500 to-amber-500 relative shadow-lg"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {previewUrl ? (
                <>
                  <img 
                    ref={imageRef}
                    src={previewUrl}
                    alt="Avatar preview" 
                    className="w-full h-full object-cover select-none"
                    style={getImageStyle()}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onError={(e) => {
                      console.error('Image failed to load:', previewUrl);
                      toast.error('Failed to load image preview');
                    }}
                    draggable={false}
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 pointer-events-none">
                    <Move className="w-3.5 h-3.5" />
                    <span>Drag to reposition</span>
                  </div>
                  {hasChanges && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      New
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <ImageIcon className="w-16 h-16 mb-2 opacity-70" />
                  <p className="text-5xl font-bold">
                    {(user.name || user.username)[0].toUpperCase()}
                  </p>
                  <p className="text-sm mt-2 opacity-70">No photo yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Upload Photo</Label>
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-all cursor-pointer hover:border-rose-400 hover:bg-rose-50 ${
                uploading ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-2"></div>
                  <p className="text-sm text-rose-600">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload from your device</p>
                  <p className="text-xs text-gray-500 mt-1">Recommended: Square image, 400x400 pixels</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-2">
            <div>
              {originalAvatar && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !hasChanges}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};