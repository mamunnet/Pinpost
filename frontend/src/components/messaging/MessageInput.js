import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, Smile, Image as ImageIcon, Mic, X, StopCircle, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessageInput = ({ 
  activeConversation, 
  onSendMessage, 
  onTyping, 
  sending 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // Preview image before sending
  const [selectedImage, setSelectedImage] = useState(null); // Store uploaded image URL
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Send message (text, image, or voice)
  const handleSendMessage = () => {
    if (selectedImage) {
      // Send image message
      onSendMessage({ 
        content: messageInput.trim() || '', 
        type: 'image',
        image_url: selectedImage
      });
      setMessageInput('');
      setImagePreview(null);
      setSelectedImage(null);
    } else if (messageInput.trim()) {
      // Send text message
      onSendMessage({ content: messageInput, type: 'text' });
      setMessageInput('');
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/image`, formData, {
        params: { upload_type: 'message' },
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSelectedImage(response.data.url);
      toast.success('Image ready to send!');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove image preview
  const handleRemoveImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Microphone access denied');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Cancel voice recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      audioChunksRef.current = [];
      toast.info('Recording cancelled');
    }
  };

  // Upload voice message
  const uploadVoiceMessage = async (audioBlob) => {
    setUploadingVoice(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `voice_${Date.now()}.webm`);

      const response = await axios.post(`${API}/upload/audio`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      onSendMessage({ 
        content: '', 
        type: 'voice',
        voice_url: response.data.url // Cloudinary returns 'url' field
      });
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Voice upload failed:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploadingVoice(false);
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeConversation) return null;

  return (
    <div className="bg-white border-t border-slate-200 flex-shrink-0">
      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-h-40 rounded-lg border border-slate-200"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
              onClick={handleRemoveImage}
            >
              <X className="w-4 h-4" />
            </Button>
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 flex items-center gap-2">
        {isRecording ? (
          // Recording UI
          <>
            <div className="flex-1 flex items-center gap-3 bg-red-50 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-600">
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              <span className="text-sm text-slate-600">Recording voice message...</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={cancelRecording}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="w-5 h-5" />
            </Button>
            <Button 
              size="icon" 
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <StopCircle className="w-5 h-5" />
            </Button>
          </>
        ) : (
          // Normal input UI
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-slate-600"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || sending || imagePreview}
            >
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </Button>
            
            <Input
              type="text"
              placeholder={imagePreview ? "Add a caption..." : "Type a message..."}
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                onTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 border-slate-200"
              disabled={sending || uploadingImage || uploadingVoice}
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-slate-600"
            >
              <Smile className="w-5 h-5" />
            </Button>
            
            {messageInput.trim() || imagePreview ? (
              <Button
                onClick={handleSendMessage}
                disabled={sending || uploadingImage || uploadingVoice || !selectedImage && !messageInput.trim()}
                size="icon"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            ) : (
              <Button
                onClick={startRecording}
                disabled={uploadingVoice}
                size="icon"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {uploadingVoice ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
