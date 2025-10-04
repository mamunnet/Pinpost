import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Camera, Upload, Move3D, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const EditCoverPhotoModal = ({ user, onClose, onUpdate }) => {
  const [coverPhoto, setCoverPhoto] = useState(user.cover_photo || "");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50, zoom: 100 });
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setUploading(true);
        
        // Create preview URL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setCoverPhoto(previewUrl);
        
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

  const getImageStyle = () => {
    const { x, y, zoom } = position;
    return {
      transform: `translate(-${x}%, -${y}%) scale(${zoom / 100})`,
      transformOrigin: `${x}% ${y}%`,
      objectFit: 'cover',
      objectPosition: `${x}% ${y}%`
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Cover Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cover Photo Preview */}
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg overflow-hidden">
              {coverPhoto ? (
                <img 
                  src={coverPhoto} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                  style={getImageStyle()}
                />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Upload from Gallery</Label>
              <div 
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${
                  uploading ? 'opacity-50 cursor-wait' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-blue-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload</p>
                    <p className="text-xs text-gray-400">JPG, PNG, WebP up to 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">Or Enter URL</Label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={coverPhoto}
                onChange={(e) => setCoverPhoto(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* Position Controls */}
          {coverPhoto && (
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm font-medium mb-4 block flex items-center">
                <Move3D className="w-4 h-4 mr-2" />
                Adjust Cover Photo Position
              </Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Horizontal Position</Label>
                  <Slider
                    value={[position.x]}
                    onValueChange={([x]) => setPosition(prev => ({ ...prev, x }))}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Vertical Position</Label>
                  <Slider
                    value={[position.y]}
                    onValueChange={([y]) => setPosition(prev => ({ ...prev, y }))}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Top</span>
                    <span>Center</span>
                    <span>Bottom</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Zoom Level</Label>
                  <Slider
                    value={[position.zoom]}
                    onValueChange={([zoom]) => setPosition(prev => ({ ...prev, zoom }))}
                    min={80}
                    max={150}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Zoom Out</span>
                    <span>Normal</span>
                    <span>Zoom In</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setPosition({ x: 50, y: 50, zoom: 100 })}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset Position
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            {coverPhoto && (
              <Button 
                type="button" 
                onClick={handleRemove} 
                disabled={loading}
                variant="outline"
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove</span>
              </Button>
            )}
            <Button 
              type="button" 
              onClick={handleSave} 
              disabled={loading || !coverPhoto}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Cover Photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};