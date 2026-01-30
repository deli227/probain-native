import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
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
import { FileText, Loader2, Mail, MapPin, Search, CheckCircle, XCircle, Eye, Phone, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types pour les données rescuer
interface RescuerFormation {
  id: string;
  user_id: string;
  title: string;
  organization: string;
  start_date: string;
  end_date: string | null;
  document_url: string | null;
}

interface RescuerExperience {
  id: string;
  user_id: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string | null;
  contract_type: string | null;
}

interface RescuerAvailability {
  id: string;
  user_id: string;
  date: string;
  is_available: boolean;
}

interface RescuerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  canton: string | null;
  phone: string | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    birth_date: string | null;
  };
  availability_status: boolean | null;
  is_always_available: boolean | null;
  user_formations: RescuerFormation[];
  user_experiences: RescuerExperience[];
  user_availabilities: RescuerAvailability[];
  is_available_today: boolean;
}

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
    "Brevet Plus Pool",
    "Brevet Pro Pool",
    "Brevet Base Pool",
    "Module BLS-AED",
    "Module Lac",
    "Module Rivière",
    "Brevet Expert Pool",
    "Module Pool Plus",
    "Module Pool Pro",
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
      let rescuerQuery = supabase
        .from("rescuer_profiles")
        .select(`
          *,
          profile:profiles!inner(*)
        `);

      // On ne filtre plus par availability_status ici car on va le calculer après
      // en fonction des dates spécifiques

      if (filters.location) {
        rescuerQuery = rescuerQuery.contains('preferred_locations', [filters.location]);
      }

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

      if (filters.certifications) {
        filteredRescuers = filteredRescuers.filter(rescuer =>
          rescuer.user_formations &&
          rescuer.user_formations.some((formation: RescuerFormation) =>
            formation.title.toLowerCase().includes(filters.certifications.toLowerCase())
          )
        );
      }

      // Filtre par disponibilité (basé sur la disponibilité calculée aujourd'hui)
      if (filters.availability) {
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
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark md:bg-transparent pb-20 md:pb-6">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <Input
            placeholder="Nom / Prénom"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="h-9 text-xs rounded-full"
          />

          <Select
            value={filters.certifications}
            onValueChange={(value) => setFilters({ ...filters, certifications: value })}
          >
            <SelectTrigger className="h-9 text-xs rounded-full">
              <SelectValue placeholder="Brevets" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {certificationTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Domicile"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="h-9 text-xs rounded-full"
          />

          <Select
            value={filters.availability}
            onValueChange={(value) => setFilters({ ...filters, availability: value })}
          >
            <SelectTrigger className="h-9 text-xs rounded-full">
              <SelectValue placeholder="Disponibilité" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="unavailable">Non disponible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
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
                  <h3 className="font-medium text-sm sm:text-base truncate max-w-[120px]">
                    {rescuer.first_name} {rescuer.last_name}
                  </h3>
                  {rescuer.profile.city_zip && (
                    <p className="text-xs text-gray-500 truncate max-w-[120px]">
                      {rescuer.profile.city_zip}
                    </p>
                  )}
                </div>
              </div>
            </DialogTrigger>
            
            <DialogContent className="w-[95vw] max-w-4xl mx-auto max-h-[90vh] overflow-y-auto rounded-2xl">
              <div className="relative -mx-6 -mt-6 mb-6 px-6 pt-8 pb-6 bg-muted/30 rounded-t-2xl border-b">
                <DialogHeader>
                  <DialogTitle>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white shadow-lg">
                            <AvatarImage
                              src={rescuer.avatar_url || "/placeholder.svg"}
                              alt={`${rescuer.first_name} ${rescuer.last_name}`}
                            />
                            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                              {rescuer.first_name?.[0]}{rescuer.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md">
                            {rescuer.is_available_today ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                            {rescuer.first_name} {rescuer.last_name}
                          </h2>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {rescuer.is_available_today ? (
                              <Badge className="bg-green-500 text-white rounded-full px-3 py-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Disponible
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500 text-white rounded-full px-3 py-1">
                                <XCircle className="h-3 w-3 mr-1" />
                                Non disponible
                              </Badge>
                            )}

                            {rescuer.profile.birth_date && (
                              <Badge variant="secondary" className="rounded-full px-3 py-1">
                                {calculateAge(rescuer.profile.birth_date)} ans
                              </Badge>
                            )}

                            {rescuer.years_of_experience && (
                              <Badge variant="secondary" className="rounded-full px-3 py-1">
                                {rescuer.years_of_experience} ans d'expérience
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {rescuer.profile.canton && (
                              <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{rescuer.profile.canton}</span>
                              </div>
                            )}
                            {rescuer.profile.city_zip && (
                              <div className="bg-muted px-3 py-1.5 rounded-full">
                                {rescuer.profile.city_zip}
                              </div>
                            )}
                            {rescuer.phone_visible && rescuer.profile.phone && (
                              <a
                                href={`tel:${rescuer.profile.phone}`}
                                className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-4 w-4" />
                                <span>{rescuer.profile.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full sm:w-auto sm:self-start rounded-full h-12"
                        onClick={() => {
                          setSelectedRescuer(rescuer);
                          setIsMessageDialogOpen(true);
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer un message
                      </Button>
                    </div>
                  </DialogTitle>
                </DialogHeader>
              </div>
              
              <div className="px-2">
                {rescuer.profile.biography && (
                  <div className="mb-6 bg-muted/50 p-6 rounded-2xl border">
                    <h4 className="font-semibold text-lg mb-3">
                      Biographie
                    </h4>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {rescuer.profile.biography}
                    </p>
                  </div>
                )}

                {rescuer.availability_status && !rescuer.is_always_available && rescuer.user_availabilities && rescuer.user_availabilities.length > 0 && (
                  <div className="mb-6 bg-green-50 p-6 rounded-2xl border border-green-200">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Disponibilités spécifiques
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {rescuer.user_availabilities.map((avail: RescuerAvailability) => (
                        <span
                          key={avail.id}
                          className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full border border-green-300"
                        >
                          {format(new Date(avail.date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rescuer.availability_status && rescuer.is_always_available && (
                  <div className="mb-6 bg-green-50 p-6 rounded-2xl border border-green-200">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Disponible tout le temps
                    </h4>
                  </div>
                )}

                <Tabs defaultValue="formations" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 p-1 rounded-2xl h-12">
                    <TabsTrigger
                      value="formations"
                      className="rounded-xl transition-all"
                    >
                      Formations
                    </TabsTrigger>
                    <TabsTrigger
                      value="experiences"
                      className="rounded-xl transition-all"
                    >
                      Expériences
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="formations" className="mt-6">
                    <div className="space-y-4">
                      {rescuer.user_formations?.map((formation: RescuerFormation) => (
                        <Card key={formation.id} className="p-5 rounded-2xl hover:shadow-md transition-all">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg mb-1">{formation.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{formation.organization}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="rounded-full text-xs">
                                  {formatDate(formation.start_date)}
                                  {formation.end_date && ` - ${formatDate(formation.end_date)}`}
                                </Badge>
                              </div>
                            </div>
                            {formation.document_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full shrink-0"
                                onClick={() => handleViewPdf(formation.document_url, formation.title)}
                              >
                                <Eye className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                      {(!rescuer.user_formations || rescuer.user_formations.length === 0) && (
                        <div className="text-center py-12 bg-muted/50 rounded-2xl">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground italic">Aucune formation disponible</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="experiences" className="mt-6">
                    <div className="space-y-4">
                      {rescuer.user_experiences?.map((experience: RescuerExperience) => (
                        <Card key={experience.id} className="p-5 rounded-2xl hover:shadow-md transition-all">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-lg mb-1">{experience.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {experience.location}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="rounded-full text-xs">
                                  {formatDate(experience.start_date)}
                                  {experience.end_date && ` - ${formatDate(experience.end_date)}`}
                                </Badge>
                                {experience.contract_type && (
                                  <Badge variant="outline" className="rounded-full text-xs">
                                    {experience.contract_type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {experience.document_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full shrink-0"
                                onClick={() => handleViewPdf(experience.document_url, experience.title)}
                              >
                                <Eye className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                      {(!rescuer.user_experiences || rescuer.user_experiences.length === 0) && (
                        <div className="text-center py-12 bg-muted/50 rounded-2xl">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground italic">Aucune expérience disponible</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
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
