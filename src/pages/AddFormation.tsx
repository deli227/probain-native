import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormationForm, formationFormSchema } from "@/components/profile/forms/FormationForm";
import { useFormations } from "@/hooks/use-formations";
import { useToast } from "@/hooks/use-toast";
import { useDocumentUpload } from "@/hooks/use-document-upload";
import { X, Loader2, Check } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { logger } from "@/utils/logger";
import * as z from "zod";

const AddFormation = () => {
  const navigate = useNavigate();
  const { addFormation } = useFormations();
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

  const form = useForm<z.infer<typeof formationFormSchema>>({
    resolver: zodResolver(formationFormSchema),
    defaultValues: {
      certificationType: "",
      organization: "",
      customOrganization: "",
      startDate: new Date(),
      document: undefined,
      documentUrl: undefined,
      recyclingOrganization: "",
      customRecyclingOrganization: "",
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // FIX MOBILE: Reset ref immédiatement (synchrone)
    isSelectingFileRef.current = false;

    const file = e.target.files?.[0];
    // Clear input pour permettre re-sélection du même fichier
    e.target.value = "";

    if (file) {
      logger.log("[AddFormation] Fichier sélectionné:", file.name);

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

      setSelectedFile(file);
      setUploadState({ status: 'success', progress: 100 });
      form.setValue('document', file);
      selectFile(file);
      logger.log("[AddFormation] Fichier prêt pour upload");
    }
  }, [form, selectFile, toast]);

  const triggerFileSelect = useCallback(() => {
    // FIX MOBILE: Activer la ref AVANT d'ouvrir le file picker
    logger.log("[AddFormation] Trigger file picker - setting ref=true");
    isSelectingFileRef.current = true;
    fileInputRef.current?.click();
  }, []);

  const handleResetFile = useCallback(() => {
    logger.log("[AddFormation] Reset fichier");
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
          logger.log("[AddFormation] File picker fermé sans sélection - reset ref");
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
      logger.log("[AddFormation] 🛑 Fermeture bloquée - file picker actif");
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
    logger.log("[AddFormation] 🔵 Bouton cliqué");

    // Éviter les double-clics
    if (isSubmitting) {
      logger.log("[AddFormation] ⚠️ Déjà en cours, ignoré");
      return;
    }

    // Valider le formulaire manuellement
    const isValid = await form.trigger();
    if (!isValid) {
      logger.log("[AddFormation] ❌ Validation échouée");
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

  const processSubmission = async (values: z.infer<typeof formationFormSchema>) => {
    try {
      logger.log("[AddFormation] Début de la soumission", {
        values,
        hasSelectedFile: !!selectedFile
      });

      setIsSubmitting(true);
      const submissionValues = { ...values };

      // Upload du fichier si présent
      if (selectedFile) {
        logger.log("[AddFormation] Upload du fichier...");
        setUploadState({ status: 'uploading', progress: 0 });

        const uploadUrl = await uploadFile();
        logger.log("[AddFormation] Résultat upload:", uploadUrl);

        if (!uploadUrl) {
          setUploadState({ status: 'error', progress: 0, error: "Échec de l'upload" });
          throw new Error("Échec de l'upload du document");
        }

        setUploadState({ status: 'success', progress: 100 });
        submissionValues.documentUrl = uploadUrl;
      }

      // Résoudre l'organisation si "Autre" est sélectionné
      if (submissionValues.organization === "__autre__" && submissionValues.customOrganization) {
        submissionValues.organization = submissionValues.customOrganization;
      }

      // Résoudre l'organisation de recyclage si "Autre" est sélectionné
      if (submissionValues.recyclingOrganization === "__autre__" && submissionValues.customRecyclingOrganization) {
        submissionValues.recyclingOrganization = submissionValues.customRecyclingOrganization;
      }

      // Soumettre les données
      const success = await addFormation(submissionValues);

      if (success) {
        setIsComplete(true);
        // Navigation immédiate avec replace pour éviter les problèmes d'historique
        logger.log("[AddFormation] ✅ Succès - navigation vers /profile");
        navigate("/profile", { replace: true });
        return; // Sortir sans reset isSubmitting
      }

      // Si échec, permettre de réessayer
      setIsSubmitting(false);

    } catch (error) {
      logger.error("[AddFormation] Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la formation",
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

      {/* Panneau style Sheet - Dark Theme avec orbes */}
      <div className="relative z-10 w-full sm:max-w-lg bg-[#0a1628] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Orbes lumineux animés */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute top-1/3 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header avec bouton fermer - gradient */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary-light px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Ajouter une formation
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                Ajoutez une nouvelle formation à votre profil
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-full hover:bg-white/10 text-white"
              disabled={isSubmitting || uploadState.status === 'uploading'}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Contenu scrollable - avec padding bottom pour BottomTabBar mobile */}
        <div className="relative overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-6 pb-24 md:pb-6">
          <Form {...form}>
            <div className="space-y-6">
              {/* Card glassmorphism pour le formulaire */}
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10">
                <FormationForm
                  form={form}
                  darkMode={true}
                  externalTrigger={triggerFileSelect}
                  externalFile={selectedFile}
                  externalUploadState={uploadState}
                  onExternalReset={handleResetFile}
                />
              </div>

              <Button
                type="button"
                onClick={handleButtonClick}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                disabled={isSubmitting || uploadState.status === 'uploading' || isComplete}
              >
                {isComplete ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Formation ajoutée
                  </>
                ) : isSubmitting || uploadState.status === 'uploading' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {uploadState.status === 'uploading' ? "Upload en cours..." : "Ajout en cours..."}
                  </>
                ) : (
                  "Ajouter la formation"
                )}
              </Button>
            </div>
          </Form>
        </div>

        {/* Safe area pour iPhone - plus de marge pour le BottomTabBar */}
        <div className="h-20 md:h-0 bg-[#0a1628]" />
      </div>
    </div>
  );
};

export default AddFormation;
