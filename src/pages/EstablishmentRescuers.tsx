import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SendRescuerMessageDialog } from "@/components/profile/SendRescuerMessageDialog";
import { PDFViewerDialog } from "@/components/profile/PDFViewerDialog";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, Mail, MapPin, CheckCircle, XCircle, Eye, Phone, Users, X, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CANTONS_SUISSES } from "@/utils/swissCantons";
import { CantonCombobox } from "@/components/shared/CantonCombobox";

// Types pour les données rescuer
interface RescuerFormation {
  id: string;
  user_id: string | null;
  title: string;
  organization: string;
  start_date: string;
  end_date: string | null;
  document_url: string | null;
}

interface RescuerExperience {
  id: string;
  user_id: string | null;
  title: string;
  location: string;
  start_date: string;
  end_date: string | null;
  contract_type: string | null;
  document_url: string | null;
}

interface RescuerAvailability {
  id: string;
  user_id: string;
  date: string;
  is_available: boolean | null;
}

interface RescuerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  canton: string | null;
  phone: string | null;
  phone_visible: boolean | null;
  years_of_experience: number | null;
  availability_status: boolean | null;
  is_always_available: boolean | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    birth_date: string | null;
    canton: string | null;
    city_zip: string | null;
    phone: string | null;
    biography: string | null;
    [key: string]: unknown;
  };
  user_formations: RescuerFormation[];
  user_experiences: RescuerExperience[];
  user_availabilities: RescuerAvailability[];
  is_available_today: boolean;
}

// Nombre max de disponibilites visibles avant "Voir plus"
const MAX_VISIBLE_AVAILABILITIES = 6;

