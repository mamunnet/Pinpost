import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Trash2, Move } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export const EditCoverPhotoModal = ({ user, onClose, onUpdate }) => {
  const [coverPhoto, setCoverPhoto] = useState(user.cover_photo || "");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setUploading(true);
        
        // Create preview URL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setCoverPhoto(previewUrl);
        setPosition({ x: 0, y: 0 }); // Reset position for new image
        
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
        
        // Replace preview URL with server URL
        const serverUrl = `${BACKEND_URL}${response.data.url}`;
        setCoverPhoto(serverUrl);
        
        toast.success('Image uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Upload failed, using preview image');
      } finally {
        setUploading(false);
      }
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleMouseDown = (e) => {
    if (!coverPhoto) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({
      x: newX,
      y: newY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (!coverPhoto) return;
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
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    setPosition({
      x: newX,
      y: newY
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

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/users/cover-photo`, 
        { cover_photo: coverPhoto },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast.success('Cover photo updated successfully!');
      onUpdate(response.data);
    } catch (error) {
      console.error('Cover photo update error:', error);
      toast.error('Failed to update cover photo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/users/cover-photo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Cover photo removed successfully!');
      onUpdate(response.data);
    } catch (error) {
      console.error('Cover photo removal error:', error);
      toast.error('Failed to remove cover photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Edit Cover Photo</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cover Photo Preview */}
          <div className="relative">
            <div 
              className="h-56 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl overflow-hidden relative"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {coverPhoto ? (
                <>
                  <img 
                    ref={imageRef}
                    src={coverPhoto} 
                    alt="Cover preview" 
                    className="w-full h-full object-cover select-none"
                    style={getImageStyle()}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    draggable={false}
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5">
                    <Move className="w-3.5 h-3.5" />
                    <span>Drag to reposition</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/80">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-lg">No cover photo</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload Options */}
          <div className="space-y-3">
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
                    <p className="text-xs text-gray-500 mt-1">Recommended: 1500x500 pixels</p>
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
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-2">
            <div>
              {user.cover_photo && (
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
                onClick={handleSave}
                disabled={loading || !coverPhoto}
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