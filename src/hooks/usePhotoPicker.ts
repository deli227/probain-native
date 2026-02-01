import { useRef, useCallback } from 'react';

interface UsePhotoPickerOptions {
  onFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}

export const usePhotoPicker = ({ onFileSelected }: UsePhotoPickerOptions) => {
  // On declenche directement l'input file natif sur mobile et desktop.
  // Sur mobile, le systeme affiche automatiquement le choix camera/galerie
  // via le picker natif du telephone (pas besoin de PhotoPickerSheet custom).
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelected(event);
      // Reset input pour permettre la re-selection du meme fichier
      event.target.value = '';
    },
    [onFileSelected]
  );

  return {
    openPicker,
    desktopInputRef: inputRef,
    handleFileSelected,
  };
};
