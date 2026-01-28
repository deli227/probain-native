
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export type FileValidationResult = {
  isValid: boolean;
  error?: string;
};

export type FileUploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

export const useDocumentUpload = () => {
  const [fileState, setFileState] = useState<{
    status: FileUploadState;
    file: File | null;
    error?: string;
    uploadUrl?: string;
  }>({
    status: 'idle',
    file: null
  });
  
  const { toast } = useToast();

  const validateFile = (file: File | null): FileValidationResult => {
    if (!file) {
      return { isValid: false, error: "Aucun fichier fourni" };
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      return { isValid: false, error: "Le fichier ne doit pas dépasser 20MB" };
    }

    const isPDF = file.type === 'application/pdf' || 
                  file.name.toLowerCase().endsWith('.pdf');

    if (!isPDF) {
      return { isValid: false, error: "Le fichier doit être un PDF" };
    }

    return { isValid: true };
  };

  const selectFile = (file: File | null) => {
    logger.log("[useDocumentUpload] Sélection de fichier:", file?.name);
    
    if (!file) {
      setFileState({
        status: 'idle',
        file: null
      });
      return;
    }

    const validation = validateFile(file);
    if (!validation.isValid) {
      setFileState({
        status: 'error',
        file: null,
        error: validation.error,
      });
      
      toast({
        title: "Fichier non valide",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setFileState({
      status: 'selected',
      file: file
    });
  };

  const uploadFile = async (): Promise<string | null> => {
    logger.log("[useDocumentUpload] uploadFile appelé, fileState:", {
      status: fileState.status,
      hasFile: !!fileState.file,
      fileName: fileState.file?.name,
      fileSize: fileState.file?.size
    });

    if (!fileState.file) {
      logger.error("[useDocumentUpload] Pas de fichier à uploader");
      return null;
    }

    try {
      setFileState(prev => ({
        ...prev,
        status: 'uploading'
      }));

      // Générer un nom de fichier unique (compatible tous navigateurs)
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.pdf`;
      logger.log("[useDocumentUpload] Upload vers:", fileName);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, fileState.file, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        logger.error("[useDocumentUpload] Supabase upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      setFileState(prev => ({
        ...prev,
        status: 'success',
        uploadUrl: publicUrl
      }));

      return publicUrl;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown';
      logger.error("[useDocumentUpload] Erreur upload:", {
        name: errorName,
        message: errorMessage,
        error: error
      });
      setFileState(prev => ({
        ...prev,
        status: 'error',
        error: `Erreur: ${errorMessage}`
      }));

      toast({
        title: "Erreur d'upload",
        description: errorMessage || "Une erreur est survenue lors de l'upload",
        variant: "destructive",
      });

      return null;
    }
  };

  const hasSelectedFile = (): boolean => {
    return fileState.status === 'selected' && fileState.file !== null;
  };

  const getSelectedFile = (): File | null => {
    return fileState.file;
  };
  
  const resetFile = () => {
    setFileState({
      status: 'idle',
      file: null
    });
  };

  return {
    fileState,
    selectFile,
    resetFile,
    uploadFile,
    hasSelectedFile,
    getSelectedFile
  };
};
