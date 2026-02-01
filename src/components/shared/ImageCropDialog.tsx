import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, ZoomIn } from 'lucide-react';

interface ImageCropDialogProps {
  imageSrc: string | null;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

/**
 * Create a cropped image from source using Canvas API.
 */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.9,
    );
  });
}

export const ImageCropDialog = ({
  imageSrc,
  open,
  onClose,
  onCropComplete,
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((z: number) => {
    setZoom(z);
  }, []);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleValidate = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch {
      // Silently fail — parent handles error
    } finally {
      setProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete]);

  const handleClose = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  }, [onClose]);

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Annuler"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <h2 className="text-sm font-semibold text-white">Recadrer la photo</h2>
        <div className="w-9" />
      </div>

      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={handleCropComplete}
        />
      </div>

      {/* Controls — pb-24 pour degager la BottomTabBar sur mobile */}
      <div className="px-6 pt-4 pb-24 md:pb-4 bg-black/80 backdrop-blur-sm border-t border-white/10 space-y-4" style={{ paddingBottom: `max(6rem, calc(env(safe-area-inset-bottom) + 5rem))` }}>
        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <ZoomIn className="h-4 w-4 text-white/50 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
            aria-label="Zoom"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 h-12 text-white/70 hover:text-white hover:bg-white/10 rounded-xl font-semibold"
            onClick={handleClose}
            disabled={processing}
          >
            Annuler
          </Button>
          <Button
            className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl"
            onClick={handleValidate}
            disabled={processing || !croppedAreaPixels}
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Valider
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
