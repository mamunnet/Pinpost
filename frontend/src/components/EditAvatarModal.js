import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, User } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const EditAvatarModal = ({ user, onClose, onUpdate }) => {
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [loading, setLoading] = useState(false);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Edit Profile Picture</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-4xl font-bold">
                  {(user.name || user.username)[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="avatarUrl">Profile Picture URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Enter image URL (e.g., https://example.com/avatar.jpg)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: Square image, at least 200x200 pixels
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {user.avatar && (
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