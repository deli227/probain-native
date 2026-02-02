
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { AddressForm } from "./forms/AddressForm";
import { ChangePasswordSection } from "./forms/ChangePasswordSection";
import { NotificationPreferencesSection } from "./forms/NotificationPreferencesSection";
import { DeleteAccountSection } from "./forms/DeleteAccountSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { DecorativeOrbs } from "@/components/shared/DecorativeOrbs";
import { formatDateLocal } from "@/utils/dateUtils";

export const formSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  biography: z.string(),
  birthDate: z.preprocess(
    (arg) => {
      if (arg instanceof Date) return arg;
      if (typeof arg === 'string' || typeof arg === 'number') {
        const date = new Date(arg);
        return isNaN(date.getTime()) ? undefined : date;
      }
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      logger.log("[ProfileForm] Début de la mise à jour du profil avec les valeurs:", values);
      
      const { data: { user }, error: userError } = await safeGetUser(supabase);
      if (userError) {
        logger.error("[ProfileForm] Erreur lors de la récupération de l'utilisateur:", userError);
        throw userError;
      }
      if (!user) {
        logger.error("[ProfileForm] Aucun utilisateur trouvé");
        throw new Error("Aucun utilisateur trouvé");
      }

      // Mise à jour du profil de base
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: values.firstName,
          last_name: values.lastName,
          biography: values.biography,
          birth_date: values.birthDate ? formatDateLocal(values.birthDate) : null,
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

      // Mise à jour du profil sauveteur
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

      if (onProfileUpdated) onProfileUpdated();
      if (onSaveComplete) onSaveComplete();
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
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628]" />

      <DecorativeOrbs variant="page" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="relative z-10 space-y-6 pb-44 md:pb-24">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl">
            <PersonalInfoForm form={form} darkMode />
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl">
            <AddressForm form={form} darkMode />
          </div>

          <NotificationPreferencesSection userId={userId} />

          <ChangePasswordSection darkMode />

          <DeleteAccountSection userId={userId} />

          {/* Bouton de sauvegarde */}
          <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-0 md:w-full md:max-w-xl p-4 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/95 to-transparent z-20" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
            <Button
              type="submit"
              className="w-full md:max-w-sm md:mx-auto md:block h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]"
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
    </div>
  );
};
