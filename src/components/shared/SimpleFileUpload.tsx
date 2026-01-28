
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Upload, AlertCircle, X, FileText, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/utils/logger";

interface SimpleFileUploadProps {
  form: UseFormReturn<any>;
  name?: string;
  label?: string;
  disabled?: boolean;
  acceptedTypes?: string[];
  maxSize?: number;
  onFileSelectStart?: () => void;
  onFileSelectEnd?: () => void;
  onFileSelected?: () => void;
  onUploadComplete?: () => void;
  // Mode externe: l'input file est géré par le parent (hors du Sheet)
  externalTrigger?: () => void;
  externalFile?: File | null;
  externalUploadState?: {
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
  };
  onExternalReset?: () => void;
}

export const SimpleFileUpload = ({
  form,
  name = "document",
  label = "Document (PDF uniquement)",
  disabled = false,
  acceptedTypes = ['application/pdf'],
  maxSize = 5 * 1024 * 1024,
  onFileSelectStart,
  onFileSelectEnd,
  onFileSelected,
  onUploadComplete,
  // Props pour le mode externe (input file hors du Sheet)
  externalTrigger,
  externalFile,
  externalUploadState,
  onExternalReset
}: SimpleFileUploadProps) => {
  // Mode externe activé si externalTrigger est fourni
  const isExternalMode = !!externalTrigger;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isUploading, setIsUploading] = React.useState(false);
  
  const { state, handleFile, reset } = useFileUpload({
    acceptedTypes,
    maxSize,
    onSuccess: (file, fileUrl) => {
      // Mettre à jour à la fois le fichier et l'URL
      form.setValue(name, file);
      form.setValue(`${name}Url`, fileUrl);
      setIsUploading(false);
      // NOUVEAU: Signaler que l'upload est terminé
      logger.log("[SimpleFileUpload] ✅ Upload terminé avec succès");
      onUploadComplete?.();
    },
    onError: () => {
      setIsUploading(false);
      // Aussi signaler la fin en cas d'erreur pour permettre la fermeture
      logger.log("[SimpleFileUpload] ❌ Erreur upload - signaling end");
      onUploadComplete?.();
    }
  });

  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    logger.log("[SimpleFileUpload] handleFileSelect - file input changed");
    // NE PAS appeler onFileSelectEnd ici!
    // Le flag doit rester true pour empêcher la Sheet de se fermer
    // Il sera reset quand la Sheet se fermera normalement (après soumission)

    const file = e.target.files?.[0];
    if (file) {
      logger.log("[SimpleFileUpload] 📁 File received:", file.name);
      // NOUVEAU: Signaler qu'un fichier a été sélectionné AVANT de commencer l'upload
      onFileSelected?.();
      setIsUploading(true);
      handleFile(file);
    } else {
      // Pas de fichier = annulation, on peut signaler la fin
      logger.log("[SimpleFileUpload] No file selected, signaling end");
      onFileSelectEnd?.();
    }
  }, [handleFile, onFileSelectEnd, onFileSelected]);

  const triggerFileSelect = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Ne pas empêcher l'événement par défaut sur mobile pour permettre l'ouverture du sélecteur
    if (!isMobile) {
      e.preventDefault();
    }
    e.stopPropagation();

    if (disabled || isUploading || state.status === 'uploading') {
      return;
    }

    // Signaler le début de la sélection (file picker va s'ouvrir)
    onFileSelectStart?.();

    if (fileInputRef.current) {
      // Sur mobile, utiliser une approche différente pour déclencher l'input
      if (isMobile) {
        // Créer un événement click natif pour mobile
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        fileInputRef.current.dispatchEvent(clickEvent);
      } else {
        fileInputRef.current.click();
      }
    }
  }, [disabled, isUploading, state.status, isMobile, onFileSelectStart]);

  const handleReset = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    form.setValue(name, undefined);
    form.setValue(`${name}Url`, undefined);
    reset();
    setIsUploading(false);
  }, [form, name, reset]);

  const getContainerClassName = () => {
    const base = "relative w-full min-h-[5rem] border rounded-md transition-colors duration-200";

    if (effectiveIsUploading) {
      return cn(base, "border-yellow-500 bg-yellow-50/30");
    }

    switch (effectiveStatus) {
      case 'success':
        return cn(base, "border-green-500 bg-green-50/30");
      case 'error':
        return cn(base, "border-red-500 bg-red-50/30");
      default:
        return cn(base, "border-dashed");
    }
  };

  // Vérifier si le fichier a déjà été uploadé avec succès
  const isFileReady = state.status === 'success' && state.fileUrl;

  // En mode externe, utiliser les props externes pour l'état
  const effectiveStatus = isExternalMode ? (externalUploadState?.status || 'idle') : state.status;
  const effectiveProgress = isExternalMode ? (externalUploadState?.progress || 0) : state.progress;
  const effectiveError = isExternalMode ? externalUploadState?.error : state.error;
  const effectiveFile = isExternalMode ? externalFile : form.getValues(name);
  const effectiveIsUploading = isExternalMode
    ? effectiveStatus === 'uploading'
    : (isUploading || state.status === 'uploading' || state.status === 'preparing');
  const effectiveIsFileReady = isExternalMode
    ? effectiveStatus === 'success' && !!externalFile
    : isFileReady;

  // Gérer l'annulation de sélection (user ferme file picker sans sélectionner de fichier)
  // Sur mobile, quand le file picker se ferme, le focus revient à la fenêtre
  React.useEffect(() => {
    if (!onFileSelectEnd) return;

    const handleWindowFocus = () => {
      // Délai pour laisser onChange se déclencher si un fichier a été sélectionné
      setTimeout(() => {
        if (fileInputRef.current && !fileInputRef.current.files?.length) {
          // Pas de fichier sélectionné = annulation
          onFileSelectEnd();
        }
      }, 300);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [onFileSelectEnd]);

  // Handler pour le reset - utilise onExternalReset en mode externe
  const handleEffectiveReset = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isExternalMode) {
      onExternalReset?.();
    } else {
      handleReset(e);
    }
  }, [isExternalMode, onExternalReset, handleReset]);

  // Handler pour le clic sur la zone - utilise externalTrigger en mode externe
  const handleZoneClick = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isExternalMode) {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !effectiveIsUploading) {
        logger.log("[SimpleFileUpload] Mode externe - trigger file select");
        externalTrigger?.();
      }
    } else if (!isMobile && state.status === 'idle') {
      triggerFileSelect(e as React.MouseEvent);
    }
  }, [isExternalMode, externalTrigger, disabled, effectiveIsUploading, isMobile, state.status, triggerFileSelect]);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <div
                className={cn(getContainerClassName(), "relative")}
                onClick={handleZoneClick}
                role="button"
                tabIndex={0}
                aria-label="Zone de sélection de fichier"
              >
                {/* Input file en overlay sur mobile - SEULEMENT si pas en mode externe */}
                {!isExternalMode && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={isMobile ? "*/*" : ".pdf,application/pdf"}
                    onChange={handleFileSelect}
                    onTouchStart={() => {
                      if (isMobile) {
                        logger.log("[SimpleFileUpload] onTouchStart - signaling file select start");
                        onFileSelectStart?.();
                      }
                    }}
                    onClick={() => {
                      if (isMobile) {
                        logger.log("[SimpleFileUpload] onClick - signaling file select start (fallback)");
                        onFileSelectStart?.();
                      }
                    }}
                    className={cn(
                      isMobile && state.status === 'idle'
                        ? "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        : "hidden"
                    )}
                    disabled={disabled || isUploading || state.status === 'uploading'}
                    aria-label="Sélectionner un fichier PDF"
                  />
                )}

                {effectiveStatus === 'idle' && !effectiveFile ? (
                  <div className="w-full h-full min-h-[5rem] flex flex-col items-center justify-center gap-2 cursor-pointer relative">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm text-center px-2">
                      {isMobile ? "Touchez pour sélectionner un PDF" : "Cliquez pour sélectionner un PDF"}
                    </span>
                  </div>
                ) : (
                  <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {effectiveIsUploading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-10 w-10 text-yellow-500 animate-spin" />
                          <div className="text-sm">
                            Upload en cours ({effectiveProgress}%)...
                          </div>
                        </div>
                      ) : (
                        <>
                          <FileText className={cn(
                            "h-10 w-10",
                            effectiveStatus === 'error' && "text-red-500",
                            effectiveStatus === 'success' && "text-green-500"
                          )} />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {effectiveFile?.name || field.value?.name || "Fichier sélectionné"}
                            </span>
                            {(effectiveFile || field.value) && (
                              <span className="text-xs text-muted-foreground">
                                {((effectiveFile?.size || field.value?.size || 0) / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                            {effectiveIsFileReady && (
                              <span className="text-xs text-green-600">
                                Document prêt à l'emploi
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {!effectiveIsUploading && (
                      <button
                        type="button"
                        onClick={handleEffectiveReset}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border hover:bg-gray-50"
                        disabled={disabled}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Annuler
                      </button>
                    )}
                  </div>
                )}
              </div>

              {effectiveError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{effectiveError}</span>
                </div>
              )}

              {!isExternalMode && isFileReady && state.fileUrl && (
                <input
                  type="hidden"
                  name={`${name}Url`}
                  value={state.fileUrl}
                />
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
