import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ExperienceForm, experienceFormSchema } from "@/components/profile/forms/ExperienceForm";
import { useExperiences } from "@/hooks/use-experiences";
import { useToast } from "@/hooks/use-toast";
import { useDocumentUpload } from "@/hooks/use-document-upload";
import { X, Loader2, Check } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/utils/logger";
import * as z from "zod";

const AddExperience = () => {
  const navigate = useNavigate();
  const { addExperience } = useExperiences();
  const { toast } = useToast();
  const { uploadFile, resetFile, selectFile } = useDocumentUpload();
  const isMobile = useIsMobile();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<{
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
  }>({ status: 'idle', progress: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // FIX MOBILE: Ref synchrone pour bloquer fermeture pendant sélection fichier
  const isSelectingFileRef = useRef(false);

  const form = useForm<z.infer<typeof experienceFormSchema>>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      title: "",
      location: "",
      startDate: new Date(),
      contractType: "CDI",
      document: undefined,
      documentUrl: undefined,
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX MOBILE: Reset ref immédiatement (synchrone)
    isSelectingFileRef.current = false;

    const file = e.target.files?.[0];
    // Clear input pour permettre re-sélection du même fichier
    e.target.value = "";

    if (file) {
      logger.log("[AddExperience] Fichier sélectionné:", file.name);

      // Valider le type de fichier
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: "Type de fichier invalide",
          description: "Veuillez sélectionner un fichier PDF",
          variant: "destructive",
        });
        return;
      }

      // Valider la taille (20MB max pour expériences)
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 20 MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setUploadState({ status: 'success', progress: 100 });
      form.setValue('document', file);
      selectFile(file);
      logger.log("[AddExperience] Fichier prêt pour upload");
    }
  }, [form, selectFile, toast]);

  const triggerFileSelect = useCallback(() => {
    // FIX MOBILE: Activer la ref AVANT d'ouvrir le file picker
    logger.log("[AddExperience] Trigger file picker - setting ref=true");
    isSelectingFileRef.current = true;
    fileInputRef.current?.click();
  }, []);

  const handleResetFile = useCallback(() => {
    logger.log("[AddExperience] Reset fichier");
    setSelectedFile(null);
    setUploadState({ status: 'idle', progress: 0 });
    form.setValue('document', undefined);
    form.setValue('documentUrl', undefined);
    resetFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [form, resetFile]);

  // FIX MOBILE: Gérer l'annulation (user ferme file picker sans sélectionner)
  useEffect(() => {
    const handleWindowFocus = () => {
      // Délai pour laisser onChange se déclencher si un fichier a été sélectionné
      setTimeout(() => {
        if (isSelectingFileRef.current) {
          logger.log("[AddExperience] File picker fermé sans sélection - reset ref");
          isSelectingFileRef.current = false;
        }
      }, 300);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  const handleClose = () => {
    // FIX MOBILE: Bloquer si file picker actif
    if (isSelectingFileRef.current) {
      logger.log("[AddExperience] 🛑 Fermeture bloquée - file picker actif");
      return;
    }

    if (isSubmitting || uploadState.status === 'uploading') {
      toast({
        title: "Action impossible",
        description: "Veuillez attendre la fin du traitement en cours",
        variant: "destructive",
      });
      return;
    }
    navigate(-1);
  };

  // Handler appelé via onClick du bouton (pas via form submit pour éviter le bug mobile)
  const handleButtonClick = async () => {
    logger.log("[AddExperience] 🔵 Bouton cliqué");

    // Éviter les double-clics
    if (isSubmitting) {
      logger.log("[AddExperience] ⚠️ Déjà en cours, ignoré");
      return;
    }

    // Valider le formulaire manuellement
    const isValid = await form.trigger();
    if (!isValid) {
      logger.log("[AddExperience] ❌ Validation échouée");
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    // Récupérer les valeurs validées et soumettre
    const values = form.getValues();
    await processSubmission(values);
  };

  const processSubmission = async (values: z.infer<typeof experienceFormSchema>) => {
    try {
      logger.log("[AddExperience] Début de la soumission", {
        values,
        hasSelectedFile: !!selectedFile
      });

      setIsSubmitting(true);
      const submissionValues = { ...values };

      // Upload du fichier si présent
      if (selectedFile) {
        logger.log("[AddExperience] Upload du fichier...");
        setUploadState({ status: 'uploading', progress: 0 });

        const uploadUrl = await uploadFile();
        logger.log("[AddExperience] Résultat upload:", uploadUrl);

        if (!uploadUrl) {
          setUploadState({ status: 'error', progress: 0, error: "Échec de l'upload" });
          throw new Error("Échec de l'upload du document");
        }

        setUploadState({ status: 'success', progress: 100 });
        submissionValues.documentUrl = uploadUrl;
      }

      // Soumettre les données
      const success = await addExperience(submissionValues);

      if (success) {
        setIsComplete(true);
        // Navigation immédiate avec replace pour éviter les problèmes d'historique
        logger.log("[AddExperience] ✅ Succès - navigation vers /profile");
        navigate("/profile", { replace: true });
        return; // Sortir sans reset isSubmitting
      }

      // Si échec, permettre de réessayer
      setIsSubmitting(false);

    } catch (error) {
      logger.error("[AddExperience] Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'expérience",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay sombre - PAS de onClick pour éviter fermeture accidentelle sur mobile */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* INPUT FILE DANS LA PAGE (pas dans un modal) - C'est la clé du fix mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept={isMobile ? "*/*" : ".pdf,application/pdf"}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Panneau style Sheet */}
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header avec bouton fermer */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ajouter une expérience
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Ajoutez une nouvelle expérience professionnelle à votre profil
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full hover:bg-gray-100"
              disabled={isSubmitting || uploadState.status === 'uploading'}
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Contenu scrollable - avec padding bottom pour BottomTabBar mobile */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-4 pb-24 md:pb-4">
          <Form {...form}>
            <div className="space-y-6">
              <ExperienceForm
                form={form}
                externalTrigger={triggerFileSelect}
                externalFile={selectedFile}
                externalUploadState={uploadState}
                onExternalReset={handleResetFile}
              />

              <Button
                type="button"
                onClick={handleButtonClick}
                className="w-full h-12 text-base font-medium"
                disabled={isSubmitting || uploadState.status === 'uploading' || isComplete}
              >
                {isComplete ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Expérience ajoutée
                  </>
                ) : isSubmitting || uploadState.status === 'uploading' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadState.status === 'uploading' ? "Upload en cours..." : "Ajout en cours..."}
                  </>
                ) : (
                  "Ajouter l'expérience"
                )}
              </Button>
            </div>
          </Form>
        </div>

        {/* Safe area pour iPhone - plus de marge pour le BottomTabBar */}
        <div className="h-20 md:h-0 bg-white" />
      </div>
    </div>
  );
};

export default AddExperience;
