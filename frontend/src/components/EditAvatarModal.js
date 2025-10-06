import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, Upload, Trash2, Move } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export const EditAvatarModal = ({ user, onClose, onUpdate }) => {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
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
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setAvatarUrl(previewUrl);
        setPosition({ x: 0, y: 0 });
        
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
        
        const serverUrl = `${BACKEND_URL}${response.data.url}`;
        setAvatarUrl(serverUrl);
        
        toast.success('Image uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Upload failed');
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
    setLoading(true);

    try {
      const response = await axios.put(`${API}/users/avatar`, {
        avatar: avatarUrl
      });
      toast.success('Profile picture updated successfully!');
      onUpdate(response.data);
    } catch (error) {
      toast.error('Failed to update profile picture');
      console.error('Avatar update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API}/users/avatar`);
      toast.success('Profile picture removed successfully!');
      onUpdate(response.data);
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
          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-gray-200 bg-gradient-to-br from-rose-500 to-amber-500 relative"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {avatarUrl ? (
                <>
                  <img 
                    ref={imageRef}
                    src={avatarUrl} 
                    alt="Avatar preview" 
                    className="w-full h-full object-cover select-none"
                    style={getImageStyle()}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    draggable={false}
                  />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 pointer-events-none">
                    <Move className="w-3.5 h-3.5" />
                    <span>Drag to reposition</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold">
                  {(user.name || user.username)[0].toUpperCase()}
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
              {user.avatar && (
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
                disabled={loading || !avatarUrl}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
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