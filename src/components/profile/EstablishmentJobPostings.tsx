
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { JobPostingsForm } from "./forms/JobPostingsForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobPostingsFormSchema } from "./forms/JobPostingsForm";
import { Form } from "@/components/ui/form";
import { useJobPostings, JobPosting } from "@/hooks/use-job-postings";
import { useState } from "react";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { JobPostingCard } from "./JobPostingCard";
import { JobPostingDialog } from "./JobPostingDialog";
import { DecorativeOrbs } from "@/components/shared/DecorativeOrbs";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const JobPostings = ({ establishmentId }: { establishmentId: string | null }) => {
  const { jobPostings, addJobPosting, updateJobPosting, deleteJobPosting } = useJobPostings(establishmentId);
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof jobPostingsFormSchema>>({
    resolver: zodResolver(jobPostingsFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      contractType: "CDI",
    },
  });

  const handleAdd = async (values: z.infer<typeof jobPostingsFormSchema>) => {
    if (!establishmentId) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer votre profil établissement",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addJobPosting(establishmentId, values);
      toast({
        title: "Succès",
        description: "Annonce ajoutée avec succès",
      });
      form.reset({
        title: "",
        description: "",
        location: "",
        contractType: "CDI",
      });
      setIsSheetOpen(false);
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'annonce",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (posting: JobPosting) => {
    form.reset({
      title: posting.title,
      description: posting.description,
      location: posting.location,
      contractType: posting.contract_type,
    });
    setEditingId(posting.id);
    setIsSheetOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof jobPostingsFormSchema>) => {
    if (editingId) {
      setIsSubmitting(true);
      try {
        await updateJobPosting(editingId, values);
        toast({
          title: "Succès",
          description: "Annonce mise à jour avec succès",
        });
        setEditingId(null);
        setIsSheetOpen(false);
      } catch {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la mise à jour de l'annonce",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await handleAdd(values);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteJobPosting(id);
      toast({
        title: "Succès",
        description: "Annonce supprimée avec succès",
      });
      setDeleteConfirmId(null);
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'annonce",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openPostingDetails = (posting: JobPosting) => {
    setSelectedPosting(posting);
    setIsDialogOpen(true);
  };

  const handleOpenSheet = () => {
    setEditingId(null);
    form.reset({
      title: "",
      description: "",
      location: "",
      contractType: "CDI",
    });
    setIsSheetOpen(true);
  };

  return (
    <div className="px-4 py-6 md:py-8 md:px-0 max-w-5xl md:max-w-none mx-auto">
      {/* Header avec titre + bouton rond (identique aux carousels formation/experience) */}
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white w-full text-left uppercase">ANNONCES</h2>
        <button
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-yellow-500/40 active:scale-95"
          onClick={handleOpenSheet}
          aria-label="Ajouter une annonce"
        >
          <Plus className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-90" />
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* Sheet d'ajout/edition - style dark theme */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingId(null);
          form.reset({
            title: "",
            description: "",
            location: "",
            contractType: "CDI",
          });
        }
        setIsSheetOpen(open);
      }}>
        <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto bg-[#0a1628] p-0" closeButtonColor="white" onClose={() => { setEditingId(null); form.reset({ title: "", description: "", location: "", contractType: "CDI" }); setIsSheetOpen(false); }} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <DecorativeOrbs variant="sheet" />

          {/* Header gradient */}
          <SheetHeader className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary-light px-6 py-4 shadow-lg">
            <SheetTitle className="text-lg font-semibold text-white">
              {editingId ? "Modifier l'annonce" : "Ajouter une annonce"}
            </SheetTitle>
            <p className="text-sm text-white/70">
              {editingId ? "Modifiez les détails de l'annonce" : "Ajoutez une nouvelle annonce à votre établissement"}
            </p>
          </SheetHeader>

          {/* Contenu */}
          <div className="relative px-6 py-6 pb-32 md:pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10">
                  <JobPostingsForm form={form} darkMode />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingId ? "Mise à jour..." : "Ajout..."}
                    </>
                  ) : (
                    editingId ? "Mettre à jour l'annonce" : "Ajouter l'annonce"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {jobPostings.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/60">Aucune annonce ajoutée</p>
        </div>
      ) : (
        <>
          {/* Mobile: Carousel avec swipe (comme formations/experiences) */}
          <div className="md:hidden">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                containScroll: "trimSnaps"
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {jobPostings.map((jobPosting) => (
                  <CarouselItem key={jobPosting.id} className="pl-2 basis-[95%]">
                    <JobPostingCard
                      id={jobPosting.id}
                      title={jobPosting.title}
                      description={jobPosting.description}
                      location={jobPosting.location}
                      contractType={jobPosting.contract_type}
                      createdAt={jobPosting.created_at}
                      onOpenDetails={() => openPostingDetails(jobPosting)}
                      onEdit={() => openEditForm(jobPosting)}
                      onDelete={() => confirmDelete(jobPosting.id)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop: Grille de cartes (comme formations/experiences) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {jobPostings.map((jobPosting) => (
              <JobPostingCard
                key={jobPosting.id}
                id={jobPosting.id}
                title={jobPosting.title}
                description={jobPosting.description}
                location={jobPosting.location}
                contractType={jobPosting.contract_type}
                createdAt={jobPosting.created_at}
                onOpenDetails={() => openPostingDetails(jobPosting)}
                onEdit={() => openEditForm(jobPosting)}
                onDelete={() => confirmDelete(jobPosting.id)}
              />
            ))}
          </div>
        </>
      )}

      {selectedPosting && (
        <JobPostingDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title={selectedPosting.title}
          description={selectedPosting.description}
          location={selectedPosting.location}
          contractType={selectedPosting.contract_type}
          createdAt={selectedPosting.created_at}
        />
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement l'annonce.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteConfirmId) handleDelete(deleteConfirmId);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
