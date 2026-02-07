import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Mail, Briefcase, GraduationCap, Newspaper, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [profileType, setProfileType] = useState<string | null>(null);
  const { preferences, loading, updatePreference } = useNotificationPreferences(userId);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_type')
          .eq('id', session.user.id)
          .single();
        if (profile) setProfileType(profile.profile_type);
      }
    };
    getUser();
  }, []);

  const isSauveteur = profileType === 'maitre_nageur';
  const isFormateur = profileType === 'formateur';
  const isEtablissement = profileType === 'etablissement';

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark md:bg-transparent md:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-probain-blue to-primary p-6 pt-8 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Paramètres</h1>
        </div>
      </div>

      {/* Layout 2 colonnes sur desktop */}
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Notifications */}
        <div className="bg-white/10 md:backdrop-blur-xl md:border md:border-white/10 rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-yellow-400" />
            <h2 className="text-lg md:text-xl font-semibold text-white">Notifications</h2>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Choisissez les notifications que vous souhaitez recevoir
          </p>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Messages — tous les profils */}
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Messages</p>
                    <p className="text-gray-400 text-sm">
                      {isEtablissement ? 'Nouveaux messages et candidatures reçues' : 'Nouveaux messages reçus'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.notify_messages ?? true}
                  onCheckedChange={(checked) => updatePreference('notify_messages', checked)}
                />
              </div>

              {/* Formations — sauveteurs + formateurs */}
              {(isSauveteur || isFormateur) && (
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Formations</p>
                      <p className="text-gray-400 text-sm">
                        {isFormateur ? 'Formations et inscriptions à vos cours' : 'Nouvelles formations disponibles'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notify_formations ?? true}
                    onCheckedChange={(checked) => updatePreference('notify_formations', checked)}
                  />
                </div>
              )}

              {/* Offres d'emploi — sauveteurs uniquement */}
              {isSauveteur && (
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Offres d'emploi</p>
                      <p className="text-gray-400 text-sm">Nouvelles offres d'emploi</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notify_job_offers ?? true}
                    onCheckedChange={(checked) => updatePreference('notify_job_offers', checked)}
                  />
                </div>
              )}

              {/* Publications — tous les profils */}
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Newspaper className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-white font-medium">Publications</p>
                    <p className="text-gray-400 text-sm">Nouvelles publications dans le flux</p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.notify_flux ?? true}
                  onCheckedChange={(checked) => updatePreference('notify_flux', checked)}
                />
              </div>

              {/* Recyclage — sauveteurs uniquement */}
              {isSauveteur && (
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Recyclage</p>
                      <p className="text-gray-400 text-sm">Rappels de renouvellement des brevets</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notify_recycling ?? true}
                    onCheckedChange={(checked) => updatePreference('notify_recycling', checked)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Compte */}
        <div className="bg-white/10 md:backdrop-blur-xl md:border md:border-white/10 rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Compte</h2>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full md:w-auto md:px-8 bg-red-600 hover:bg-red-700"
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
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées,
                  incluant votre profil, vos formations, vos expériences et vos préférences.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="text-gray-400 text-sm mt-3 text-center">
            La suppression de votre compte est définitive et irréversible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
