
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { ExperienceForm, experienceFormSchema } from "./forms/ExperienceForm";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, memo } from "react";
import { PDFViewerDialog } from "./PDFViewerDialog";
import * as z from "zod";

interface ExperienceCardProps {
  experience: {
    id: string;
    title: string;
    location: string;
    start_date: string;
    end_date?: string;
    document_url?: string;
    contract_type: string;
  };
  onUpdate: (id: string, values: z.infer<typeof experienceFormSchema>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ExperienceCard = memo(function ExperienceCard({ experience, onUpdate, onDelete }: ExperienceCardProps) {
  const isMobile = useIsMobile();
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const editForm = useForm<z.infer<typeof experienceFormSchema>>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      title: experience.title,
      location: experience.location,
      startDate: new Date(experience.start_date),
      endDate: experience.end_date ? new Date(experience.end_date) : undefined,
      contractType: experience.contract_type as 'CDI' | 'CDD',
    },
  });

  const formatDate = (date: string) => {
    return format(new Date(date), isMobile ? 'MM/yy' : 'MMM yyyy', { locale: fr });
  };

  // Couleur selon le type de contrat
  const getContractColor = (type: string) => {
    switch (type) {
      case 'CDI': return 'from-emerald-500 to-emerald-600';
      case 'CDD': return 'from-blue-500 to-blue-600';
      case 'Stage': return 'from-purple-500 to-purple-600';
      case 'Alternance': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getContractBg = (type: string) => {
    switch (type) {
      case 'CDI': return 'bg-emerald-500/10 text-emerald-700';
      case 'CDD': return 'bg-blue-500/10 text-blue-700';
      case 'Stage': return 'bg-purple-500/10 text-purple-700';
      case 'Alternance': return 'bg-orange-500/10 text-orange-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  return (
    <div className="relative min-h-[200px] w-full sm:w-[320px] max-w-[95vw] sm:max-w-none">
      {/* Carte principale cliquable */}
      <div
        className="min-h-full w-full rounded-2xl bg-white shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] flex overflow-hidden relative cursor-pointer"
        onClick={() => setIsEditSheetOpen(true)}
      >
        {/* Boutons FIXES - position absolue par rapport à la CARTE */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {experience.document_url && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPdfViewerOpen(true);
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${getContractColor(experience.contract_type)} shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation`}
              aria-label="Voir le document"
            >
              <FileText className="h-5 w-5 text-white" />
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 touch-manipulation"
            aria-label="Modifier l'expérience"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditSheetOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Sheet d'édition contrôlé */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto" closeButtonColor="black" onClose={() => setIsEditSheetOpen(false)}>
            <SheetHeader>
              <SheetTitle>Modifier l'expérience</SheetTitle>
            </SheetHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(async (values) => {
                setIsSubmitting(true);
                try {
                  await onUpdate(experience.id, values);
                  setIsEditSheetOpen(false);
                } finally {
                  setIsSubmitting(false);
                }
              })} className="space-y-6 mt-4 pb-20">
                <ExperienceForm
                  form={editForm}
                  onDelete={() => onDelete(experience.id)}
                  isEdit
                />
                <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    "Modifier l'expérience"
                  )}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>

        {/* Barre latérale colorée */}
        <div className={`w-2 rounded-l-2xl bg-gradient-to-b ${getContractColor(experience.contract_type)} flex-shrink-0`} />

        {/* Contenu */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Header avec badge - avec marge pour ne pas chevaucher les boutons */}
          <div className="mb-3 mr-14">
            <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-lg ${getContractBg(experience.contract_type)}`}>
              {experience.contract_type}
            </span>
          </div>

          {/* Titre et lieu */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-snug mb-1">
              {experience.title}
            </h3>
            <p className="text-sm text-gray-500 font-medium line-clamp-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
              {experience.location}
            </p>
          </div>

          {/* Footer avec dates */}
          <div className="pt-3 mt-auto border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Période</span>
              <span className="text-sm font-semibold text-gray-700">
                {formatDate(experience.start_date)}
                {experience.end_date
                  ? ` → ${formatDate(experience.end_date)}`
                  : <span className="text-emerald-600"> → En cours</span>
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pour la visualisation du PDF */}
      {experience.document_url && (
        <PDFViewerDialog
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
          documentUrl={experience.document_url}
          documentTitle={`${experience.title} - Document`}
        />
      )}
    </div>
  );
});
