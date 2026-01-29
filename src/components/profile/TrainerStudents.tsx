
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Search, Mail, Check, X, Loader2, CalendarDays, GraduationCap, Shield, Phone, SlidersHorizontal } from 'lucide-react';
import { SendMessageDialog } from "@/components/profile/SendMessageDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { safeGetUser } from "@/utils/asyncHelpers";
import { logger } from "@/utils/logger";
import { getRecyclingInfo, getRecyclingLabel, normalizeCertName } from "@/utils/recyclingUtils";
import type { RecyclingStatus } from "@/utils/recyclingConfig";

interface StudentData {
  id: string;
  student_id: string;
  name: string;
  email: string;
  phone: string | null;
  phoneVisible: boolean;
  avatarUrl: string | null;
  certification_issued: boolean;
  date: string;
  training_type: string;
  training_date: string;
  recyclingStatus: RecyclingStatus;
  recyclingLabel: string | null;
}

interface SelectedStudent {
  student_id: string;
  student: {
    first_name: string;
    last_name: string;
  };
}

// Helper: obtenir les initiales
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Badge de statut recyclage
const RecyclingStatusBadge = ({ status }: { status: RecyclingStatus }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    valid: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Valide' },
    expiring_soon: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Expire bientôt' },
    reminder: { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'À recycler' },
    expired: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Expiré' },
    no_recycling: { bg: 'bg-white/10', text: 'text-white/50', label: 'Permanent' },
    unknown: { bg: 'bg-white/10', text: 'text-white/40', label: '' },
  };

  const c = config[status] || config.unknown;
  if (!c.label) return null;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text} whitespace-nowrap`}>
      {c.label}
    </span>
  );
};

// Interface pour les formations externes (table `formations` du sauveteur)
interface ExternalFormation {
  id: string;
  title: string;
  organization: string;
  start_date: string;
  date: string;
  recyclingStatus: RecyclingStatus;
  recyclingLabel: string | null;
}

// Carte formation dans le détail (formations du formateur actuel)
const FormationCard = ({ formation }: { formation: StudentData }) => {
  const statusColor =
    formation.recyclingStatus === 'expired' ? 'text-red-400' :
    formation.recyclingStatus === 'expiring_soon' ? 'text-orange-400' :
    formation.recyclingStatus === 'reminder' ? 'text-sky-400' :
    formation.recyclingStatus === 'valid' ? 'text-green-400' :
    'text-white/50';

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-white truncate">{formation.training_type || 'Non spécifiée'}</p>
        </div>
        <RecyclingStatusBadge status={formation.recyclingStatus} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40 flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formation.date}
        </span>
        {formation.recyclingLabel && (
          <span className={statusColor}>{formation.recyclingLabel}</span>
        )}
      </div>
    </div>
  );
};

// Carte formation externe (depuis la table `formations` du sauveteur)
const ExternalFormationCard = ({ formation }: { formation: ExternalFormation }) => {
  const statusColor =
    formation.recyclingStatus === 'expired' ? 'text-red-400' :
    formation.recyclingStatus === 'expiring_soon' ? 'text-orange-400' :
    formation.recyclingStatus === 'reminder' ? 'text-sky-400' :
    formation.recyclingStatus === 'valid' ? 'text-green-400' :
    'text-white/50';

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 border-dashed space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="h-4 w-4 text-white/30 flex-shrink-0" />
          <p className="text-sm font-semibold text-white truncate">{formation.title || 'Non spécifiée'}</p>
        </div>
        <RecyclingStatusBadge status={formation.recyclingStatus} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40 flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formation.date}
        </span>
        {formation.recyclingLabel && (
          <span className={statusColor}>{formation.recyclingLabel}</span>
        )}
      </div>
      <div className="text-xs text-white/30">
        Organisation : {formation.organization}
      </div>
    </div>
  );
};

// Fiche détail élève (Sheet)
const StudentDetailSheet = ({
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
                <FormationCard key={f.id} formation={f} />
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
                  <ExternalFormationCard key={f.id} formation={f} />
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

// Carte élève redesignée
const StudentCard = ({
  student,
  isSelected,
  onToggleSelect,
  onSendMessage,
  onViewDetails,
}: {
  student: StudentData;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSendMessage: () => void;
  onViewDetails: () => void;
}) => {
  const initials = getInitials(student.name);

  return (
    <div
      className={`bg-white/10 backdrop-blur-sm rounded-xl border p-4 hover:bg-white/15 transition-all cursor-pointer ${
        isSelected ? 'border-probain-blue ring-1 ring-probain-blue' : 'border-white/10'
      }`}
      onClick={onViewDetails}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          className="border-white/40 data-[state=checked]:bg-probain-blue data-[state=checked]:border-probain-blue flex-shrink-0"
        />

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center border border-white/20 flex-shrink-0 overflow-hidden">
          {student.avatarUrl ? (
            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white/70">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{student.name || 'Sans nom'}</p>
          <p className="text-sm text-white/50 truncate">{student.training_type || 'Non spécifiée'}</p>
        </div>

        {/* Status badge */}
        <RecyclingStatusBadge status={student.recyclingStatus} />

        {/* Bouton message uniquement */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
            onClick={onSendMessage}
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sous-ligne : date + recyclage */}
      <div className="ml-[52px] mt-2 flex items-center gap-3 text-xs text-white/40">
        <span>{student.date}</span>
        {student.recyclingLabel && (
          <span className={
            student.recyclingStatus === 'expired' ? 'text-red-400' :
            student.recyclingStatus === 'expiring_soon' ? 'text-orange-400' :
            student.recyclingStatus === 'reminder' ? 'text-sky-400' :
            'text-white/40'
          }>
            {student.recyclingLabel}
          </span>
        )}
      </div>
    </div>
  );
};

// Header compact
const CompactHeader = ({ activeCount, totalCount }: { activeCount: number; totalCount: number }) => (
  <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark py-5 md:py-6 px-4 overflow-hidden">
    {/* Cercle décoratif */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

    <div className="relative max-w-4xl mx-auto text-center">
      <div className="flex flex-col items-center gap-2">
        {/* Icône compacte */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl blur-md opacity-40" />
          <div className="relative bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
        </div>

        <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
          MES ÉLÈVES
        </h1>

        {totalCount > 0 && (
          <p className="text-white/60 text-sm">
            {activeCount} actif{activeCount !== 1 ? 's' : ''} sur {totalCount}
          </p>
        )}
      </div>
    </div>
  </div>
);

// État vide
const EmptyState = ({ type }: { type: 'active' | 'all' }) => (
  <div className="text-center py-12">
    <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
    <p className="text-white/60 font-medium">
      {type === 'active' ? 'Aucun élève actif' : 'Aucun élève trouvé'}
    </p>
    <p className="text-white/40 text-sm mt-1">
      {type === 'active'
        ? 'Les élèves avec un brevet valide chez vous apparaîtront ici'
        : 'Les élèves qui passent un brevet chez vous apparaîtront ici'}
    </p>
  </div>
);

// Liste d'élèves
const StudentList = ({
  students,
  selectedStudents,
  onToggleSelect,
  onSendMessage,
  onToggleAll,
  onViewDetails,
  emptyType,
}: {
  students: StudentData[];
  selectedStudents: SelectedStudent[];
  onToggleSelect: (studentId: string) => void;
  onSendMessage: (studentId: string) => void;
  onToggleAll: () => void;
  onViewDetails: (student: StudentData) => void;
  emptyType: 'active' | 'all';
}) => {
  if (students.length === 0) return <EmptyState type={emptyType} />;

  const allSelected = students.every(s =>
    selectedStudents.some(sel => sel.student_id === s.student_id)
  );

  return (
    <>
      {/* Sélectionner tout - discret */}
      <div className="flex justify-end mb-3">
        <button
          onClick={onToggleAll}
          className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
        >
          {allSelected ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {allSelected ? 'Désélectionner' : 'Tout sélectionner'}
        </button>
      </div>

      <div className="space-y-3">
        {students.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            isSelected={selectedStudents.some(s => s.student_id === student.student_id)}
            onToggleSelect={() => onToggleSelect(student.student_id)}
            onSendMessage={() => onSendMessage(student.student_id)}
            onViewDetails={() => onViewDetails(student)}
          />
        ))}
      </div>
    </>
  );
};

// Panneau de filtres (brevet + source)
const FilterPanel = ({
  show,
  selectedBrevet,
  onSelectBrevet,
  formationSource,
  onSelectSource,
  availableBrevets,
  onClearFilters,
}: {
  show: boolean;
  selectedBrevet: string | null;
  onSelectBrevet: (brevet: string | null) => void;
  formationSource: 'all' | 'own' | 'others';
  onSelectSource: (source: 'all' | 'own' | 'others') => void;
  availableBrevets: string[];
  onClearFilters: () => void;
}) => {
  if (!show) return null;

  const hasActiveFilters = selectedBrevet !== null || formationSource !== 'all';

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
      {/* Sélecteur brevet */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
          Filtrer par brevet
        </label>
        <Select
          value={selectedBrevet || "__none__"}
          onValueChange={(v) => onSelectBrevet(v === "__none__" ? null : v)}
        >
          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white rounded-xl h-10 text-sm">
            <SelectValue placeholder="Tous les brevets" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a1628] border-white/10 rounded-xl">
            <SelectItem value="__none__" className="text-white/70 focus:bg-white/10 focus:text-white">
              Tous les brevets
            </SelectItem>
            {availableBrevets.map((b) => (
              <SelectItem key={b} value={b} className="text-white focus:bg-white/10 focus:text-white">
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sélecteur source (visible seulement quand un brevet est choisi) */}
      {selectedBrevet && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
            Source de la formation
          </label>
          <div className="grid grid-cols-3 gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {([
              { value: 'all' as const, label: 'Tous' },
              { value: 'own' as const, label: 'Chez moi' },
              { value: 'others' as const, label: 'Ailleurs' },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onSelectSource(value)}
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  formationSource === value
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bouton effacer */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <X className="h-3 w-3" />
          Effacer les filtres
        </button>
      )}
    </div>
  );
};

export const TrainerStudents = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentData | null>(null);
  const [externalFormations, setExternalFormations] = useState<ExternalFormation[]>([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  // Filtres brevet + source
  const [studentFormationsMap, setStudentFormationsMap] = useState<Map<string, string[]>>(new Map());
  const [selectedBrevet, setSelectedBrevet] = useState<string | null>(null);
  const [formationSource, setFormationSource] = useState<'all' | 'own' | 'others'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Récupérer les élèves du formateur
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error("Non authentifié");

      const { data, error: fetchError } = await supabase
        .from("trainer_students")
        .select(`
          id,
          training_date,
          training_type,
          certification_issued,
          student_id,
          profiles!student_id(
            id,
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq("trainer_id", user.id);

      if (fetchError) throw fetchError;

      // Récupérer phone_visible depuis rescuer_profiles pour chaque élève
      const studentIds = (data || []).map(item => item.student_id);
      let phoneVisibilityMap: Record<string, boolean> = {};

      if (studentIds.length > 0) {
        const { data: rescuerProfiles } = await supabase
          .from("rescuer_profiles")
          .select("id, phone_visible")
          .in("id", studentIds);

        if (rescuerProfiles) {
          phoneVisibilityMap = Object.fromEntries(
            rescuerProfiles.map(rp => [rp.id, rp.phone_visible ?? false])
          );
        }
      }

      const formattedStudents: StudentData[] = (data || []).map(item => {
        // Calculer le statut de recyclage
        const recyclingInfo = getRecyclingInfo({
          id: item.id,
          title: item.training_type,
          start_date: item.training_date,
        });
        const recyclingLabel = getRecyclingLabel(recyclingInfo);

        return {
          id: item.id,
          student_id: item.student_id,
          name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim(),
          email: item.profiles?.email || '',
          phone: item.profiles?.phone || null,
          phoneVisible: phoneVisibilityMap[item.student_id] ?? false,
          avatarUrl: item.profiles?.avatar_url || null,
          certification_issued: item.certification_issued ?? false,
          date: new Date(item.training_date).toLocaleDateString('fr-FR'),
          training_type: item.training_type,
          training_date: item.training_date,
          recyclingStatus: recyclingInfo.status,
          recyclingLabel,
        };
      });

      setStudents(formattedStudents);

      // Charger les formations externes (table `formations`) pour le système de filtres
      if (studentIds.length > 0) {
        try {
          const BATCH_SIZE = 200;
          const batches: string[][] = [];
          for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
            batches.push(studentIds.slice(i, i + BATCH_SIZE));
          }
          const results = await Promise.all(
            batches.map(batch =>
              supabase.from("formations").select("user_id, title").in("user_id", batch)
            )
          );
          const fMap = new Map<string, string[]>();
          for (const { data: batchData } of results) {
            if (batchData) {
              for (const item of batchData) {
                const arr = fMap.get(item.user_id) || [];
                arr.push(item.title);
                fMap.set(item.user_id, arr);
              }
            }
          }
          setStudentFormationsMap(fMap);
        } catch (err) {
          console.error('[TrainerStudents] Bulk formations fetch error:', err);
          // Non-bloquant : le filtre fonctionnera uniquement avec les données propres
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos élèves",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Charger les formations externes quand on ouvre le détail d'un élève
  useEffect(() => {
    if (!detailStudent) {
      setExternalFormations([]);
      return;
    }

    const fetchExternalFormations = async () => {
      setLoadingExternal(true);
      try {
        // Récupérer toutes les formations du sauveteur depuis la table `formations`
        // Inclure end_date (date du dernier recyclage) pour calculer correctement le statut
        const { data, error: extError } = await supabase
          .from("formations")
          .select("id, title, organization, start_date, end_date")
          .eq("user_id", detailStudent.student_id);

        if (extError) {
          console.error("[ExternalFormations] Query error:", extError.message);
          setExternalFormations([]);
          return;
        }

        if (!data || data.length === 0) {
          setExternalFormations([]);
          return;
        }

        const formatted: ExternalFormation[] = data.map(item => {
          const recyclingInfo = getRecyclingInfo({
            id: item.id,
            title: item.title,
            start_date: item.start_date,
            end_date: item.end_date,
          });
          const recyclingLabel = getRecyclingLabel(recyclingInfo);

          return {
            id: item.id,
            title: item.title || '',
            organization: item.organization || '',
            start_date: item.start_date,
            date: new Date(item.end_date || item.start_date).toLocaleDateString('fr-FR'),
            recyclingStatus: recyclingInfo.status,
            recyclingLabel,
          };
        });

        setExternalFormations(formatted);
      } catch (err) {
        console.error("[ExternalFormations] Unexpected error:", err);
        setExternalFormations([]);
      } finally {
        setLoadingExternal(false);
      }
    };

    fetchExternalFormations();
  }, [detailStudent]);

  // Liste des brevets disponibles (propres + externes)
  const availableBrevets = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      if (s.training_type) set.add(s.training_type);
    }
    for (const [, titles] of studentFormationsMap) {
      for (const t of titles) {
        if (t) set.add(t);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [students, studentFormationsMap]);

  // Reset source quand on change de brevet
  const handleSelectBrevet = useCallback((brevet: string | null) => {
    setSelectedBrevet(brevet);
    if (!brevet) setFormationSource('all');
  }, []);

  // Filtrer : recherche + onglet + brevet + source
  const getFilteredStudents = useCallback((tab: 'active' | 'all') => {
    return students.filter(student => {
      // 1. Recherche texte (existant)
      const matchesSearch = searchQuery === "" ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.training_type.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filtre onglet (existant)
      if (tab === 'active' && student.recyclingStatus === 'expired') {
        return false;
      }

      // 3. Filtre brevet + source (nouveau)
      if (selectedBrevet) {
        const norm = normalizeCertName(selectedBrevet);
        const ownMatch = normalizeCertName(student.training_type) === norm;
        const extForms = studentFormationsMap.get(student.student_id) || [];
        const extMatch = extForms.some(t => normalizeCertName(t) === norm);

        if (formationSource === 'own' && !ownMatch) return false;
        if (formationSource === 'others' && !extMatch) return false;
        if (formationSource === 'all' && !ownMatch && !extMatch) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedBrevet, formationSource, studentFormationsMap]);

  const activeStudents = useMemo(() => getFilteredStudents('active'), [getFilteredStudents]);
  const allStudents = useMemo(() => getFilteredStudents('all'), [getFilteredStudents]);

  // Sélection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const isSelected = prev.some(s => s.student_id === studentId);
      if (isSelected) {
        return prev.filter(s => s.student_id !== studentId);
      }
      const student = students.find(s => s.student_id === studentId);
      if (!student) return prev;
      return [...prev, {
        student_id: student.student_id,
        student: {
          first_name: student.name.split(' ')[0] || '',
          last_name: student.name.split(' ').slice(1).join(' ') || '',
        },
      }];
    });
  };

  const toggleAllStudents = (filteredStudents: StudentData[]) => {
    const allSelected = filteredStudents.every(s =>
      selectedStudents.some(sel => sel.student_id === s.student_id)
    );

    if (allSelected) {
      setSelectedStudents(prev =>
        prev.filter(s => !filteredStudents.some(f => f.student_id === s.student_id))
      );
    } else {
      const toAdd = filteredStudents
        .filter(s => !selectedStudents.some(sel => sel.student_id === s.student_id))
        .map(s => ({
          student_id: s.student_id,
          student: {
            first_name: s.name.split(' ')[0] || '',
            last_name: s.name.split(' ').slice(1).join(' ') || '',
          },
        }));
      setSelectedStudents(prev => [...prev, ...toAdd]);
    }
  };

  const openMessageDialogForStudent = (studentId: string) => {
    const student = students.find(s => s.student_id === studentId);
    if (student) {
      setSelectedStudents([{
        student_id: student.student_id,
        student: {
          first_name: student.name.split(' ')[0] || '',
          last_name: student.name.split(' ').slice(1).join(' ') || '',
        },
      }]);
      setIsMessageDialogOpen(true);
    }
  };

  // Counts (sans filtre de recherche)
  const totalCount = students.length;
  const activeCount = students.filter(s => s.recyclingStatus !== 'expired').length;

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
        <CompactHeader activeCount={0} totalCount={0} />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
        <CompactHeader activeCount={0} totalCount={0} />
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 text-center">
            <p className="text-red-400">Erreur : {error}</p>
            <Button
              onClick={fetchStudents}
              variant="ghost"
              className="mt-3 text-white/70 hover:text-white"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
      {/* Header compact */}
      <CompactHeader activeCount={activeCount} totalCount={totalCount} />

      {/* Contenu */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Barre de recherche + bouton filtre */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-probain-blue/50 focus:border-probain-blue/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`relative h-[42px] w-[42px] rounded-xl border flex-shrink-0 transition-all ${
              showFilters || selectedBrevet
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {selectedBrevet && !showFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
            )}
          </Button>
        </div>

        {/* Panneau de filtres */}
        <FilterPanel
          show={showFilters}
          selectedBrevet={selectedBrevet}
          onSelectBrevet={handleSelectBrevet}
          formationSource={formationSource}
          onSelectSource={setFormationSource}
          availableBrevets={availableBrevets}
          onClearFilters={() => {
            setSelectedBrevet(null);
            setFormationSource('all');
          }}
        />

        {/* Indicateur de filtre actif (panneau fermé) */}
        {!showFilters && selectedBrevet && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-white/40">Filtre :</span>
            <span
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:bg-cyan-500/30 transition-colors"
              onClick={() => setShowFilters(true)}
            >
              {selectedBrevet}
              {formationSource !== 'all' && ` · ${formationSource === 'own' ? 'Chez moi' : 'Ailleurs'}`}
            </span>
            <button
              onClick={() => { setSelectedBrevet(null); setFormationSource('all'); }}
              className="text-white/30 hover:text-white/50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 h-auto">
            <TabsTrigger
              value="active"
              className="rounded-lg py-2 text-sm text-white/60 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              Actifs ({activeStudents.length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-lg py-2 text-sm text-white/60 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              Tous ({allStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <StudentList
              students={activeStudents}
              selectedStudents={selectedStudents}
              onToggleSelect={toggleStudentSelection}
              onSendMessage={openMessageDialogForStudent}
              onToggleAll={() => toggleAllStudents(activeStudents)}
              onViewDetails={setDetailStudent}
              emptyType="active"
            />
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <StudentList
              students={allStudents}
              selectedStudents={selectedStudents}
              onToggleSelect={toggleStudentSelection}
              onSendMessage={openMessageDialogForStudent}
              onToggleAll={() => toggleAllStudents(allStudents)}
              onViewDetails={setDetailStudent}
              emptyType="all"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB : Envoyer message (fixé en bas quand sélection active) */}
      {selectedStudents.length > 0 && (
        <div className="fixed bottom-[100px] md:bottom-6 left-0 right-0 px-4 z-[55]">
          <div className="max-w-4xl mx-auto">
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all py-3"
              onClick={() => setIsMessageDialogOpen(true)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer un message ({selectedStudents.length})
            </Button>
          </div>
        </div>
      )}

      {/* Sheet détail élève */}
      <StudentDetailSheet
        student={detailStudent}
        ownFormations={detailStudent ? students.filter(s => s.student_id === detailStudent.student_id) : []}
        externalFormations={externalFormations}
        loadingExternal={loadingExternal}
        open={!!detailStudent}
        onOpenChange={(open) => { if (!open) setDetailStudent(null); }}
        onSendMessage={() => {
          if (detailStudent) {
            openMessageDialogForStudent(detailStudent.student_id);
          }
        }}
      />

      <SendMessageDialog
        isOpen={isMessageDialogOpen}
        onClose={() => {
          setIsMessageDialogOpen(false);
          if (selectedStudents.length === 1) {
            setSelectedStudents([]);
          }
        }}
        selectedStudents={selectedStudents}
      />
    </div>
  );
};
