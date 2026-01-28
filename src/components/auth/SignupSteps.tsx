
import { UserCheck, Building2, GraduationCap, LucideIcon } from "lucide-react";

interface ProfileInfoProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
}

const ProfileInfo = ({ icon: Icon, title, description, highlight }: ProfileInfoProps) => (
  <div className={`flex items-start space-x-3 p-4 rounded-lg ${highlight ? 'bg-white/15 border border-white/20' : 'bg-white/5'}`}>
    <div className="flex-shrink-0">
      <Icon className="h-6 w-6 text-yellow-400" />
    </div>
    <div>
      <h3 className="font-medium text-white">{title}</h3>
      <p className="text-sm text-white/80 mt-1">{description}</p>
    </div>
  </div>
);

export const SignupSteps = () => (
  <div className="w-full max-w-md space-y-6 bg-white/10 backdrop-blur-lg p-8 rounded-lg">
    <h2 className="text-xl font-semibold text-white text-center mb-6">
      Comment s'inscrire ?
    </h2>
    <div className="space-y-4">
      <ProfileInfo
        icon={UserCheck}
        title="Sauveteur"
        description="Inscription directe avec email et mot de passe. Validez votre email puis complétez votre profil professionnel."
        highlight={true}
      />
      <ProfileInfo
        icon={GraduationCap}
        title="Organisme de formation"
        description="Sélectionnez votre organisme dans la liste et faites une demande de compte. Notre équipe validera votre demande et vous enverra vos identifiants par email."
      />
      <ProfileInfo
        icon={Building2}
        title="Établissement"
        description="Faites une demande de compte en laissant votre email professionnel. Nous vous contacterons pour finaliser la création de votre espace établissement."
      />
    </div>
    <div className="mt-6 pt-4 border-t border-white/20">
      <p className="text-white/60 text-xs text-center">
        Les comptes formateurs et établissements sont vérifiés manuellement pour garantir la sécurité de la plateforme.
      </p>
    </div>
  </div>
);
