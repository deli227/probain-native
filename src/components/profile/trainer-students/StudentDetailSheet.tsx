import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GraduationCap, Loader2, Mail, Phone } from 'lucide-react';
import { StudentFormationCard } from './StudentFormationCard';
import { StudentExternalFormationCard } from './StudentExternalFormationCard';
import { getInitials } from './types';
import type { StudentData, ExternalFormation } from './types';

// Fiche détail élève (Sheet)
export const StudentDetailSheet = ({
  student,
  ownFormations,
  externalFormations,
  loadingExternal,
  open,
  onOpenChange,
  onSendMessage,
}: {
  student: StudentData | null;
  ownFormations: StudentData[];
  externalFormations: ExternalFormation[];
  loadingExternal: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendMessage: () => void;
}) => {
  if (!student) return null;

  const initials = getInitials(student.name);
  const totalFormations = ownFormations.length + externalFormations.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-primary-dark border-white/10 p-0 pb-24 md:pb-0 overflow-y-auto" preventMobileAutoClose={false}>
        <SheetHeader className="sticky top-0 z-10 bg-gradient-to-r from-primary to-primary-light px-6 py-5 shadow-lg">
          <SheetTitle className="text-lg font-bold text-white">Détails de l'élève</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Avatar + Nom */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center border-2 border-white/20 mb-4 overflow-hidden">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white/70">{initials}</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white">{student.name || 'Sans nom'}</h3>
            {student.email && (
              <p className="text-sm text-white/50 mt-1">{student.email}</p>
            )}
            {student.phoneVisible && student.phone && (
              <a
                href={`tel:${student.phone}`}
                className="text-sm text-cyan-400 hover:text-cyan-300 mt-1 flex items-center gap-1"
              >
                <Phone className="h-3.5 w-3.5" />
                {student.phone}
              </a>
            )}
          </div>

          {/* Formations chez vous */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-white">
                Formations chez vous ({ownFormations.length})
              </span>
            </div>
            <div className="space-y-2">
              {ownFormations.map((f) => (
                <StudentFormationCard key={f.id} formation={f} />
              ))}
            </div>
          </div>

          {/* Formations du sauveteur (depuis son profil) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <GraduationCap className="h-3.5 w-3.5 text-white/40" />
              </div>
              <span className="text-sm font-semibold text-white/70">
                Ses formations {!loadingExternal && `(${externalFormations.length})`}
              </span>
            </div>
            {loadingExternal ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : externalFormations.length > 0 ? (
              <div className="space-y-2">
                {externalFormations.map((f) => (
                  <StudentExternalFormationCard key={f.id} formation={f} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/30 pl-9">Aucune formation renseignée</p>
            )}
          </div>

          {/* Total */}
          {!loadingExternal && totalFormations > 0 && (
            <div className="text-center text-xs text-white/30 pt-1">
              {totalFormations} formation{totalFormations > 1 ? 's' : ''} au total
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl h-12"
              onClick={() => {
                onOpenChange(false);
                onSendMessage();
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
              Annuler
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
