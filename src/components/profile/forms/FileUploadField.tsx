
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Upload, Check, AlertCircle, X, FileText } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { useDocumentUpload } from "@/hooks/use-document-upload";
import { cn } from "@/lib/utils";
import * as React from "react";

interface FileUploadFieldProps {
  form: UseFormReturn<any>;
  name?: string;
  label?: string;
  disabled?: boolean;
}

export const FileUploadField = ({ 
  form, 
  name = "document", 
  label = "Document justificatif (PDF uniquement)", 
  disabled = false 
}: FileUploadFieldProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { fileState, selectFile } = useDocumentUpload();
  const [isHandlingFile, setIsHandlingFile] = React.useState(false);

  // Capturer tous les événements pouvant fermer la modale
  // Accueillir n'importe quel type d'événement React de manière sécurisée
  const stopAllPropagation = (e: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
  };

  // Fonction de sélection du fichier
  const handleFileButtonClick = (e: React.MouseEvent) => {
    stopAllPropagation(e);
    
    if (disabled || isHandlingFile) return;
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Gestion du changement de fichier avec protection contre les erreurs
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      stopAllPropagation(e);
      
      if (disabled || isHandlingFile) return;

      const file = e.target.files?.[0];
      if (!file) return;

      setIsHandlingFile(true);
      
      // Utiliser un délai plus long pour éviter les problèmes sur mobile
      setTimeout(() => {
        try {
          selectFile(file);

          // Mise à jour uniquement du champ document avec le fichier
          form.setValue(name, file);
        } catch {
          // Erreur de sélection ignorée
        } finally {
          setIsHandlingFile(false);
        }
      }, 300);
    } catch {
      setIsHandlingFile(false);
    }
  };

  const getContainerClassName = () => {
    const base = "relative w-full min-h-[5rem] border rounded-md";
    
    switch (fileState.status) {
      case 'selected':
        return cn(base, "border-blue-500 bg-blue-50/30");
      case 'error':
        return cn(base, "border-red-500 bg-red-50/30");
      case 'uploading':
        return cn(base, "border-yellow-500 bg-yellow-50/30");
      case 'success':
        return cn(base, "border-green-500 bg-green-50/30");
      default:
        return cn(base, "border-dashed");
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    try {
      stopAllPropagation(e);
      
      if (form.getValues(name)) {
        form.setValue(name, undefined);
        form.setValue('documentUrl', undefined);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      // Erreur de réinitialisation ignorée
    }
  };

  // Envelopper tout le composant dans un try-catch pour éviter les erreurs fatales
  try {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="space-y-4" onClick={(e) => stopAllPropagation(e)}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={disabled || isHandlingFile}
                  onClick={stopAllPropagation}
                />
                
                <div className={getContainerClassName()}>
                  {fileState.status === 'idle' ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-full min-h-[5rem] border-0 flex flex-col gap-2"
                      onClick={handleFileButtonClick}
                      disabled={disabled || isHandlingFile}
                    >
                      <Upload className="h-6 w-6" />
                      <span className="text-sm text-center px-2">
                        Sélectionner un PDF
                      </span>
                    </Button>
                  ) : (
                    <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className={cn(
                          "h-10 w-10",
                          fileState.status === 'error' && "text-red-500",
                          fileState.status === 'selected' && "text-blue-500",
                          fileState.status === 'uploading' && "text-yellow-500",
                          fileState.status === 'success' && "text-green-500"
                        )} />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]">
                            {fileState.file?.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {fileState.file && 
                              `${(fileState.file.size / 1024 / 1024).toFixed(2)} MB`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-auto">
                        {!isHandlingFile && fileState.status !== 'uploading' && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleReset}
                            disabled={disabled}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {fileState.status === 'error' && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{fileState.error || "Une erreur est survenue"}</span>
                  </div>
                )}

                {fileState.status === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span>Document prêt à être envoyé</span>
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  } catch {
    return (
      <div className="p-4 border border-red-500 rounded-md bg-red-50">
        <p className="text-red-600">Une erreur est survenue lors du chargement du composant.</p>
      </div>
    );
  }
};

