import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Camera, MapPin, Calendar, Upload, Move3D, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ProfileSetup = ({ user, onComplete }) => {
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar: "",
    cover_photo: "",
    date_of_birth: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ x: 50, y: 50, zoom: 100 });
  const [coverPosition, setCoverPosition] = useState({ x: 50, y: 50, zoom: 100 });
  const [isDragging, setIsDragging] = useState(false);
  
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field, file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setUploadingImage(true);
        
        // Create preview URL for immediate display
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, [field]: previewUrl }));
        
        // Upload to server
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        
        const response = await axios.post(`${API}/upload/image`, uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Replace preview URL with server URL
        const serverUrl = `${BACKEND_URL}${response.data.url}`;
        setFormData(prev => ({ ...prev, [field]: serverUrl }));
        
        toast.success('Image uploaded successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        // On error, keep preview URL for now
        toast.error('Upload failed, using preview image');
      } finally {
        setUploadingImage(false);
      }
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const getImageStyle = (position, isCircle = false) => {
    const { x, y, zoom } = position;
    return {
      transform: `translate(-${x}%, -${y}%) scale(${zoom / 100})`,
      transformOrigin: `${x}% ${y}%`,
      objectFit: 'cover',
      objectPosition: `${x}% ${y}%`
    };
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/setup-profile`, formData);
      toast.success("Profile setup complete! Welcome to PenLink!");
      onComplete(response.data);
    } catch (error) {
      toast.error("Failed to setup profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Badge variant={step >= 1 ? "default" : "outline"} className="w-8 h-8 rounded-full">1</Badge>
            <div className={`w-12 h-1 rounded-full ${step >= 2 ? 'bg-rose-500' : 'bg-gray-200'}`}></div>
            <Badge variant={step >= 2 ? "default" : "outline"} className="w-8 h-8 rounded-full">2</Badge>
            <div className={`w-12 h-1 rounded-full ${step >= 3 ? 'bg-rose-500' : 'bg-gray-200'}`}></div>
            <Badge variant={step >= 3 ? "default" : "outline"} className="w-8 h-8 rounded-full">3</Badge>
          </div>
          <p className="text-center text-gray-600">
            {step === 1 && "Let's start with the basics"}
            {step === 2 && "Add your photos"}
            {step === 3 && "Final touches"}
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Complete Your Profile
              </h1>
            </div>
            <CardDescription className="text-lg">
              Help others discover and connect with you on PenLink
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Info + Profile Photo */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4 border-4 border-white shadow-lg">
                      {formData.avatar ? (
                        <img 
                          src={formData.avatar} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          style={getImageStyle(avatarPosition, true)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute bottom-2 right-2 w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>

                {/* Profile Photo Upload */}
                <div className="mb-6">
                  <Label className="text-base font-medium mb-3 block text-center">
                    {formData.avatar ? 'Change Profile Photo' : 'Add Profile Photo'}
                  </Label>
                  <div 
                    onClick={() => !uploadingImage && avatarInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all ${
                      uploadingImage 
                        ? 'cursor-wait bg-rose-50 border-rose-300' 
                        : 'cursor-pointer hover:border-rose-400 hover:bg-rose-50'
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-2"></div>
                        <p className="text-sm text-rose-600">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload profile photo</p>
                        <p className="text-xs text-gray-400">JPG, PNG, WebP up to 5MB</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('avatar', e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {/* Profile Photo Position Controls */}
                {formData.avatar && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium mb-3 block flex items-center">
                      <Move3D className="w-4 h-4 mr-2" />
                      Adjust Profile Photo Position
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-600">Horizontal Position</Label>
                        <Slider
                          value={[avatarPosition.x]}
                          onValueChange={([x]) => setAvatarPosition(prev => ({ ...prev, x }))}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Vertical Position</Label>
                        <Slider
                          value={[avatarPosition.y]}
                          onValueChange={([y]) => setAvatarPosition(prev => ({ ...prev, y }))}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Zoom Level</Label>
                        <Slider
                          value={[avatarPosition.zoom]}
                          onValueChange={([zoom]) => setAvatarPosition(prev => ({ ...prev, zoom }))}
                          min={50}
                          max={200}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => setAvatarPosition({ x: 50, y: 50, zoom: 100 })}
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

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base font-medium">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="h-12 text-base mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">This will be displayed on your posts</p>
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell people about yourself..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="mt-2 resize-none"
                    />
                    <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                  </div>
                </div>

                <Button onClick={nextStep} className="w-full h-12 text-base">
                  Continue to Cover Photo
                </Button>
              </div>
            )}

            {/* Step 2: Cover Photo */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Add Your Cover Photo</h3>
                  <p className="text-gray-600">Choose a cover photo that represents you</p>
                </div>

                {/* Cover Photo Preview */}
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 h-40">
                  {formData.cover_photo ? (
                    <img 
                      src={formData.cover_photo} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                      style={getImageStyle(coverPosition)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-60" />
                        <p className="text-lg font-medium opacity-80">No cover photo yet</p>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    {uploadingImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>{formData.cover_photo ? 'Change' : 'Add'} Cover</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Cover Photo Upload */}
                <div>
                  <div 
                    onClick={() => !uploadingImage && coverInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all ${
                      uploadingImage 
                        ? 'cursor-wait bg-blue-50 border-blue-300' 
                        : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-blue-600">Uploading cover photo...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-base text-gray-700 font-medium">Click to upload cover photo</p>
                        <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP up to 10MB</p>
                        <p className="text-xs text-gray-400 mt-2">Recommended: 1200 x 400 pixels</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload('cover_photo', e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {/* Cover Photo Position Controls */}
                {formData.cover_photo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium mb-4 block flex items-center">
                      <Move3D className="w-4 h-4 mr-2" />
                      Adjust Cover Photo Position
                    </Label>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-gray-600">Horizontal Position</Label>
                        <Slider
                          value={[coverPosition.x]}
                          onValueChange={([x]) => setCoverPosition(prev => ({ ...prev, x }))}
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
                          value={[coverPosition.y]}
                          onValueChange={([y]) => setCoverPosition(prev => ({ ...prev, y }))}
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
                          value={[coverPosition.zoom]}
                          onValueChange={([zoom]) => setCoverPosition(prev => ({ ...prev, zoom }))}
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
                        onClick={() => setCoverPosition({ x: 50, y: 50, zoom: 100 })}
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

                <div className="flex space-x-3">
                  <Button onClick={prevStep} variant="outline" className="flex-1 h-12">
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex-1 h-12">
                    Final Details
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Additional Info */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Final Details</h3>
                  <p className="text-gray-600">Help others learn more about you</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date of Birth</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="h-12 text-base mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Location</span>
                    </Label>
                    <Input
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="h-12 text-base mt-2"
                    />
                  </div>

                  {/* Website field removed */}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">You're almost done! 🎉</h4>
                  <p className="text-blue-800 text-sm">
                    Your profile will help other PenLink users discover your content and connect with you.
                    You can always update these details later in your settings.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={prevStep} variant="outline" className="flex-1 h-12">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.name.trim()} 
                    className="flex-1 h-12 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Setting up...</span>
                      </div>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact our <button className="text-rose-600 hover:underline">support team</button>
          </p>
        </div>
      </div>
    </div>
  );
};