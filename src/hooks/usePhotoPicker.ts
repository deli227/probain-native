import { useState, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface UsePhotoPickerOptions {
  onFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}

export const usePhotoPicker = ({ onFileSelected }: UsePhotoPickerOptions) => {
  const [isPickerOpen, setPickerOpen] = useState(false);
  const isMobile = useIsMobile();
  const desktopInputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    if (isMobile) {
      setPickerOpen(true);
    } else {
      desktopInputRef.current?.click();
    }
  }, [isMobile]);

  const handleFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelected(event);
    },
    [onFileSelected]
  );

  return {
    isPickerOpen,
    openPicker,
    setPickerOpen,
    isMobile,
    desktopInputRef,
    handleFileSelected,
  };
};
