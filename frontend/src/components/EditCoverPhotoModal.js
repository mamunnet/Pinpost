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
  const [coverUrl, setCoverUrl] = useState(user.cover_photo || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(`${API}/users/cover-photo`, {
        cover_photo: coverUrl
      });
      toast.success('Cover photo updated successfully!');
      onUpdate(response.data);
    } catch (error) {
      toast.error('Failed to update cover photo');
      console.error('Cover photo update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API}/users/cover-photo`);
      toast.success('Cover photo removed successfully!');
      onUpdate(response.data);
    } catch (error) {
      toast.error('Failed to remove cover photo');
      console.error('Cover photo removal error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Edit Cover Photo</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview */}
          <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
            {coverUrl ? (
              <img 
                src={coverUrl} 
                alt="Cover preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No cover photo</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="coverUrl">Cover Photo URL</Label>
              <Input
                id="coverUrl"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 1200x400 pixels
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {user.cover_photo && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleRemove}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};