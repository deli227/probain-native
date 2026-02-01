import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SendRescuerMessageDialog } from "@/components/profile/SendRescuerMessageDialog";

interface RescuerProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  phone_visible: boolean;
  canton: string | null;
}

interface RescuerProfileSheetProps {
  rescuerUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RescuerProfileSheet = ({
  rescuerUserId,
  open,
  onOpenChange,
}: RescuerProfileSheetProps) => {
  const [profile, setProfile] = useState<RescuerProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    if (!open || !rescuerUserId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Fetch base profile + rescuer profile in parallel
        const [baseRes, rescuerRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, first_name, last_name, email, avatar_url")
            .eq("id", rescuerUserId)
            .single(),
          supabase
            .from("rescuer_profiles")
            .select("first_name, last_name, avatar_url, phone, phone_visible, canton")
            .eq("id", rescuerUserId)
            .single(),
        ]);

        const base = baseRes.data;
        const rescuer = rescuerRes.data;

        if (base) {
          setProfile({
            id: base.id,
            first_name: rescuer?.first_name || base.first_name || "",
            last_name: rescuer?.last_name || base.last_name || "",
            email: base.email || "",
            avatar_url: rescuer?.avatar_url || base.avatar_url || null,
            phone: rescuer?.phone || null,
            phone_visible: rescuer?.phone_visible ?? false,
            canton: rescuer?.canton || null,
          });
        }
      } catch {
        // Silently fail — sheet will show loading state
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [open, rescuerUserId]);

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim() || "Sauveteur"
    : "";

  const initials = profile
    ? `${profile.first_name?.charAt(0) || ""}${profile.last_name?.charAt(0) || ""}`.toUpperCase() || "?"
    : "?";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full sm:max-w-md bg-primary-dark border-white/10 p-0 pb-24 md:pb-0 overflow-y-auto"
          preventMobileAutoClose={false}
        >
          <SheetHeader className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary-light px-6 py-5 shadow-lg">
            <SheetTitle className="text-lg font-bold text-white">
              Profil sauveteur
            </SheetTitle>
          </SheetHeader>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-white/40" />
                <p className="text-sm text-white/40 mt-3">Chargement du profil...</p>
              </div>
            ) : profile ? (
              <>
                {/* Avatar + Nom */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center border-2 border-white/20 mb-4 overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white/70">
                        {initials}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{fullName}</h3>
                  {profile.email && (
                    <p className="text-sm text-white/50 mt-1">{profile.email}</p>
                  )}
                </div>

                {/* Infos de contact */}
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 space-y-4">
                  {/* Téléphone */}
                  {profile.phone_visible && profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span className="text-sm">{profile.phone}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-white/30">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-white/20" />
                      </div>
                      <span className="text-sm">Téléphone non visible</span>
                    </div>
                  )}

                  {/* Canton */}
                  {profile.canton ? (
                    <div className="flex items-center gap-3 text-white/70">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-orange-400" />
                      </div>
                      <span className="text-sm">{profile.canton}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-white/30">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-white/20" />
                      </div>
                      <span className="text-sm">Canton non renseigné</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl h-12"
                    onClick={() => {
                      onOpenChange(false);
                      setMessageDialogOpen(true);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-12 font-semibold"
                    onClick={() => onOpenChange(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm text-white/40">Profil introuvable</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog message — rendu hors du Sheet pour éviter les conflits Radix */}
      {profile && (
        <SendRescuerMessageDialog
          isOpen={messageDialogOpen}
          onClose={() => setMessageDialogOpen(false)}
          rescuer={{
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
          }}
        />
      )}
    </>
  );
};
