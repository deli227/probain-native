import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeGetUser } from "@/utils/asyncHelpers";
import { getRecyclingInfo, getRecyclingLabel, normalizeCertName } from "@/utils/recyclingUtils";
import type { StudentData, SelectedStudent, ExternalFormation } from "@/components/profile/trainer-students/types";

export function useTrainerStudents() {
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

  return {
    // State
    students,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedStudents,
    setSelectedStudents,
    isMessageDialogOpen,
    setIsMessageDialogOpen,
    detailStudent,
    setDetailStudent,
    externalFormations,
    loadingExternal,
    selectedBrevet,
    setSelectedBrevet,
    formationSource,
    setFormationSource,
    showFilters,
    setShowFilters,

    // Derived data
    availableBrevets,
    activeStudents,
    allStudents,
    totalCount,
    activeCount,

    // Actions
    fetchStudents,
    handleSelectBrevet,
    toggleStudentSelection,
    toggleAllStudents,
    openMessageDialogForStudent,
  };
}
