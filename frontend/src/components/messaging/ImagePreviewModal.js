import React from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, sender }) => {
  const [zoom, setZoom] = React.useState(100);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  React.useEffect(() => {
    if (!isOpen) {
      setZoom(100); // Reset zoom when modal closes
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {sender ? `Image from ${sender}` : 'Image Preview'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="h-8 w-8"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600 min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="h-8 w-8"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              {/* Download Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Image Container */}
        <div className="bg-slate-50 p-6 max-h-[70vh] overflow-auto flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Preview"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transition: 'transform 0.2s ease'
            }}
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
