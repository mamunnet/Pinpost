import { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, MapPin, Globe, Calendar, Upload, Move, RotateCcw } from "lucide-react";
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
    location: "",
    website: ""
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [imageFiles, setImageFiles] = useState({
    avatar: null,
    cover: null
  });
  const [imageStyles, setImageStyles] = useState({
    avatar: { objectPosition: 'center center', objectFit: 'cover' },
    cover: { objectPosition: 'center center', objectFit: 'cover' }
  });
  const [showImageControls, setShowImageControls] = useState({
    avatar: false,
    cover: false
  });
  
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white text-2xl">
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>

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
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Photos */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Add Your Photos</h3>
                  <p className="text-gray-600">Make your profile stand out with great photos</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>Profile Photo</span>
                    </Label>
                    <Input
                      placeholder="https://example.com/your-photo.jpg"
                      value={formData.avatar}
                      onChange={(e) => handleInputChange('avatar', e.target.value)}
                      className="h-12 text-base mt-2"
                    />
                    {formData.avatar && (
                      <div className="mt-3 flex justify-center">
                        <img src={formData.avatar} alt="Profile preview" className="w-20 h-20 rounded-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>Cover Photo</span>
                    </Label>
                    <Input
                      placeholder="https://example.com/your-cover.jpg"
                      value={formData.cover_photo}
                      onChange={(e) => handleInputChange('cover_photo', e.target.value)}
                      className="h-12 text-base mt-2"
                    />
                    {formData.cover_photo && (
                      <div className="mt-3">
                        <img src={formData.cover_photo} alt="Cover preview" className="w-full h-32 rounded-lg object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={prevStep} variant="outline" className="flex-1 h-12">
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex-1 h-12">
                    Continue
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

                  <div>
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </Label>
                    <Input
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="h-12 text-base mt-2"
                    />
                  </div>
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