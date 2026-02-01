import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Search, MapPin, Briefcase, Building2, Loader2, Upload, FileText, X } from "lucide-react";
import { CalendarModal } from "@/components/shared/CalendarModal";
import { useCalendarModal } from "@/hooks/use-calendar-modal";
import { SWISS_CANTONS, isCityInCanton } from "@/utils/swissCantons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { safeGetUser } from "@/utils/asyncHelpers";
import { useDocumentUpload } from "@/hooks/use-document-upload";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  establishment_id: string | null;
  created_at: string;
  establishment_name?: string;
  establishment_avatar?: string;
}

const Jobs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const startCalendar = useCalendarModal({
    initialDate: startDate,
    onDateChange: setStartDate,
  });
  const endCalendar = useCalendarModal({
    initialDate: endDate,
    onDateChange: setEndDate,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // CV Upload
  const cvInputRef = useRef<HTMLInputElement>(null);
  const { fileState: cvState, selectFile: selectCvFile, resetFile: resetCvFile, uploadFile: uploadCvFile } = useDocumentUpload();

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-CH", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await safeGetUser(supabase, 5000);
        setCurrentUserId(user?.id || null);

        // Récupérer les offres d'emploi
        const { data: jobsData, error: jobsError } = await supabase
          .from("job_postings")
          .select("*")
          .order("created_at", { ascending: false });

        if (jobsError) {
          toast({
            title: "Erreur",
            description: "Impossible de charger les offres d'emploi",
            variant: "destructive",
          });
          return;
        }

        // Récupérer les noms des établissements
        const establishmentIds = [...new Set(jobsData?.map(j => j.establishment_id).filter(Boolean))];

        let establishmentData: Record<string, { name: string; avatar: string }> = {};
        if (establishmentIds.length > 0) {
          const { data: establishments } = await supabase
            .from("establishment_profiles")
            .select("id, organization_name, avatar_url")
            .in("id", establishmentIds);

          if (establishments) {
            establishmentData = establishments.reduce((acc, est) => {
              acc[est.id] = { name: est.organization_name, avatar: est.avatar_url };
              return acc;
            }, {} as Record<string, { name: string; avatar: string }>);
          }
        }

        // Combiner les données
        const jobsWithNames: JobPosting[] = (jobsData || []).map(job => ({
          ...job,
          establishment_name: job.establishment_id ? establishmentData[job.establishment_id]?.name : undefined,
          establishment_avatar: job.establishment_id ? establishmentData[job.establishment_id]?.avatar : undefined
        }));

        setJobs(jobsWithNames);
        setFilteredJobs(jobsWithNames);
      } catch {
        // Erreur silencieuse - le toast est déjà affiché plus haut si nécessaire
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [toast]);

  const handleSearch = useCallback(() => {
    let filtered = [...jobs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
      );
    }

    if (locationSearch && locationSearch !== "all") {
      filtered = filtered.filter(job =>
        isCityInCanton(job.location, locationSearch)
      );
    }

    if (startDate) {
      filtered = filtered.filter(job =>
        new Date(job.created_at) >= startDate
      );
    }
    if (endDate) {
      filtered = filtered.filter(job =>
        new Date(job.created_at) <= endDate
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationSearch, startDate, endDate]);

  const handleApply = useCallback((job: JobPosting) => {
    if (!currentUserId) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour postuler",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setSelectedJob(job);
    setApplicationMessage("");
    resetCvFile();
    if (cvInputRef.current) {
      cvInputRef.current.value = '';
    }
    setIsApplyDialogOpen(true);
  }, [currentUserId, toast, navigate, resetCvFile]);

  const submitApplication = async () => {
    if (!selectedJob || !currentUserId || !selectedJob.establishment_id) return;

    setIsSubmitting(true);
    try {
      // Upload CV if selected
      let cvUrl: string | null = null;
      if (cvState.status === 'selected' && cvState.file) {
        cvUrl = await uploadCvFile();
        if (!cvUrl) {
          toast({
            title: "Erreur",
            description: "Impossible d'envoyer le CV. Veuillez réessayer.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Build message content with CV link if available
      let messageContent = applicationMessage || `Bonjour,\n\nJe souhaite postuler à l'offre "${selectedJob.title}".\n\nCordialement`;

      if (cvUrl) {
        messageContent += `\n\n📎 CV joint: ${cvUrl}`;
      }

      const { error } = await supabase
        .from("internal_messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedJob.establishment_id,
          subject: `Candidature: ${selectedJob.title}`,
          content: messageContent,
          read: false,
        });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer votre candidature",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Candidature envoyée",
        description: cvUrl
          ? "Votre candidature et votre CV ont été envoyés à l'établissement"
          : "Votre candidature a été envoyée à l'établissement",
      });
      setIsApplyDialogOpen(false);
      setSelectedJob(null);
      resetCvFile();
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatContractType = useCallback((type: string) => {
    const types: Record<string, string> = {
      CDI: "CDI",
      CDD: "CDD",
      Stage: "Stage",
      Alternance: "Alternance",
      Saisonnier: "Saisonnier",
    };
    return types[type] || type;
  }, []);

  return (
    <div className="min-h-screen bg-primary-dark md:bg-transparent">
      <div className="relative bg-gradient-to-br from-primary via-probain-blue to-primary-dark px-4 py-3 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-xl border border-white/10">
              <Briefcase className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">OFFRES D'EMPLOI</h1>
              <p className="text-[11px] text-white/40">Trouvez votre prochain poste</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">

        <Card className="max-w-3xl mx-auto mb-8 p-6 md:p-8 bg-transparent bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
          <div className="space-y-5">
            <Input
              placeholder="Poste recherché..."
              className="w-full bg-white/95 backdrop-blur-sm border-0 h-12 rounded-xl text-base placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="flex flex-col md:flex-row gap-4">
              <Select value={locationSearch} onValueChange={setLocationSearch}>
                <SelectTrigger className="w-full md:flex-1 bg-white">
                  <SelectValue placeholder="Tous les cantons" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">Tous les cantons</SelectItem>
                  {SWISS_CANTONS.map((canton) => (
                    <SelectItem key={canton.id} value={canton.id}>
                      {canton.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-white/80">Période :</p>
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => startCalendar.open(startDate)}
                className="w-full md:w-[200px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? formatDateShort(startDate) : <span>Date de début</span>}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => endCalendar.open(endDate)}
                className="w-full md:w-[200px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? formatDateShort(endDate) : <span>Date de fin</span>}
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
              className="w-full h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5" />
              Rechercher
            </Button>
          </div>
        </Card>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
            <p className="text-white/70">Chargement des offres...</p>
          </div>
        )}

        {!isLoading && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">Aucune offre disponible</h2>
            <p className="text-white/60">
              {jobs.length === 0
                ? "Aucune offre d'emploi n'a été publiée pour le moment."
                : "Aucune offre ne correspond à vos critères de recherche."}
            </p>
          </div>
        )}

        {!isLoading && filteredJobs.length > 0 && (
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-xl font-semibold mb-6 text-white">
              {filteredJobs.length} offre{filteredJobs.length > 1 ? "s" : ""} disponible{filteredJobs.length > 1 ? "s" : ""}
            </h2>

            {/* Mobile: Carousel avec swipe */}
            <div className="md:hidden">
              <Carousel className="w-full" opts={{ align: "start", slidesToScroll: 1 }}>
                <CarouselContent className="-ml-2">
                  {filteredJobs.map((job) => (
                    <CarouselItem key={job.id} className="pl-2 basis-[85%] sm:basis-[70%]">
                      <Card className="group p-5 bg-transparent bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl hover:border-blue-400/50 transition-all duration-300 h-full flex flex-col overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        <div className="relative flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-xl text-white leading-tight pr-3">{job.title}</h3>
                            <Badge className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-3 py-1 rounded-lg">
                              {formatContractType(job.contract_type)}
                            </Badge>
                          </div>
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-white/90 text-sm">
                              <div className="p-1.5 bg-white/10 rounded-lg">
                                <MapPin className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{job.location}</span>
                            </div>
                            {job.establishment_name && (
                              <div className="flex items-center gap-3 text-white/90 text-sm">
                                <Avatar className="h-9 w-9 border-2 border-blue-400/50 shadow-lg">
                                  <AvatarImage src={job.establishment_avatar} alt={job.establishment_name} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-probain-blue text-white text-xs font-bold">
                                    {job.establishment_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{job.establishment_name}</span>
                              </div>
                            )}
                            <p className="text-white/50 text-xs font-medium">
                              Publié le {formatDateDisplay(job.created_at)}
                            </p>
                          </div>
                          <p className="text-white/70 text-sm line-clamp-3 mb-4 leading-relaxed">
                            {job.description}
                          </p>
                        </div>
                        <Button
                          className="relative w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 group-hover:-translate-y-0.5"
                          onClick={() => handleApply(job)}
                        >
                          POSTULER
                        </Button>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Desktop: Grille de cartes */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="group p-5 bg-transparent bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl hover:border-blue-400/50 transition-all duration-300 h-full flex flex-col overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <div className="relative flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-xl text-white leading-tight pr-3">{job.title}</h3>
                      <Badge className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-3 py-1 rounded-lg">
                        {formatContractType(job.contract_type)}
                      </Badge>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <div className="p-1.5 bg-white/10 rounded-lg">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{job.location}</span>
                      </div>
                      {job.establishment_name && (
                        <div className="flex items-center gap-3 text-white/90 text-sm">
                          <Avatar className="h-9 w-9 border-2 border-blue-400/50 shadow-lg">
                            <AvatarImage src={job.establishment_avatar} alt={job.establishment_name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-probain-blue text-white text-xs font-bold">
                              {job.establishment_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{job.establishment_name}</span>
                        </div>
                      )}
                      <p className="text-white/50 text-xs font-medium">
                        Publié le {formatDateDisplay(job.created_at)}
                      </p>
                    </div>
                    <p className="text-white/70 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  <Button
                    className="relative w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 group-hover:-translate-y-0.5"
                    onClick={() => handleApply(job)}
                  >
                    POSTULER
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Postuler à cette offre</DialogTitle>
            <DialogDescription>
              {selectedJob && (
                <>
                  <span className="font-semibold">{selectedJob.title}</span>
                  {selectedJob.establishment_name && (
                    <span> - {selectedJob.establishment_name}</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* CV Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                CV (PDF, optionnel)
              </label>
              <div className="relative">
                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) selectCvFile(file);
                  }}
                  className={isMobile && cvState.status === 'idle'
                    ? "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    : "hidden"
                  }
                  disabled={isSubmitting || cvState.status === 'uploading'}
                />

                {cvState.status === 'idle' ? (
                  <div
                    onClick={() => !isMobile && cvInputRef.current?.click()}
                    className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm text-center">
                        {isMobile ? "Touchez pour ajouter votre CV" : "Cliquez pour ajouter votre CV"}
                      </span>
                      <span className="text-xs text-gray-400">PDF uniquement, max 20MB</span>
                    </div>
                  </div>
                ) : cvState.status === 'uploading' ? (
                  <div className="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />
                      <span className="text-sm text-yellow-700">Upload en cours...</span>
                    </div>
                  </div>
                ) : cvState.status === 'error' ? (
                  <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-red-700">
                        <X className="h-5 w-5" />
                        <span className="text-sm">{cvState.error || "Erreur lors de la sélection"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetCvFile();
                          if (cvInputRef.current) cvInputRef.current.value = '';
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-green-400 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {cvState.file?.name || "CV sélectionné"}
                          </p>
                          {cvState.file && (
                            <p className="text-xs text-green-600">
                              {(cvState.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetCvFile();
                          if (cvInputRef.current) cvInputRef.current.value = '';
                        }}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        disabled={isSubmitting}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Message de candidature (optionnel)
              </label>
              <Textarea
                placeholder="Présentez-vous et expliquez pourquoi vous êtes intéressé par ce poste..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={5}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Votre candidature sera envoyée directement à l'établissement via la messagerie interne.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApplyDialogOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={submitApplication}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer ma candidature"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
