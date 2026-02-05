import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Search, MapPin, Briefcase, Building2, Loader2, Upload, FileText, X, ExternalLink, Clock, Check, ClipboardList } from "lucide-react";
import DOMPurify from "dompurify";
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
import { useJobApplications, JobApplication } from "@/hooks/use-job-applications";
import { cn } from "@/lib/utils";
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
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"offers" | "applications">("offers");

  // Success popup after application
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [appliedJobInfo, setAppliedJobInfo] = useState<{ title: string; establishment: string } | null>(null);

  // Job Applications tracking
  const {
    applications,
    isLoading: applicationsLoading,
    applyToJob,
    hasApplied,
    applicationCount,
  } = useJobApplications(currentUserId);

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

  const handleViewDetail = useCallback((job: JobPosting) => {
    setSelectedJob(job);
    setIsDetailDialogOpen(true);
  }, []);

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
    setIsDetailDialogOpen(false);
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

      const { data: messageData, error } = await supabase
        .from("internal_messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedJob.establishment_id,
          subject: `Candidature: ${selectedJob.title}`,
          content: messageContent,
          read: false,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'envoyer votre candidature",
          variant: "destructive",
        });
        return;
      }

      // Track the application in job_applications table
      if (messageData) {
        await applyToJob({
          jobPostingId: selectedJob.id,
          messageId: messageData.id,
          cvUrl: cvUrl,
          jobTitle: selectedJob.title,
          jobLocation: selectedJob.location,
          jobContractType: selectedJob.contract_type,
          jobDescription: selectedJob.description,
          jobCreatedAt: selectedJob.created_at,
          establishmentName: selectedJob.establishment_name,
          establishmentAvatar: selectedJob.establishment_avatar,
          establishmentId: selectedJob.establishment_id,
        });
      }

      // Store info for success popup before clearing selectedJob
      setAppliedJobInfo({
        title: selectedJob.title,
        establishment: selectedJob.establishment_name || "l'établissement",
      });
      setIsApplyDialogOpen(false);
      setSelectedJob(null);
      resetCvFile();
      setIsSuccessPopupOpen(true);
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

  // Strip HTML tags for plain-text card previews
  const stripHtml = useCallback((html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }, []);

  return (
    <div className="min-h-screen pb-12 bg-primary-dark md:bg-transparent md:pb-6">
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

      {/* Tab selector */}
      <div className="px-4 pt-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab("offers")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border",
              activeTab === "offers"
                ? "bg-white/15 text-white border-white/20"
                : "bg-white/5 text-white/50 border-transparent hover:bg-white/10 hover:text-white/70"
            )}
          >
            <Briefcase className="h-4 w-4 shrink-0" />
            OFFRES
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border",
              activeTab === "applications"
                ? "bg-white/15 text-white border-white/20"
                : "bg-white/5 text-white/50 border-transparent hover:bg-white/10 hover:text-white/70"
            )}
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            CANDIDATURES
            {applicationCount > 0 && (
              <span className="h-[18px] min-w-[18px] px-1 text-[10px] font-bold bg-cyan-500 text-white rounded-full flex items-center justify-center shrink-0">
                {applicationCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "offers" ? (
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
                      <Card className="group p-5 bg-transparent bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl hover:border-blue-400/50 transition-all duration-300 h-full flex flex-col overflow-hidden relative cursor-pointer" onClick={() => handleViewDetail(job)}>
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
                            {stripHtml(job.description)}
                          </p>
                        </div>
                        <div className="relative flex gap-2">
                          <Button
                            className="flex-1 h-11 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300"
                            onClick={(e) => { e.stopPropagation(); handleViewDetail(job); }}
                          >
                            VOIR L'OFFRE
                          </Button>
                          {hasApplied(job.id) ? (
                            <button
                              disabled
                              className="flex-1 h-11 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 font-semibold text-sm rounded-xl border border-green-500/30 cursor-not-allowed"
                            >
                              <Check className="h-4 w-4" />
                              POSTULE
                            </button>
                          ) : (
                            <Button
                              className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300"
                              onClick={(e) => { e.stopPropagation(); handleApply(job); }}
                            >
                              POSTULER
                            </Button>
                          )}
                        </div>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Desktop: Grille de cartes */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 stagger-children">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="group p-5 bg-transparent bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 rounded-2xl hover:border-blue-400/50 transition-all duration-300 h-full flex flex-col overflow-hidden relative cursor-pointer" onClick={() => handleViewDetail(job)}>
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
                      {stripHtml(job.description)}
                    </p>
                  </div>
                  <div className="relative flex gap-2">
                    <Button
                      className="flex-1 h-11 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300"
                      onClick={(e) => { e.stopPropagation(); handleViewDetail(job); }}
                    >
                      VOIR L'OFFRE
                    </Button>
                    {hasApplied(job.id) ? (
                      <button
                        disabled
                        className="flex-1 h-11 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 font-semibold text-sm rounded-xl border border-green-500/30 cursor-not-allowed"
                      >
                        <Check className="h-4 w-4" />
                        POSTULE
                      </button>
                    ) : (
                      <Button
                        className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 group-hover:-translate-y-0.5"
                        onClick={(e) => { e.stopPropagation(); handleApply(job); }}
                      >
                        POSTULER
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      ) : (
      /* Applications Tab */
      <div className="p-4 md:p-6">
        {applicationsLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
            <p className="text-white/70">Chargement de vos candidatures...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="p-4 bg-white/10 rounded-2xl inline-block mb-4">
              <ClipboardList className="h-10 w-10 text-white/40" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">Aucune candidature</h2>
            <p className="text-white/50 max-w-sm mx-auto mb-6">
              Vous n'avez pas encore postule a une offre. Consultez les offres disponibles pour commencer.
            </p>
            <button
              onClick={() => setActiveTab("offers")}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Voir les offres
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-white/50 mb-4">
              {applications.length} candidature{applications.length > 1 ? "s" : ""} envoyee{applications.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {applications.map((app) => {
                const isJobDeleted = !app.job_title;
                return (
                  <div key={app.id} className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 border border-white/20 shrink-0">
                        <AvatarImage src={app.establishment_avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-probain-blue text-white text-xs font-bold">
                          {app.establishment_name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {isJobDeleted ? "Offre supprimee" : app.job_title}
                        </h3>
                        {app.establishment_name && (
                          <p className="text-sm text-white/60">{app.establishment_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {app.job_contract_type && (
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-md">
                              {formatContractType(app.job_contract_type)}
                            </Badge>
                          )}
                          {app.job_location && (
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {app.job_location}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-white/40">
                            Postule le {formatDateDisplay(app.created_at)}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            Envoyee
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isJobDeleted && (
                      <button
                        onClick={() => {
                          const jobForDetail: JobPosting = {
                            id: app.job_posting_id,
                            title: app.job_title || "",
                            description: app.job_description || "",
                            location: app.job_location || "",
                            contract_type: app.job_contract_type || "",
                            establishment_id: app.establishment_id || null,
                            created_at: app.job_created_at || app.created_at,
                            establishment_name: app.establishment_name,
                            establishment_avatar: app.establishment_avatar,
                          };
                          handleViewDetail(jobForDetail);
                        }}
                        className="mt-3 w-full py-2 text-sm font-medium text-white/70 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
                      >
                        VOIR L'OFFRE
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Job Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#0a1628] border-white/10 text-white [&>button]:text-white/70 [&>button]:hover:text-white">
          {selectedJob && (
            <>
              <DialogHeader className="relative pb-4 border-b border-white/10 mb-4">
                {/* Badge type de contrat */}
                <div className="mb-2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg">
                    {formatContractType(selectedJob.contract_type)}
                  </Badge>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-bold text-white pr-8">{selectedJob.title}</DialogTitle>

                <DialogDescription asChild>
                  <div className="flex flex-col gap-1.5 mt-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                      <MapPin className="h-4 w-4 text-cyan-400" />
                      <span>{selectedJob.location}</span>
                    </div>
                    {selectedJob.establishment_name && (
                      <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                        <Building2 className="h-4 w-4 text-cyan-400" />
                        <span>{selectedJob.establishment_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs italic text-white/40 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>Publie le {formatDateDisplay(selectedJob.created_at)}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              {/* Full description */}
              <div className="mt-2">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Description du poste</h3>
                <div
                  className="prose prose-sm prose-invert max-w-none prose-p:text-white/80 prose-headings:text-white prose-strong:text-white prose-li:text-white/80 prose-ul:text-white/80"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedJob.description) }}
                />
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-col gap-3">
                {hasApplied(selectedJob.id) ? (
                  <div className="w-full h-12 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 font-semibold rounded-xl border border-green-500/30">
                    <Check className="h-5 w-5" />
                    CANDIDATURE ENVOYEE
                  </div>
                ) : (
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300"
                    onClick={() => handleApply(selectedJob)}
                  >
                    POSTULER A CETTE OFFRE
                  </Button>
                )}
                {navigator.share && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: `Offre d'emploi: ${selectedJob.title}`,
                          text: `${selectedJob.title} - ${selectedJob.location} - ${formatContractType(selectedJob.contract_type)}`,
                          url: window.location.href,
                        });
                      } catch { /* share cancelled */ }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-white/20 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Partager cette offre
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto bg-[#0a1628] border-white/10 text-white [&>button]:text-white/70 [&>button]:hover:text-white">
          <DialogHeader className="pb-3 border-b border-white/10">
            <DialogTitle className="text-lg font-bold text-white">Postuler a cette offre</DialogTitle>
            <DialogDescription className="text-white/50">
              {selectedJob && (
                <>
                  <span className="font-semibold text-white/70">{selectedJob.title}</span>
                  {selectedJob.establishment_name && (
                    <span className="text-white/50"> - {selectedJob.establishment_name}</span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* CV Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block text-white/70">
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
                    className="relative border-2 border-dashed border-white/20 rounded-xl p-4 hover:border-cyan-400/50 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-2 text-white/50">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm text-center">
                        {isMobile ? "Touchez pour ajouter votre CV" : "Cliquez pour ajouter votre CV"}
                      </span>
                      <span className="text-xs text-white/30">PDF uniquement, max 20MB</span>
                    </div>
                  </div>
                ) : cvState.status === 'uploading' ? (
                  <div className="border-2 border-yellow-400/50 bg-yellow-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 text-yellow-400 animate-spin" />
                      <span className="text-sm text-yellow-300">Upload en cours...</span>
                    </div>
                  </div>
                ) : cvState.status === 'error' ? (
                  <div className="border-2 border-red-400/50 bg-red-500/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-red-400">
                        <X className="h-5 w-5" />
                        <span className="text-sm">{cvState.error || "Erreur lors de la sélection"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetCvFile();
                          if (cvInputRef.current) cvInputRef.current.value = '';
                        }}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-green-400/50 bg-green-500/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-300">
                            {cvState.file?.name || "CV sélectionné"}
                          </p>
                          {cvState.file && (
                            <p className="text-xs text-green-400/70">
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
                        className="p-1 text-white/40 hover:text-red-400 transition-colors"
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
              <label className="text-sm font-medium mb-2 block text-white/70">
                Message de candidature (optionnel)
              </label>
              <Textarea
                placeholder="Présentez-vous et expliquez pourquoi vous êtes intéressé par ce poste..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={5}
                className="bg-white/10 border-white/20 rounded-xl text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50"
              />
            </div>

            <p className="text-xs text-white/40">
              Votre candidature sera envoyee directement a l'etablissement via la messagerie interne.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setIsApplyDialogOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-white/20 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <Button
              onClick={submitApplication}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
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

      {/* Success Popup after application */}
      <Dialog open={isSuccessPopupOpen} onOpenChange={setIsSuccessPopupOpen}>
        <DialogContent className="sm:max-w-[440px] w-[92vw] bg-[#0a1628] border-white/10 text-white [&>button]:text-white/70 [&>button]:hover:text-white">
          <div className="flex flex-col items-center text-center py-4 space-y-5">
            {/* Success icon */}
            <div className="p-4 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-400/20">
              <Check className="h-8 w-8 text-green-400" />
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Candidature envoyée !</h2>
              {appliedJobInfo && (
                <p className="text-sm text-white/70 leading-relaxed px-2">
                  Tu viens de postuler pour l'offre <span className="font-semibold text-cyan-400">{appliedJobInfo.title}</span> auprès de <span className="font-semibold text-cyan-400">{appliedJobInfo.establishment}</span>.
                </p>
              )}
              <p className="text-sm text-white/70 leading-relaxed px-2">
                N'oublie pas de mettre à jour ton profil, c'est ta carte de visite auprès des établissements.
              </p>
              <p className="text-sm text-white/50 italic px-2">
                Nous te souhaitons le meilleur pour ta carrière professionnelle.
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full pt-2">
              <Button
                onClick={() => {
                  setIsSuccessPopupOpen(false);
                  navigate("/profile");
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20"
              >
                Voir mon profil
              </Button>
              <button
                onClick={() => setIsSuccessPopupOpen(false)}
                className="w-full px-4 py-2 text-sm font-medium rounded-xl border border-white/20 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white transition-colors"
              >
                Continuer à chercher
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
