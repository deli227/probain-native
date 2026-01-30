import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Search, Briefcase, GraduationCap, Loader2, MapPin, Users, ExternalLink, AlertCircle } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { CalendarModal } from "@/components/shared/CalendarModal";
import { useCalendarModal } from "@/hooks/use-calendar-modal";
import { useNavigate } from "react-router-dom";
import TrainerCoursesList from "@/components/formations/TrainerCoursesList";
import { supabase } from "@/integrations/supabase/client";
import { useSSSFormations, SSSFormation } from "@/hooks/use-sss-formations";
import { categorizeFormation, FORMATION_CATEGORIES, SUBCATEGORIES, FormationCategory } from "@/utils/formationCategories";
import { getUniqueCantons, isCityInCanton } from "@/utils/swissCantons";

// Clés pour le sessionStorage
const TRAINING_SEARCH_STATE_KEY = 'training_search_state';
const TRAINING_JOBS_COUNT_KEY = 'training_jobs_count';

// Types pour les formateurs
interface TrainerOrganization {
  id: string;
  name: string;
}

interface TrainerProfileData {
  id: string;
  trainer_profiles: {
    organization_name: string;
  } | null;
}

// Composant local pour afficher les formations sans faire d'appel API supplémentaire
function SSSFormationsListLocal({ formations, isLoading }: { formations: SSSFormation[], isLoading: boolean }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const totalPages = Math.ceil((formations?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFormations = formations?.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement des formations SSS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {paginatedFormations && paginatedFormations.length > 0 ? (
        <>
          <div className="bg-primary/5 p-6 rounded-2xl">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedFormations.map((formation) => (
                <FormationCardLocal key={formation.id} formation={formation} />
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Aucune formation disponible pour le moment</p>
          </CardContent>
        </Card>
      )}

      <div className="text-center pt-4 border-t">
        <a
          href="https://formation.sss.ch/Calendrier-des-Cours"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          Voir toutes les formations sur le site SSS
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
    </div>
  );
}

const FormationCardLocal = memo(function FormationCardLocal({ formation }: { formation: SSSFormation }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium line-clamp-2">{formation.titre || "Formation SSS"}</CardTitle>
            <Badge variant="secondary" className="shrink-0">SSS</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formation.date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span>{formation.date}</span>
            </div>
          )}
          {formation.lieu && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{formation.lieu}</span>
            </div>
          )}
          {formation.organisateur && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{formation.organisateur}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            {formation.places && (
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    formation.placesColor === 'red' ? 'bg-red-500' :
                    formation.placesColor === 'orange' ? 'bg-orange-500' :
                    formation.placesColor === 'green' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <Badge variant="outline" className="text-xs">{formation.places}</Badge>
              </div>
            )}
            {formation.prix && <span className="text-sm font-medium text-primary">{formation.prix}</span>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl" aria-describedby={undefined}>
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">{formation.titre || "Formation SSS"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {formation.date && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white"><CalendarIcon className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formation.date}</p>
                  </div>
                </div>
              )}
              {formation.lieu && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white"><MapPin className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Lieu</p>
                    <p className="text-sm font-semibold text-gray-900">{formation.lieu}</p>
                  </div>
                </div>
              )}
              {formation.organisateur && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white"><Users className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Organisateur</p>
                    <p className="text-sm font-semibold text-gray-900">{formation.organisateur}</p>
                  </div>
                </div>
              )}
              {formation.prix && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white"><span className="text-sm font-bold">CHF</span></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Prix</p>
                    <p className="text-base font-bold text-gray-900">{formation.prix}</p>
                  </div>
                </div>
              )}
              {formation.places && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  formation.placesColor === 'red' ? 'bg-red-50 border-red-200' :
                  formation.placesColor === 'orange' ? 'bg-orange-50 border-orange-200' :
                  formation.placesColor === 'green' ? 'bg-green-50 border-green-200' : 'bg-primary/10 border-primary/20'
                }`}>
                  <div className={`rounded-full p-2 text-white ${
                    formation.placesColor === 'red' ? 'bg-red-500' :
                    formation.placesColor === 'orange' ? 'bg-orange-500' :
                    formation.placesColor === 'green' ? 'bg-green-500' : 'bg-primary'
                  }`}>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">Disponibilité</p>
                    <p className="text-base font-bold">{formation.places}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-4">
              {formation.url && (
                <Button asChild className="w-full rounded-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold">
                  <a href={formation.url} target="_blank" rel="noopener noreferrer">
                    S'inscrire <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
              <Button onClick={() => setIsOpen(false)} variant="outline" className="w-full rounded-full h-11">Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

FormationCardLocal.displayName = "FormationCardLocal";

// Helper pour récupérer l'état sauvegardé
const getSavedSearchState = () => {
  try {
    const saved = sessionStorage.getItem(TRAINING_SEARCH_STATE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      return {
        ...state,
        startDate: state.startDate ? new Date(state.startDate) : undefined,
        endDate: state.endDate ? new Date(state.endDate) : undefined,
      };
    }
  } catch {
    // Erreur lecture sessionStorage ignorée
  }
  return null;
};

const Training = () => {
  // Récupérer l'état sauvegardé au montage
  const savedState = getSavedSearchState();

  // Récupérer le count des jobs depuis le cache (pour éviter le spinner au retour)
  const getCachedJobsCount = () => {
    try {
      const cached = sessionStorage.getItem(TRAINING_JOBS_COUNT_KEY);
      if (cached) {
        const { count, timestamp } = JSON.parse(cached);
        // Cache valide pendant 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return count;
        }
      }
    } catch {
      // Erreur lecture cache ignorée
    }
    return null;
  };

  const cachedJobsCount = getCachedJobsCount();

  const [startDate, setStartDate] = useState<Date | undefined>(savedState?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(savedState?.endDate);

  const startCalendar = useCalendarModal({
    initialDate: startDate,
    onDateChange: setStartDate,
  });
  const endCalendar = useCalendarModal({
    initialDate: endDate,
    onDateChange: setEndDate,
  });

  const [selectedTrainer, setSelectedTrainer] = useState<string>(savedState?.selectedTrainer || "");
  const [searchType, setSearchType] = useState<string>(savedState?.searchType || "");
  const [searchSubType, setSearchSubType] = useState<string>(savedState?.searchSubType || "all");
  const [searchLocation, setSearchLocation] = useState<string>(savedState?.searchLocation || "");
  const [newJobsCount, setNewJobsCount] = useState<number>(cachedJobsCount ?? 0);
  // Ne pas montrer le spinner si on a déjà un count en cache
  const [isLoadingJobs, setIsLoadingJobs] = useState(cachedJobsCount === null);
  const [hasSearched, setHasSearched] = useState(savedState?.hasSearched || false);
  const [trainerOrganizations, setTrainerOrganizations] = useState<TrainerOrganization[]>([]);
  const navigate = useNavigate();

  // Sauvegarder l'état de recherche dans sessionStorage à chaque changement
  useEffect(() => {
    const stateToSave = {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      selectedTrainer,
      searchType,
      searchSubType,
      searchLocation,
      hasSearched,
    };
    sessionStorage.setItem(TRAINING_SEARCH_STATE_KEY, JSON.stringify(stateToSave));
  }, [startDate, endDate, selectedTrainer, searchType, searchSubType, searchLocation, hasSearched]);

  // NOTE: Auto-scroll vers les résultats désactivé pour éviter le défilement
  // automatique lors de la navigation entre onglets

  // Récupérer toutes les formations SSS pour extraire les options (sans afficher)
  // isLoading est true seulement au premier chargement, pas pendant les retries
  const { data: allSSSFormations, isLoading: isLoadingSSSFormations, isFetching } = useSSSFormations();

  // Récupérer les organismes formateurs de la DB
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            trainer_profiles (
              organization_name
            )
          `)
          .eq('profile_type', 'formateur')
          .not('trainer_profiles', 'is', null);

        if (error) throw error;

        const organizations: TrainerOrganization[] = (data as TrainerProfileData[])
          ?.filter((trainer) => trainer.trainer_profiles)
          .map((trainer) => ({
            id: trainer.id,
            name: trainer.trainer_profiles!.organization_name,
          })) || [];

        setTrainerOrganizations(organizations);
      } catch {
        // Erreur silencieuse - les formateurs ne sont pas critiques pour l'affichage
      }
    };

    fetchTrainers();
  }, []);

  // Extraire les villes uniques des formations puis les regrouper par canton
  const availableCities = useMemo(() =>
    Array.from(
      new Set(
        (allSSSFormations || [])
          .map(f => f.lieu)
          .filter(lieu => lieu && lieu !== 'Suisse')
      )
    ),
    [allSSSFormations]
  );

  // Obtenir les cantons uniques basés sur les villes disponibles
  const availableCantons = useMemo(() =>
    getUniqueCantons(availableCities as string[]),
    [availableCities]
  );

  // Les 4 catégories de formations fixes
  const availableCategories = FORMATION_CATEGORIES;

  // Extraire les formateurs uniques
  const availableTrainers = useMemo(() =>
    Array.from(
      new Set(
        (allSSSFormations || [])
          .map(f => f.organisateur)
          .filter(org => org && org !== 'Société Suisse de Sauvetage')
      )
    ).sort(),
    [allSSSFormations]
  );

  // Filtrer les formations selon les critères sélectionnés (memoized pour performance)
  const sssFormations = useMemo(() => {
    return (allSSSFormations || []).filter(formation => {
      // Filtre par canton (vérifie si la ville de la formation est dans le canton sélectionné)
      if (searchLocation && searchLocation !== 'all') {
        if (!formation.lieu || !isCityInCanton(formation.lieu, searchLocation)) {
          return false;
        }
      }

      // Filtre par catégorie de formation
      if (searchType && searchType !== 'all') {
        const formationCategory = categorizeFormation(formation.titre || '');
        if (formationCategory !== searchType) {
          return false;
        }
      }

      // Filtre par sous-catégorie (recherche par mot-clé dans le titre)
      if (searchSubType && searchSubType !== 'all' && searchType && searchType !== 'all') {
        const subcategories = SUBCATEGORIES[searchType as FormationCategory];
        const subcat = subcategories?.find(s => s.id === searchSubType);
        if (subcat) {
          const lowerTitre = formation.titre?.toLowerCase() || '';
          const matchesKeyword = subcat.keywords.some(kw =>
            lowerTitre.includes(kw.toLowerCase())
          );
          if (!matchesKeyword) {
            return false;
          }
        }
      }

      // Filtre par formateur
      if (selectedTrainer && selectedTrainer !== 'all' && !formation.organisateur?.toLowerCase().includes(selectedTrainer.toLowerCase())) {
        return false;
      }

      // Filtre par dates
      if (startDate || endDate) {
        // Extraire la première date de la formation (format: "1 septembre 2025" ou "1 septembre 2025 - 22 juin 2026")
        const dateStr = formation.date;
        if (dateStr && dateStr !== 'Date à confirmer') {
          try {
            // Parser la date française
            const dateMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
            if (dateMatch) {
              const [, day, month, year] = dateMatch;
              const monthMap: { [key: string]: number } = {
                'janvier': 0, 'Janvier': 0, 'février': 1, 'Février': 1, 'mars': 2, 'Mars': 2,
                'avril': 3, 'Avril': 3, 'mai': 4, 'Mai': 4, 'juin': 5, 'Juin': 5,
                'juillet': 6, 'Juillet': 6, 'août': 7, 'Août': 7, 'septembre': 8, 'Septembre': 8,
                'octobre': 9, 'Octobre': 9, 'novembre': 10, 'Novembre': 10, 'décembre': 11, 'Décembre': 11
              };
              const monthIndex = monthMap[month] !== undefined ? monthMap[month] : monthMap[month.toLowerCase()] || 0;
              const formationDate = new Date(parseInt(year), monthIndex, parseInt(day));

              // Vérifier si la date est dans la plage
              if (startDate && formationDate < startDate) {
                return false;
              }
              if (endDate && formationDate > endDate) {
                return false;
              }
            }
          } catch {
            // Erreur parsing date ignorée - la formation reste affichée
          }
        }
      }

      return true;
    });
  }, [allSSSFormations, searchLocation, searchType, searchSubType, selectedTrainer, startDate, endDate]);

  // Récupérer le nombre de nouvelles offres d'emploi (derniers 7 jours)
  useEffect(() => {
    const fetchNewJobsCount = async () => {
      // Ne pas refetch si on a déjà un count en cache valide
      if (cachedJobsCount !== null) {
        setIsLoadingJobs(false);
        return;
      }

      setIsLoadingJobs(true);
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count, error } = await supabase
          .from("job_postings")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString());

        if (!error && count !== null) {
          setNewJobsCount(count);
          // Sauvegarder dans le cache
          sessionStorage.setItem(TRAINING_JOBS_COUNT_KEY, JSON.stringify({
            count,
            timestamp: Date.now()
          }));
        }
      } catch {
        // Erreur silencieuse - le count des jobs n'est pas critique
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchNewJobsCount();
  }, [cachedJobsCount]);

  // Note: Les formateurs fixes sont remplacés par availableTrainers (dynamique)
  // qui est extrait des formations réelles

  // Avant recherche: afficher le total formations + emplois
  // Après recherche: 0 (les badges disparaissent)
  const totalNewItems = hasSearched ? 0 : (allSSSFormations?.length || 0) + newJobsCount;

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    document.getElementById("formations-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fonction pour obtenir le nom d'affichage du formateur sélectionné
  const getTrainerDisplayName = () => {
    if (!selectedTrainer) return "Formateur";
    if (selectedTrainer === "all") return "Tous les formateurs";
    if (selectedTrainer === "SSS") return "Société Suisse de Sauvetage";
    if (selectedTrainer.startsWith("trainer_")) {
      const trainerId = selectedTrainer.replace("trainer_", "");
      const org = trainerOrganizations.find(o => o.id === trainerId);
      return org?.name || "Formateur";
    }
    return selectedTrainer;
  };

  return (
    <div className="min-h-screen bg-background md:bg-transparent">
      <div className="w-full bg-gradient-to-br from-probain-blue via-primary to-primary-dark py-4 md:py-6 px-4 relative overflow-hidden">
        {/* Cercle décoratif */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3" />

        <div className="relative max-w-[1280px] mx-auto text-center">
          <h1 className="text-base md:text-lg font-bold text-white mb-4 mt-8 md:mt-2 tracking-tight">
            {totalNewItems > 0
              ? `${totalNewItems} NOUVELLE${totalNewItems > 1 ? "S" : ""} OPPORTUNITÉ${totalNewItems > 1 ? "S" : ""}`
              : "FORMATIONS ET OFFRES DISPONIBLES"}
          </h1>

          <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
            {/* Carte Formations SSS - Compacte */}
            <Card className="group relative p-3 bg-white/95 backdrop-blur-sm rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              {!hasSearched && (allSSSFormations?.length || 0) > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                  {allSSSFormations?.length || 0}
                </span>
              )}
              <div className="w-14 h-14 md:w-16 md:h-16 flex flex-col items-center justify-center gap-1">
                <div className="p-2 bg-gradient-to-br from-primary/10 to-probain-blue/10 rounded-lg">
                  <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-primary">FORMATIONS</span>
              </div>
            </Card>

            {/* Carte Offres d'emploi - Compacte */}
            <Card
              className="group relative p-3 bg-white/95 backdrop-blur-sm rounded-xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/jobs")}
            >
              {!hasSearched && newJobsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                  {newJobsCount}
                </span>
              )}
              <div className="w-14 h-14 md:w-16 md:h-16 flex flex-col items-center justify-center gap-1">
                <div className="p-2 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-lg">
                  <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-primary">EMPLOIS</span>
              </div>
            </Card>
          </div>

        </div>
      </div>

      <div className="bg-primary-dark text-white py-5 md:py-6">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-sm md:text-base font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 text-center">
            FORMATIONS ET RECYCLAGES EN SUISSE ROMANDE
          </h2>

          <p className="text-[10px] md:text-xs mb-4 text-gray-400 text-center">
            Laissez vide pour plus de résultats
          </p>

          <div className="space-y-5 max-w-2xl md:max-w-4xl mx-auto bg-white/5 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-white/10">
            {/* Type de formation - 4 catégories */}
            <Select
              value={searchType}
              onValueChange={(value) => {
                setSearchType(value);
                setSearchSubType('all'); // Reset sous-catégorie quand on change de catégorie
              }}
            >
              <SelectTrigger className="w-full bg-white text-sm md:text-base text-gray-900">
                <SelectValue placeholder="Type de formation" className="text-gray-900">
                  {searchType === 'all' || !searchType
                    ? "Type de formation"
                    : availableCategories.find(c => c.id === searchType)?.label || searchType}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-900">
                  Tous les types
                </SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="text-gray-900">
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sous-catégorie - apparaît si la catégorie a des sous-types */}
            {searchType && searchType !== 'all' && SUBCATEGORIES[searchType as FormationCategory]?.length > 0 && (
              <Select
                value={searchSubType}
                onValueChange={setSearchSubType}
              >
                <SelectTrigger className="w-full bg-white text-sm md:text-base text-gray-900">
                  <SelectValue placeholder="Sous-catégorie" className="text-gray-900">
                    {searchSubType === 'all' || !searchSubType
                      ? "Toutes les sous-catégories"
                      : SUBCATEGORIES[searchType as FormationCategory]?.find(s => s.id === searchSubType)?.label || searchSubType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-gray-900">
                    Toutes les sous-catégories
                  </SelectItem>
                  {SUBCATEGORIES[searchType as FormationCategory]?.map((subcat) => (
                    <SelectItem key={subcat.id} value={subcat.id} className="text-gray-900">
                      {subcat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Formateur */}
            <Select
              value={selectedTrainer}
              onValueChange={setSelectedTrainer}
            >
              <SelectTrigger className="w-full bg-white text-sm md:text-base text-gray-900">
                <SelectValue placeholder="Formateur" className="text-gray-900">
                  {getTrainerDisplayName()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all" className="text-gray-900">
                  Tous les formateurs
                </SelectItem>
                <SelectItem value="SSS" className="text-gray-900">
                  Société Suisse de Sauvetage
                </SelectItem>
                {availableTrainers.map((trainer) => (
                  <SelectItem key={trainer} value={trainer} className="text-gray-900">
                    {trainer}
                  </SelectItem>
                ))}
                {trainerOrganizations.length > 0 && (
                  <>
                    {trainerOrganizations.map((org) => (
                      <SelectItem key={org.id} value={`trainer_${org.id}`} className="text-gray-900 font-semibold">
                        {org.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Canton */}
            <Select
              value={searchLocation}
              onValueChange={setSearchLocation}
            >
              <SelectTrigger className="w-full bg-white text-sm md:text-base text-gray-900">
                <SelectValue placeholder="Canton" className="text-gray-900">
                  {searchLocation === 'all' || !searchLocation
                    ? "Canton"
                    : availableCantons.find(c => c.id === searchLocation)?.label || searchLocation}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all" className="text-gray-900">
                  Tous les cantons
                </SelectItem>
                {availableCantons.map((canton) => (
                  <SelectItem key={canton.id} value={canton.id} className="text-gray-900">
                    {canton.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <p className="text-sm text-center">Dates :</p>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                <span className="text-sm">Du</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startCalendar.open(startDate)}
                  className={cn(
                    "w-full md:w-[200px] justify-start text-left font-normal bg-white text-sm md:text-base",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "P", { locale: fr }) : <span>Choisir une date</span>}
                </Button>

                <span className="text-sm">au</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => endCalendar.open(endDate)}
                  className={cn(
                    "w-full md:w-[200px] justify-start text-left font-normal bg-white text-sm md:text-base",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "P", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </div>

              <CalendarModal
                isOpen={startCalendar.isOpen}
                onClose={startCalendar.close}
                title="Date de début"
                tempDate={startCalendar.tempDate}
                setTempDate={startCalendar.setTempDate}
                currentYear={startCalendar.currentYear}
                setCurrentYear={startCalendar.setCurrentYear}
                currentMonth={startCalendar.currentMonth}
                setCurrentMonth={startCalendar.setCurrentMonth}
                onConfirm={startCalendar.confirm}
                onClear={startCalendar.clear}
                onYearChange={startCalendar.handleYearChange}
                onPrevYear={startCalendar.prevYear}
                onNextYear={startCalendar.nextYear}
              />
              <CalendarModal
                isOpen={endCalendar.isOpen}
                onClose={endCalendar.close}
                title="Date de fin"
                tempDate={endCalendar.tempDate}
                setTempDate={endCalendar.setTempDate}
                currentYear={endCalendar.currentYear}
                setCurrentYear={endCalendar.setCurrentYear}
                currentMonth={endCalendar.currentMonth}
                setCurrentMonth={endCalendar.setCurrentMonth}
                onConfirm={endCalendar.confirm}
                onClear={endCalendar.clear}
                onYearChange={endCalendar.handleYearChange}
                onPrevYear={endCalendar.prevYear}
                onNextYear={endCalendar.nextYear}
              />
            </div>

            <Button
              className="w-full max-w-xs mx-auto h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-primary font-bold text-sm md:text-base rounded-xl shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/40 hover:-translate-y-0.5"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
              RECHERCHE
            </Button>
          </div>
        </div>
      </div>

      {/* Section des formations - Affichée seulement après recherche */}
      {hasSearched && (
        <div id="formations-section" className="py-8 md:py-12 bg-gray-50 md:bg-transparent">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
            {selectedTrainer && selectedTrainer.startsWith('trainer_') ? (
              // Afficher les cours du formateur sélectionné
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
                  COURS DISPONIBLES
                </h2>
                <TrainerCoursesList trainerId={selectedTrainer.replace('trainer_', '')} />
              </>
            ) : (
              // Afficher les formations SSS filtrées (utilise les données déjà chargées)
              <SSSFormationsListLocal formations={sssFormations} isLoading={isLoadingSSSFormations && !allSSSFormations} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