const RescuerProfileDialog = ({
  rescuer,
  calculateAge,
  formatDate,
  handleViewPdf,
  onMessage,
}: {
  rescuer: RescuerProfile;
  calculateAge: (date: string) => number;
  formatDate: (date: string) => string;
  handleViewPdf: (url: string, title: string) => void;
  onMessage: () => void;
}) => {
  const [showAllAvailabilities, setShowAllAvailabilities] = useState(false);

  const availabilities = rescuer.user_availabilities || [];
  const hasMoreAvailabilities = availabilities.length > MAX_VISIBLE_AVAILABILITIES;
  const visibleAvailabilities = showAllAvailabilities
    ? availabilities
    : availabilities.slice(0, MAX_VISIBLE_AVAILABILITIES);

  return (
    <DialogContent className="w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a1628] border-white/10 text-white [&>button]:text-white/70 [&>button]:hover:text-white">
      {/* Header avec avatar et infos */}
      <div className="relative -mx-6 -mt-6 mb-6 px-6 pt-8 pb-6 bg-gradient-to-br from-primary via-probain-blue to-primary-dark rounded-t-2xl border-b border-white/10">
        <DialogHeader>
          <DialogTitle asChild>
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-3 border-white/20 shadow-lg">
                    <AvatarImage
                      src={rescuer.avatar_url || "/placeholder.svg"}
                      alt={`${rescuer.first_name} ${rescuer.last_name}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                      {rescuer.first_name?.[0]}{rescuer.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1.5 -right-1.5 rounded-full p-1 bg-[#0a1628]">
                    {rescuer.is_available_today ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">
                    {rescuer.first_name} {rescuer.last_name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {rescuer.is_available_today ? (
                      <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-300 text-xs font-semibold px-3 py-1 rounded-full border border-green-500/30">
                        <CheckCircle className="h-3 w-3" />
                        Disponible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-300 text-xs font-semibold px-3 py-1 rounded-full border border-red-500/30">
                        <XCircle className="h-3 w-3" />
                        Non disponible
                      </span>
                    )}

                    {rescuer.profile.birth_date && (
                      <span className="inline-flex items-center bg-white/10 text-white/70 text-xs px-3 py-1 rounded-full border border-white/10">
                        {calculateAge(rescuer.profile.birth_date)} ans
                      </span>
                    )}

                    {rescuer.years_of_experience && (
                      <span className="inline-flex items-center bg-white/10 text-white/70 text-xs px-3 py-1 rounded-full border border-white/10">
                        {rescuer.years_of_experience} ans d'exp.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    {rescuer.profile.canton && (
                      <div className="flex items-center gap-1 bg-white/10 text-white/60 px-3 py-1.5 rounded-full border border-white/10">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{rescuer.profile.canton}</span>
                      </div>
                    )}
                    {rescuer.profile.city_zip && (
                      <div className="bg-white/10 text-white/60 px-3 py-1.5 rounded-full border border-white/10">
                        {rescuer.profile.city_zip}
                      </div>
                    )}
                    {rescuer.phone_visible && rescuer.profile.phone && (
                      <a
                        href={`tel:${rescuer.profile.phone}`}
                        className="flex items-center gap-1 bg-green-500/20 text-green-300 px-3 py-1.5 rounded-full border border-green-500/30 hover:bg-green-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{rescuer.profile.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="w-full sm:w-auto sm:self-start rounded-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all"
                onClick={onMessage}
              >
                <Mail className="h-4 w-4 mr-2" />
                Envoyer un message
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
      </div>

      <div className="px-1 space-y-4">
        {/* Biographie */}
        {rescuer.profile.biography && (
          <div className="backdrop-blur-xl bg-white/10 p-5 rounded-2xl border border-white/10">
            <h4 className="font-semibold text-sm text-white mb-2">
              Biographie
            </h4>
            <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">
              {rescuer.profile.biography}
            </p>
          </div>
        )}

        {/* Disponibilites specifiques */}
        {rescuer.availability_status && !rescuer.is_always_available && availabilities.length > 0 && (
          <div className="backdrop-blur-xl bg-green-500/10 p-5 rounded-2xl border border-green-500/20">
            <h4 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Disponibilites specifiques
            </h4>
            <div className="flex flex-wrap gap-2">
              {visibleAvailabilities.map((avail: RescuerAvailability) => (
                <span
                  key={avail.id}
                  className="inline-block bg-green-500/20 text-green-300 text-xs font-medium px-3 py-1.5 rounded-full border border-green-500/30"
                >
                  {format(new Date(avail.date), 'dd MMMM yyyy', { locale: fr })}
                </span>
              ))}
            </div>
            {hasMoreAvailabilities && (
              <button
                onClick={() => setShowAllAvailabilities(!showAllAvailabilities)}
                className="mt-3 flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none"
              >
                {showAllAvailabilities ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Voir moins
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Voir {availabilities.length - MAX_VISIBLE_AVAILABILITIES} date{availabilities.length - MAX_VISIBLE_AVAILABILITIES > 1 ? 's' : ''} de plus
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Toujours disponible */}
        {rescuer.availability_status && rescuer.is_always_available && (
          <div className="backdrop-blur-xl bg-green-500/10 p-5 rounded-2xl border border-green-500/20">
            <h4 className="font-semibold text-sm text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              Disponible tout le temps
            </h4>
          </div>
        )}

        {/* Onglets Formations / Experiences */}
        <Tabs defaultValue="formations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 rounded-2xl h-11 bg-white/10 border border-white/10">
            <TabsTrigger
              value="formations"
              className="rounded-xl text-white/60 data-[state=active]:bg-white/15 data-[state=active]:text-white transition-all text-sm"
            >
              Formations
            </TabsTrigger>
            <TabsTrigger
              value="experiences"
              className="rounded-xl text-white/60 data-[state=active]:bg-white/15 data-[state=active]:text-white transition-all text-sm"
            >
              Experiences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formations" className="mt-4">
            <div className="space-y-3">
              {rescuer.user_formations?.map((formation: RescuerFormation) => (
                <div key={formation.id} className="backdrop-blur-xl bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white mb-1 truncate">{formation.title}</h4>
                      <p className="text-xs text-white/50 mb-2">{formation.organization}</p>
                      <span className="inline-block bg-white/10 text-white/60 text-xs px-2.5 py-1 rounded-full border border-white/10">
                        {formatDate(formation.start_date)}
                        {formation.end_date && ` - ${formatDate(formation.end_date)}`}
                      </span>
                    </div>
                    {formation.document_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full shrink-0 text-white/50 hover:text-cyan-400 hover:bg-white/10"
                        onClick={() => handleViewPdf(formation.document_url, formation.title)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(!rescuer.user_formations || rescuer.user_formations.length === 0) && (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
                  <FileText className="h-10 w-10 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/40 italic">Aucune formation disponible</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="experiences" className="mt-4">
            <div className="space-y-3">
              {rescuer.user_experiences?.map((experience: RescuerExperience) => (
                <div key={experience.id} className="backdrop-blur-xl bg-white/10 p-4 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-white mb-1 truncate">{experience.title}</h4>
                      <p className="text-xs text-white/50 mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {experience.location}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-block bg-white/10 text-white/60 text-xs px-2.5 py-1 rounded-full border border-white/10">
                          {formatDate(experience.start_date)}
                          {experience.end_date && ` - ${formatDate(experience.end_date)}`}
                        </span>
                        {experience.contract_type && (
                          <span className="inline-block bg-cyan-500/15 text-cyan-300 text-xs px-2.5 py-1 rounded-full border border-cyan-500/20">
                            {experience.contract_type}
                          </span>
                        )}
                      </div>
                    </div>
                    {experience.document_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full shrink-0 text-white/50 hover:text-cyan-400 hover:bg-white/10"
                        onClick={() => handleViewPdf(experience.document_url, experience.title)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(!rescuer.user_experiences || rescuer.user_experiences.length === 0) && (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
                  <FileText className="h-10 w-10 text-white/20 mx-auto mb-2" />
                  <p className="text-sm text-white/40 italic">Aucune experience disponible</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  );
};

const EstablishmentRescuers = () => {
  const [selectedRescuer, setSelectedRescuer] = useState<RescuerProfile | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState({ url: "", title: "" });
  
  const [filters, setFilters] = useState({
    name: "",
    certifications: "",
    location: "",
    age: "",
    availability: "",
  });

  const handleViewPdf = (url: string, title: string) => {
    setCurrentDocument({ url, title });
    setIsPdfViewerOpen(true);
  };

  const certificationTypes = [
    "Base Pool",
    "Plus Pool",
    "Pro Pool",
    "BLS-AED",
    "Module Lac",
    "Module Rivière",
    "Expert Pool",
    "Expert BLS-AED",
    "Expert Lac",
    "Expert Rivière",
  ];

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const { data: rescuers, isLoading } = useQuery({
    queryKey: ["rescuers", filters],
    queryFn: async () => {
      const rescuerQuery = supabase
        .from("rescuer_profiles")
        .select(`
          *,
          profile:profiles!inner(*)
        `);

      const { data: rescuerProfiles, error: rescuerError } = await rescuerQuery;
      if (rescuerError) throw rescuerError;
      if (!rescuerProfiles) return [];

      const rescuerIds = rescuerProfiles.map(rescuer => rescuer.id);
      
      const { data: formations, error: formationsError } = await supabase
        .from("formations")
        .select("*")
        .in("user_id", rescuerIds);

      if (formationsError) throw formationsError;
      
      const { data: experiences, error: experiencesError } = await supabase
        .from("experiences")
        .select("*")
        .in("user_id", rescuerIds);

      if (experiencesError) throw experiencesError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      // Récupérer toutes les disponibilités futures (y compris aujourd'hui)
      const { data: availabilities, error: availabilitiesError } = await supabase
        .from("availabilities")
        .select("*")
        .in("user_id", rescuerIds)
        .eq("is_available", true)
        .gte("date", todayString);

      if (availabilitiesError) throw availabilitiesError;

      const rescuersWithDetails = rescuerProfiles.map(rescuer => {
        const userAvailabilities = availabilities?.filter(a => a.user_id === rescuer.id) || [];

        // Calculer la disponibilité réelle basée sur les dates
        let isActuallyAvailable = false;

        // Logique de disponibilité :
        // 1. Si availability_status est null ou false => indisponible (pas configuré ou explicitement indisponible)
        if (rescuer.availability_status !== true) {
          isActuallyAvailable = false;
        }
        // 2. Si disponible (true) ET toujours disponible (true) => disponible
        else if (rescuer.availability_status === true && rescuer.is_always_available === true) {
          isActuallyAvailable = true;
        }
        // 3. Si disponible (true) MAIS pas toujours disponible (false ou null) => vérifier si aujourd'hui est dans les dates
        else if (rescuer.availability_status === true && rescuer.is_always_available !== true) {
          // Vérifier si aujourd'hui est dans les dates disponibles spécifiques
          const isAvailableToday = userAvailabilities.some(avail => avail.date === todayString);
          isActuallyAvailable = isAvailableToday;
        }

        return {
          ...rescuer,
          user_formations: formations?.filter(f => f.user_id === rescuer.id) || [],
          user_experiences: experiences?.filter(e => e.user_id === rescuer.id) || [],
          user_availabilities: userAvailabilities,
          is_available_today: isActuallyAvailable // Nouveau champ pour la disponibilité actuelle
        };
      });

      let filteredRescuers = rescuersWithDetails;

      if (filters.name) {
        const searchName = filters.name.toLowerCase();
        filteredRescuers = filteredRescuers.filter(rescuer => {
          const fullName = `${rescuer.first_name} ${rescuer.last_name}`.toLowerCase();
          return fullName.includes(searchName);
        });
      }

      // Filtre par canton (ID 2 lettres, ex: "GE", "VD")
      if (filters.location) {
        filteredRescuers = filteredRescuers.filter(rescuer => {
          const canton = rescuer.profile?.canton || "";
          return canton === filters.location;
        });
      }

      // Filtre par âge
      if (filters.age) {
        const targetAge = parseInt(filters.age, 10);
        if (!isNaN(targetAge)) {
          filteredRescuers = filteredRescuers.filter(rescuer => {
            if (rescuer.profile?.birth_date) {
              const age = calculateAge(rescuer.profile.birth_date);
              return age === targetAge;
            }
            return false;
          });
        }
      }

      // Filtre par brevet/certification
      if (filters.certifications && filters.certifications !== "all") {
        filteredRescuers = filteredRescuers.filter(rescuer =>
          rescuer.user_formations &&
          rescuer.user_formations.some((formation: RescuerFormation) =>
            formation.title.toLowerCase().includes(filters.certifications.toLowerCase())
          )
        );
      }

      // Filtre par disponibilité (basé sur la disponibilité calculée aujourd'hui)
      if (filters.availability && filters.availability !== "all") {
        if (filters.availability === "available") {
          filteredRescuers = filteredRescuers.filter(rescuer => rescuer.is_available_today);
        } else if (filters.availability === "unavailable") {
          filteredRescuers = filteredRescuers.filter(rescuer => !rescuer.is_available_today);
        }
      }

      return filteredRescuers;
    },
  });

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM yyyy', { locale: fr });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark md:bg-transparent">
        {/* Header compact (identique au final) */}
        <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark px-4 py-3 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-400/20 rounded-xl border border-white/10">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">LES SAUVETEURS</h1>
                <p className="text-[11px] text-white/40">Recherchez et contactez des sauveteurs</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark md:bg-transparent md:pb-6">
      {/* Header compact */}
      <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark px-4 py-3 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-400/20 rounded-xl border border-white/10">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">LES SAUVETEURS</h1>
              <p className="text-[11px] text-white/40">Recherchez et contactez des sauveteurs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Statut compact */}
      <div className="bg-white/10 p-3 rounded-xl mb-4 border border-white/10">
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            <span className="text-white/60">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-white/60">Non disponible</span>
          </div>
        </div>
      </div>

      {/* Filtres compacts */}
      <div className="bg-white/5 p-3 rounded-2xl mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Input
            placeholder="Nom / Prénom"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="h-9 text-xs rounded-full"
          />

          <Select
            value={filters.certifications || "all"}
            onValueChange={(value) => setFilters({ ...filters, certifications: value === "all" ? "" : value })}
          >
            <SelectTrigger className="h-9 text-xs rounded-full">
              <SelectValue placeholder="Brevets" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Tous les brevets</SelectItem>
              {certificationTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <CantonCombobox
            value={filters.location || "all"}
            onValueChange={(value) => setFilters({ ...filters, location: value === "all" ? "" : value })}
            placeholder="Canton"
            showAllOption
            compact
          />

          <Select
            value={filters.availability || "all"}
            onValueChange={(value) => setFilters({ ...filters, availability: value === "all" ? "" : value })}
          >
            <SelectTrigger className="h-9 text-xs rounded-full">
              <SelectValue placeholder="Disponibilité" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="unavailable">Non disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bouton effacer les filtres */}
        {(filters.name || filters.certifications || filters.location || filters.age || filters.availability) && (
          <button
            onClick={() => setFilters({ name: "", certifications: "", location: "", age: "", availability: "" })}
            className="mt-2 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors focus:outline-none focus-visible:outline-none"
          >
            <X className="h-3 w-3" />
            Effacer les filtres
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 stagger-children">
        {rescuers?.map((rescuer) => (
          <Dialog key={rescuer.id}>
            <DialogTrigger asChild>
              <div className="flex flex-col items-center justify-center gap-2 cursor-pointer group transition-transform hover:scale-105">
                <div className="relative">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 border-2 group-hover:border-probain-blue transition-colors">
                    <AvatarImage
                      src={rescuer.avatar_url || "/placeholder.svg"}
                      alt={`${rescuer.first_name} ${rescuer.last_name}`}
                    />
                    <AvatarFallback className="text-lg">
                      {rescuer.first_name?.[0]}{rescuer.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    {rescuer.is_available_today ? (
                      <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 bg-white rounded-full" />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-sm sm:text-base text-white truncate max-w-[120px]">
                    {rescuer.first_name} {rescuer.last_name}
                  </h3>
                  {rescuer.profile.city_zip && (
                    <p className="text-xs text-white/70 truncate max-w-[120px]">
                      {rescuer.profile.city_zip}
                    </p>
                  )}
                </div>
              </div>
            </DialogTrigger>
            
            <RescuerProfileDialog
              rescuer={rescuer}
              calculateAge={calculateAge}
              formatDate={formatDate}
              handleViewPdf={handleViewPdf}
              onMessage={() => {
                setSelectedRescuer(rescuer);
                setIsMessageDialogOpen(true);
              }}
            />
          </Dialog>
        ))}
      </div>

      </div>

      {selectedRescuer && (
        <SendRescuerMessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => {
            setIsMessageDialogOpen(false);
            setSelectedRescuer(null);
          }}
          rescuer={{
            id: selectedRescuer.id,
            first_name: selectedRescuer.first_name,
            last_name: selectedRescuer.last_name,
          }}
        />
      )}

      <PDFViewerDialog
        isOpen={isPdfViewerOpen}
        onClose={() => setIsPdfViewerOpen(false)}
        documentUrl={currentDocument.url}
        documentTitle={currentDocument.title}
      />
    </div>
  );
};

export default EstablishmentRescuers;
