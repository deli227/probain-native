import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
  cameraFacing?: "user" | "environment";
  title?: string;
}

export const PhotoPickerSheet = ({
  open,
  onOpenChange,
  onFileSelected,
  uploading = false,
  cameraFacing = "user",
  title = "Ajouter une photo",
}: PhotoPickerSheetProps) => {
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileSelected(e);
      onOpenChange(false);
    }
    e.target.value = '';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-6 pb-8 pt-6 rounded-t-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center">{title}</SheetTitle>
          <SheetDescription className="sr-only">
            Choisir la source de la photo
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleCameraClick}
            disabled={uploading}
            className="flex items-center gap-4 w-full min-h-[56px] px-4 py-3
                       bg-primary/5 hover:bg-primary/10 active:bg-primary/15
                       rounded-xl transition-colors duration-150
                       disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <span className="text-base font-medium">Prendre une photo</span>
          </button>

          <button
            type="button"
            onClick={handleGalleryClick}
            disabled={uploading}
            className="flex items-center gap-4 w-full min-h-[56px] px-4 py-3
                       bg-primary/5 hover:bg-primary/10 active:bg-primary/15
                       rounded-xl transition-colors duration-150
                       disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <span className="text-base font-medium">Choisir depuis la galerie</span>
          </button>
        </div>

        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="w-full mt-4 text-muted-foreground"
        >
          Annuler
        </Button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture={cameraFacing}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />
      </SheetContent>
    </Sheet>
  );
};
