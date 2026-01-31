
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

  // Data fetching is now handled by useQuery inside the hook

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

  return (
    <div className="py-6 md:py-8">
      <div className="flex justify-end items-center mb-4 md:mb-6">
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
          <SheetTrigger asChild>
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-primary font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 px-4 md:px-6"
              aria-label="Ajouter une annonce"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden md:inline">Nouvelle annonce</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="md:max-w-xl">
            <SheetHeader>
              <SheetTitle>{editingId ? "Modifier l'annonce" : "Ajouter une annonce"}</SheetTitle>
              <SheetDescription>
                {editingId ? "Modifiez les détails de l'annonce" : "Ajoutez une nouvelle annonce à votre établissement"}
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mt-4">
                <JobPostingsForm form={form} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingId ? "Mise à jour..." : "Ajout..."}
                    </>
                  ) : (
                    editingId ? "Mettre à jour" : "Ajouter l'annonce"
                  )}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {jobPostings.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/60">Aucune annonce ajoutée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {jobPostings.map((jobPosting) => (
            <JobPostingCard
              key={jobPosting.id}
              id={jobPosting.id}
              title={jobPosting.title}
              location={jobPosting.location}
              contractType={jobPosting.contract_type}
              createdAt={jobPosting.created_at}
              onOpenDetails={() => openPostingDetails(jobPosting)}
              onEdit={() => openEditForm(jobPosting)}
              onDelete={() => confirmDelete(jobPosting.id)}
            />
          ))}
        </div>
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
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
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
