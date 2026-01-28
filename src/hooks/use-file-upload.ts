
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type FileUploadStatus = 'idle' | 'preparing' | 'uploading' | 'success' | 'error';

interface FileUploadState {
  status: FileUploadStatus;
  progress: number;
  error?: string;
  fileUrl?: string;
}

export const useFileUpload = (options: {
  maxSize?: number;
  acceptedTypes?: string[];
  onSuccess?: (file: File, fileUrl: string) => void;
  onError?: (error: string) => void;
}) => {
  const [state, setState] = useState<FileUploadState>({
    status: 'idle',
    progress: 0
  });
  const { toast } = useToast();

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'Aucun fichier sélectionné' };
    }

    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB par défaut
    if (file.size > maxSize) {
      return { 
        isValid: false, 
        error: `Le fichier ne doit pas dépasser ${Math.floor(maxSize / 1024 / 1024)}MB` 
      };
    }

    if (options.acceptedTypes && !options.acceptedTypes.includes(file.type)) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      // Autoriser les fichiers .pdf même si le type MIME n'est pas correct (problème courant sur mobile)
      if (fileExt === 'pdf' && options.acceptedTypes.includes('application/pdf')) {
        logger.log("[useFileUpload] Fichier PDF détecté via extension");
        return { isValid: true };
      }
      
      return { 
        isValid: false, 
        error: 'Type de fichier non supporté'
      };
    }

    return { isValid: true };
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      logger.log("[useFileUpload] Début de l'upload vers Supabase Storage");
      const fileName = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          contentType: file.type || 'application/pdf',
          upsert: false
        });

      if (error) {
        logger.error("[useFileUpload] Erreur lors de l'upload:", error);
        throw error;
      }
      
      logger.log("[useFileUpload] Fichier uploadé avec succès:", data);
      
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
        
      logger.log("[useFileUpload] URL publique générée:", publicUrl);
      return publicUrl;
    } catch (error: unknown) {
      logger.error("[useFileUpload] Erreur inattendue lors de l'upload:", error);
      throw new Error("Erreur lors de l'upload du fichier");
    }
  };

  const handleFile = async (file: File) => {
    try {
      setState({ status: 'preparing', progress: 0 });
      logger.log("[useFileUpload] Traitement du fichier:", file.name);

      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      setState({ status: 'uploading', progress: 10 });
      
      // Upload du fichier vers Supabase Storage
      const fileUrl = await uploadFile(file);
      setState({ status: 'uploading', progress: 90, fileUrl });
      
      if (options.onSuccess) {
        options.onSuccess(file, fileUrl);
      }

      setState({ status: 'success', progress: 100, fileUrl });
      logger.log("[useFileUpload] Traitement et upload terminés avec succès");

    } catch (error) {
      logger.error('[useFileUpload] Erreur lors du traitement du fichier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      setState({ status: 'error', progress: 0, error: errorMessage });
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });

      if (options.onError) {
        options.onError(errorMessage);
      }
    }
  };

  const reset = () => {
    setState({ status: 'idle', progress: 0 });
  };

  return {
    state,
    handleFile,
    reset
  };
};
