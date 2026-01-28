
import { useState, useRef, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { FormationForm, formationFormSchema } from "./forms/FormationForm";
import { useToast } from "@/hooks/use-toast";
import { useDocumentUpload } from "@/hooks/use-document-upload";
import { useIsMobile } from "@/hooks/use-mobile";
import * as z from "zod";
import { logger } from "@/utils/logger";

interface AddFormationSheetProps {
  onSubmit: (values: z.infer<typeof formationFormSchema>) => Promise<void>;
}

export const AddFormationSheet = ({ onSubmit }: AddFormationSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // FIX V3: Flag pour bloquer la fermeture pendant la sélection de fichier
  // State + Ref: la ref est synchrone (immédiate), le state pour re-render
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const isSelectingFileRef = useRef(false);

  // État pour le fichier externe (hors du Sheet pour éviter le bug mobile)
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [externalUploadState, setExternalUploadState] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
  }>({ status: 'idle', progress: 0 });

  // Ref pour l'input file externe (HORS du Sheet - c'est la clé du fix)
  const externalFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { uploadFile, resetFile, setFile } = useDocumentUpload();
  const isMobile = useIsMobile();

  const form = useForm<z.infer<typeof formationFormSchema>>({
    resolver: zodResolver(formationFormSchema),
    defaultValues: {
      certificationType: "",
      organization: "",
      customOrganization: "",
      startDate: new Date(),
      document: undefined,
      documentUrl: undefined,
    },
  });

  // Handler pour le fichier sélectionné depuis l'input externe
  const handleExternalFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    logger.log("[AddFormationSheet] File change - resetting ref (synchrone)");

    // FIX V3: Reset ref AVANT state
    isSelectingFileRef.current = false;
    setIsSelectingFile(false);

    // FIX V3: Clear input pour permettre re-sélection du même fichier
    e.target.value = "";

    if (file) {
      logger.log("[AddFormationSheet] Fichier externe sélectionné:", file?.name);
      // Valider le type de fichier
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: "Type de fichier invalide",
          description: "Veuillez sélectionner un fichier PDF",
          variant: "destructive",
        });
        return;
      }

      // Valider la taille (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 5 MB",
          variant: "destructive",
        });
        return;
      }

      setExternalFile(file);
      setExternalUploadState({ status: 'success', progress: 100 });
      form.setValue('document', file);
      setFile(file);
      logger.log("[AddFormationSheet] ✅ Fichier externe prêt pour upload");
    }
  }, [form, setFile, toast]);

  // Trigger pour ouvrir le file picker externe
  const triggerExternalFileSelect = useCallback(() => {
    logger.log("[AddFormationSheet] Trigger file picker - setting ref=true (synchrone)");
    // FIX V3: Ref AVANT state - la ref est synchrone, immédiatement disponible
    isSelectingFileRef.current = true;
    setIsSelectingFile(true);
    externalFileInputRef.current?.click();
  }, []);

  // Reset du fichier externe
  const handleExternalReset = useCallback(() => {
    logger.log("[AddFormationSheet] Reset fichier externe");
    setExternalFile(null);
    setExternalUploadState({ status: 'idle', progress: 0 });
    form.setValue('document', undefined);
    form.setValue('documentUrl', undefined);
    resetFile();
    if (externalFileInputRef.current) {
      externalFileInputRef.current.value = '';
    }
  }, [form, resetFile]);

  // FIX V3: Effet pour gérer l'annulation (user ferme file picker sans choisir)
  useEffect(() => {
    if (!isSelectingFile) return;

    const handleWindowFocus = () => {
      // Délai pour laisser onChange se déclencher d'abord si un fichier a été sélectionné
      setTimeout(() => {
        // FIX V3: Vérifier la REF (synchrone) pas le state
        if (isSelectingFileRef.current && !externalFile) {
          logger.log("[AddFormationSheet] File picker closed without selection - resetting ref");
          isSelectingFileRef.current = false;
          setIsSelectingFile(false);
        }
      }, 300);  // FIX V3: Réduit à 300ms
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isSelectingFile, externalFile]);

  // Gestion de la soumission du formulaire
  const handleSubmit = async (values: z.infer<typeof formationFormSchema>) => {
    if (isSubmitting) {
      logger.log("[AddFormationSheet] Soumission déjà en cours, ignorée");
      return;
    }

    try {
      logger.log("[AddFormationSheet] Début de la soumission du formulaire", {
        values,
        hasExternalFile: !!externalFile
      });

      setIsSubmitting(true);
      const submissionValues = { ...values };

      // Si un fichier externe est sélectionné, l'uploader
      if (externalFile) {
        logger.log("[AddFormationSheet] Upload du fichier externe...");
        setExternalUploadState({ status: 'uploading', progress: 0 });

        toast({
          title: "Upload en cours",
          description: "Veuillez patienter pendant l'upload du document...",
          variant: "default",
        });

        const uploadUrl = await uploadFile();
        logger.log("[AddFormationSheet] Résultat de l'upload:", uploadUrl);

        if (!uploadUrl) {
          setExternalUploadState({ status: 'error', progress: 0, error: "Échec de l'upload" });
          throw new Error("Échec de l'upload du document");
        }

        setExternalUploadState({ status: 'success', progress: 100 });
        submissionValues.documentUrl = uploadUrl;
      }

      // Résoudre l'organisation si "Autre" est sélectionné
      if (submissionValues.organization === "__autre__" && submissionValues.customOrganization) {
        submissionValues.organization = submissionValues.customOrganization;
      }

      // Soumettre les données à l'API
      await onSubmit(submissionValues);

      // Réinitialisation du formulaire et fermeture de la feuille
      form.reset();
      handleExternalReset();
      setIsComplete(true);

      toast({
        title: "Succès",
        description: "Formation ajoutée avec succès",
      });

      // Fermer la feuille après un court délai
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitting(false);
        setIsComplete(false);
      }, 1500);

    } catch (error) {
      logger.error("[AddFormationSheet] Erreur lors de l'ajout de la formation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la formation",
        variant: "destructive",
      });
      setIsSubmitting(false);
      setIsComplete(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    // FIX V3: Bloquer avec la REF (synchrone) - pas le state qui peut être en retard
    if (!open && isSelectingFileRef.current) {
      logger.log("[AddFormationSheet] 🛑 Fermeture BLOQUÉE (ref) - file picker actif");
      return;  // NE PAS FERMER
    }

    // Bloquer pendant la soumission ou l'upload
    if (!open && (isSubmitting || externalUploadState.status === 'uploading')) {
      logger.log("[AddFormationSheet] Fermeture bloquée pendant traitement");
      toast({
        title: "Action impossible",
        description: "Veuillez attendre la fin du traitement en cours",
        variant: "destructive",
      });
      return;
    }

    logger.log("[AddFormationSheet] Changement d'état de la sheet:", { precedent: isOpen, nouveau: open });
    setIsOpen(open);

    // Si on ferme la feuille, réinitialiser le formulaire et le fichier
    if (!open) {
      form.reset();
      handleExternalReset();
      setIsSubmitting(false);
      setIsComplete(false);
      // FIX V3: Reset ref ET state
      isSelectingFileRef.current = false;
      setIsSelectingFile(false);
    }
  };

  return (
    <>
      {/* INPUT FILE EXTERNE - HORS DU SHEET (corrige le bug mobile) */}
      <input
        ref={externalFileInputRef}
        type="file"
        accept={isMobile ? "*/*" : ".pdf,application/pdf"}
        onChange={handleExternalFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          className="overflow-y-auto"
          closeButtonColor="black"
          // FIX V3: Handlers Radix pour bloquer fermeture pendant file picker
          onInteractOutside={(e) => {
            if (isSelectingFileRef.current) {
              logger.log("[AddFormationSheet] onInteractOutside bloqué (ref=true)");
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            if (isSelectingFileRef.current) {
              logger.log("[AddFormationSheet] onPointerDownOutside bloqué (ref=true)");
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isSelectingFileRef.current) {
              logger.log("[AddFormationSheet] onEscapeKeyDown bloqué (ref=true)");
              e.preventDefault();
            }
          }}
        >
          <SheetHeader>
            <SheetTitle>Ajouter une formation</SheetTitle>
            <SheetDescription>
              Ajoutez une nouvelle formation à votre profil
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mt-4">
              <FormationForm
                form={form}
                externalTrigger={triggerExternalFileSelect}
                externalFile={externalFile}
                externalUploadState={externalUploadState}
                onExternalReset={handleExternalReset}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || externalUploadState.status === 'uploading' || isComplete}
              >
                {isComplete ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Formation ajoutée
                  </>
                ) : isSubmitting || externalUploadState.status === 'uploading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {externalUploadState.status === 'uploading' ?
                      "Upload en cours..." :
                      "Ajout en cours..."
                    }
                  </>
                ) : (
                  "Ajouter la formation"
                )}
              </Button>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </>
  );
};
