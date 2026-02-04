import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { safeGetUser } from "@/utils/asyncHelpers";
import { getRecyclingInfo, getRecyclingLabel, normalizeCertName } from "@/utils/recyclingUtils";
import type { StudentData, SelectedStudent, ExternalFormation } from "@/components/profile/trainer-students/types";

// ------------------------------------------------------------------
// Query key factory — userId inclus pour éviter pollution de cache
// entre comptes lors d'un switch (login/logout)
// ------------------------------------------------------------------
const trainerStudentsKeys = {
  all: ['trainer-students'] as const,
  students: (userId: string | null) => ['trainer-students', 'list', userId] as const,
  externalFormations: (studentId: string | null) =>
    ['trainer-students', 'external-formations', studentId] as const,
};

// ------------------------------------------------------------------
// Data types returned by the students fetcher
// ------------------------------------------------------------------
interface StudentsQueryResult {
  students: StudentData[];
  studentFormationsMap: Map<string, string[]>;
}

// ------------------------------------------------------------------
// Fetchers
// ------------------------------------------------------------------

async function fetchStudentsData(): Promise<StudentsQueryResult> {
  const { data: { user } } = await safeGetUser(supabase);
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

  // Fetch phone_visible from rescuer_profiles for each student
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

  // Fetch formations des élèves pour croiser les dates de recyclage
  // et déduire si un record trainer_students est un diplôme ou un recyclage
  interface CertDates {
    latestEndDate: string | null;
    endDates: Set<string>;
  }
  let studentRecyclingMap: Record<string, Record<string, CertDates>> = {};

  if (studentIds.length > 0) {
    const { data: formationsData } = await supabase
      .from("formations")
      .select("user_id, title, end_date")
      .in("user_id", studentIds)
      .not("end_date", "is", null);

    if (formationsData) {
      for (const f of formationsData) {
        if (!f.user_id || !f.title || !f.end_date) continue;
        const norm = normalizeCertName(f.title);
        if (!studentRecyclingMap[f.user_id]) {
          studentRecyclingMap[f.user_id] = {};
        }
        if (!studentRecyclingMap[f.user_id][norm]) {
          studentRecyclingMap[f.user_id][norm] = { latestEndDate: null, endDates: new Set() };
        }
        const entry = studentRecyclingMap[f.user_id][norm];
        entry.endDates.add(f.end_date);
        if (!entry.latestEndDate || f.end_date > entry.latestEndDate) {
          entry.latestEndDate = f.end_date;
        }
      }
    }
  }

  const formattedStudents: StudentData[] = (data || []).map(item => {
    // Croiser avec la table formations pour trouver le dernier recyclage
    const certNorm = normalizeCertName(item.training_type);
    const certDates = studentRecyclingMap[item.student_id]?.[certNorm];
    const latestRecyclingDate = certDates?.latestEndDate || null;

    // Déduire si ce record est un diplôme initial ou un recyclage :
    // Si training_date correspond à un end_date (date de recyclage) dans formations → recyclage
    const isRecycling = certDates?.endDates.has(item.training_date) ?? false;

    const recyclingInfo = getRecyclingInfo({
      id: item.id,
      title: item.training_type,
      start_date: item.training_date,
      end_date: latestRecyclingDate,
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
      trainingCategory: isRecycling ? 'recyclage' as const : 'diplome' as const,
    };
  });

  // Fetch external formations (table `formations`) for the filter system
  let studentFormationsMap = new Map<string, string[]>();
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
            if (!item.user_id) continue;
            const arr = fMap.get(item.user_id) || [];
            arr.push(item.title ?? '');
            fMap.set(item.user_id, arr);
          }
        }
      }
      studentFormationsMap = fMap;
    } catch (err) {
      console.error('[TrainerStudents] Bulk formations fetch error:', err);
      // Non-blocking: filter will work only with own data
    }
  }

  return { students: formattedStudents, studentFormationsMap };
}

async function fetchExternalFormationsData(studentId: string): Promise<ExternalFormation[]> {
  const { data, error: extError } = await supabase
    .from("formations")
    .select("id, title, organization, start_date, end_date")
    .eq("user_id", studentId);

  if (extError) {
    console.error("[ExternalFormations] Query error:", extError.message);
    return [];
  }

  if (!data || data.length === 0) return [];

  return data.map(item => {
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
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useTrainerStudents() {
  // ---- Current user ID for query key scoping ----
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await safeGetUser(supabase);
      setCurrentUserId(user?.id ?? null);
    };
    getUser();

    // Écouter les changements d'auth pour mettre à jour le userId
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- UI state (not data-fetching) ----
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentData | null>(null);
  const [selectedBrevet, setSelectedBrevet] = useState<string | null>(null);
  const [formationSource, setFormationSource] = useState<'all' | 'own' | 'others'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ---- Students query (scoped by userId) ----
  const {
    data: studentsResult,
    isLoading: loading,
    error: queryError,
    refetch: refetchStudents,
  } = useQuery<StudentsQueryResult>({
    queryKey: trainerStudentsKeys.students(currentUserId),
    queryFn: fetchStudentsData,
    enabled: !!currentUserId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });

  const students = studentsResult?.students ?? [];
  const studentFormationsMap = studentsResult?.studentFormationsMap ?? new Map<string, string[]>();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Erreur inconnue') : null;

  // Show toast on error (only once per error via query)
  // useQuery's onError is deprecated, so we handle it via the error state in the UI

  // ---- External formations query (lazy: enabled when detailStudent is set) ----
  const {
    data: externalFormations = [],
    isLoading: loadingExternal,
  } = useQuery<ExternalFormation[]>({
    queryKey: trainerStudentsKeys.externalFormations(detailStudent?.student_id ?? null),
    queryFn: () => {
      if (!detailStudent) return Promise.resolve([]);
      return fetchExternalFormationsData(detailStudent.student_id);
    },
    enabled: !!detailStudent,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ---- fetchStudents wrapper for retry button ----
  const fetchStudents = useCallback(async () => {
    await refetchStudents();
  }, [refetchStudents]);

  // ---- Derived: available brevets ----
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

  // ---- Brevet filter handler ----
  const handleSelectBrevet = useCallback((brevet: string | null) => {
    setSelectedBrevet(brevet);
    if (!brevet) setFormationSource('all');
  }, []);

  // ---- Filter logic ----
  const getFilteredStudents = useCallback((tab: 'active' | 'all') => {
    return students.filter(student => {
      const matchesSearch = searchQuery === "" ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.training_type.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (tab === 'active' && student.recyclingStatus === 'expired') {
        return false;
      }

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

  // ---- Selection handlers ----
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

  // ---- Counts (without search filter) ----
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
