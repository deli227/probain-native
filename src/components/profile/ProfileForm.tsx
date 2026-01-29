
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { AddressForm } from "./forms/AddressForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useNavigate } from "react-router-dom";
import { Loader2, Save, Bell, Mail, GraduationCap, Briefcase, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const formSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  biography: z.string(),
  birthDate: z.preprocess(
    (arg) => {
      // Si c'est déjà une Date, la retourner directement
      if (arg instanceof Date) return arg;
      // Si c'est une chaîne de caractères ou un nombre valide, créer une nouvelle Date
      if (typeof arg === 'string' || typeof arg === 'number') {
        const date = new Date(arg);
        return isNaN(date.getTime()) ? undefined : date;
      }
      // Sinon, retourner undefined
      return undefined;
    },
    z.date().optional()
  ),
  address: z.object({
    street: z.string().min(1, "La rue est requise"),
    cityZip: z.string().min(1, "La ville et le code postal sont requis"),
    canton: z.string().min(1, "Le canton est requis"),
  }),
  phone: z.string().optional(),
  phoneVisible: z.boolean().optional(),
});

interface ProfileFormProps {
  defaultValues: z.infer<typeof formSchema>;
  onProfileUpdated?: () => void;
  onSaveComplete?: () => void;
}

export const ProfileForm = ({ defaultValues, onProfileUpdated, onSaveComplete }: ProfileFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const { preferences, loading: prefsLoading, updatePreference } = useNotificationPreferences(userId);

  // Récupérer l'ID utilisateur au montage
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  // Prétraiter les valeurs par défaut pour s'assurer que birthDate est une instance de Date
  const processedDefaultValues = {
    ...defaultValues,
    birthDate: defaultValues.birthDate ? new Date(defaultValues.birthDate) : undefined,
    phone: defaultValues.phone || '',
    phoneVisible: defaultValues.phoneVisible || false,
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: processedDefaultValues,
  });

  // Suppression du compte
  const handleDeleteAccount = async () => {
    if (!userId) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Session expired');
      }

      const response = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || 'Failed to delete account');
      }

      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: 'Compte supprimé',
        description: 'Votre compte a été supprimé avec succès.',
      });

      navigate('/');
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le compte. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      logger.log("[ProfileForm] Début de la mise à jour du profil avec les valeurs:", values);
      
      const { data: { user }, error: userError } = await safeGetUser(supabase, 5000);
      if (userError) {
        logger.error("[ProfileForm] Erreur lors de la récupération de l'utilisateur:", userError);
        throw userError;
      }
      if (!user) {
        logger.error("[ProfileForm] Aucun utilisateur trouvé");
        throw new Error("Aucun utilisateur trouvé");
      }

      logger.log("[ProfileForm] Utilisateur actuel:", user.id);

      // Mise à jour du profil de base d'abord
      logger.log("[ProfileForm] Mise à jour du profil de base...");
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          biography: values.biography,
          birth_date: values.birthDate ? values.birthDate.toISOString().split('T')[0] : null,
          street: values.address.street,
          city_zip: values.address.cityZip,
          canton: values.address.canton,
          phone: values.phone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        logger.error('[ProfileForm] Erreur lors de la mise à jour du profil:', profileError);
        throw profileError;
      }

      // Mise à jour du profil sauveteur ensuite
      logger.log("[ProfileForm] Mise à jour du profil sauveteur...");
      const { error: rescuerError } = await supabase
        .from('rescuer_profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          canton: values.address.canton,
          phone_visible: values.phoneVisible || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (rescuerError) {
        logger.error('[ProfileForm] Erreur lors de la mise à jour du profil sauveteur:', rescuerError);
        // Ne pas throw l'erreur ici car le profil de base a déjà été mis à jour
        toast({
          title: "Attention",
          description: "Certaines informations n'ont pas pu être mises à jour complètement",
          variant: "destructive",
        });
      } else {
        logger.log("[ProfileForm] Profil mis à jour avec succès");
        toast({
          title: "Succès",
          description: "Votre profil a été mis à jour avec succès",
        });
      }

      // Appeler le callback pour rafraîchir les données si fourni
      if (onProfileUpdated) {
        onProfileUpdated();
      }

      // Fermer le formulaire après sauvegarde réussie
      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      logger.error('[ProfileForm] Erreur lors de la soumission du formulaire:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-full bg-[#0a1628] -m-6 p-6">
      {/* Fond avec dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628]" />

      {/* Orbes lumineuses animées */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grande orbe bleue */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.2) 40%, transparent 70%)',
            animation: 'pulse-glow 4s ease-in-out infinite',
          }}
        />

        {/* Orbe cyan en haut */}
        <div
          className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 70%)',
            animation: 'float-slow 8s ease-in-out infinite',
          }}
        />

        {/* Orbe violette en bas */}
        <div
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 70%)',
            animation: 'float-slow 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="relative z-10 space-y-6 pb-44 md:pb-24">
          {/* Section Profil */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl">
            <PersonalInfoForm form={form} darkMode />
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl">
            <AddressForm form={form} darkMode />
          </div>

          {/* Section Notifications */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-yellow-500/20">
                <Bell className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Choisissez les notifications que vous souhaitez recevoir
            </p>

            {prefsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Messages */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium text-sm">Messages</p>
                      <p className="text-white/50 text-xs">Nouveaux messages reçus</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notify_messages ?? true}
                    onCheckedChange={(checked) => updatePreference('notify_messages', checked)}
                  />
                </div>

                {/* Formations */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium text-sm">Formations</p>
                      <p className="text-white/50 text-xs">Nouvelles formations disponibles</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notify_formations ?? true}
                    onCheckedChange={(checked) => updatePreference('notify_formations', checked)}
                  />
                </div>

                {/* Offres d'emploi */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-white font-medium text-sm">Offres d'emploi</p>
                      <p className="text-white/50 text-xs">Nouvelles offres d'emploi</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notify_job_offers ?? true}
                    onCheckedChange={(checked) => updatePreference('notify_job_offers', checked)}
                  />
                </div>

                {/* Recyclage */}
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-white font-medium text-sm">Recyclage</p>
                      <p className="text-white/50 text-xs">Rappels de renouvellement des brevets</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notify_recycling ?? true}
                    onCheckedChange={(checked) => updatePreference('notify_recycling', checked)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Compte - Suppression */}
          <div className="backdrop-blur-xl bg-red-500/10 rounded-2xl p-5 border border-red-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Zone dangereuse</h3>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full bg-red-600/80 hover:bg-red-600 border border-red-500/30 text-white"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression en cours...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer mon compte
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0d2847] border border-white/10">
                <AlertDialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-full bg-red-500/20">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <AlertDialogTitle className="text-white text-xl">
                      Supprimer votre compte ?
                    </AlertDialogTitle>
                  </div>
                  <AlertDialogDescription className="text-white/70">
                    Cette action est <span className="text-red-400 font-semibold">irréversible</span>.
                    Toutes vos données seront définitivement supprimées, incluant votre profil,
                    vos formations, vos expériences et vos préférences.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <p className="text-red-400/60 text-xs mt-3 text-center">
              La suppression de votre compte est définitive et irréversible.
            </p>
          </div>

          {/* Bouton de sauvegarde style natif - bottom-[100px] pour ne pas être caché par la tab bar mobile */}
          <div className="fixed bottom-[100px] md:bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/95 to-transparent z-20">
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Sauvegarder les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Styles pour les animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; transform: translate(-50%, 0) scale(1); }
          50% { opacity: 0.3; transform: translate(-50%, 0) scale(1.05); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
};
