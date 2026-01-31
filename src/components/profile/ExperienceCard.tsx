
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
import { useState, useEffect, memo } from "react";
import { PDFViewerDialog } from "./PDFViewerDialog";
import { DecorativeOrbs } from "@/components/shared/DecorativeOrbs";
import * as z from "zod";

interface ExperienceCardProps {
  experience: {
    id: string;
    title: string;
    location: string;
    start_date: string;
    end_date?: string | null;
    document_url?: string | null;
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
  
  const [docRemoved, setDocRemoved] = useState(false);
  const existingDocUrl = docRemoved ? '' : (experience.document_url || '');

  // Reset le flag quand les données reviennent de la BDD (après sauvegarde)
  useEffect(() => {
    setDocRemoved(false);
  }, [experience.document_url]);

  const editForm = useForm<z.infer<typeof experienceFormSchema>>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      title: experience.title,
      location: experience.location,
      startDate: new Date(experience.start_date),
      endDate: experience.end_date ? new Date(experience.end_date) : undefined,
      contractType: experience.contract_type as 'CDI' | 'CDD',
      documentUrl: experience.document_url || undefined,
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
        className="min-h-full w-full rounded-2xl bg-white md:bg-white/10 md:backdrop-blur-xl shadow-xl border border-gray-100 md:border-white/10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] flex overflow-hidden relative cursor-pointer"
        onClick={() => setIsEditSheetOpen(true)}
      >
        {/* Boutons FIXES - position absolue par rapport à la CARTE */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {existingDocUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (isMobile) {
                  window.open(existingDocUrl, '_blank', 'noopener,noreferrer');
                } else {
                  setIsPdfViewerOpen(true);
                }
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
            className="h-10 w-10 rounded-xl bg-gray-100 md:bg-white/10 hover:bg-gray-200 md:hover:bg-white/20 transition-all duration-200 touch-manipulation"
            aria-label="Modifier l'expérience"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditSheetOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-gray-600 md:text-white/70" />
          </Button>
        </div>

        {/* Sheet d'édition contrôlé */}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent className="w-full sm:max-w-md md:max-w-xl overflow-y-auto bg-[#0a1628] p-0" closeButtonColor="white" onClose={() => setIsEditSheetOpen(false)} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <DecorativeOrbs variant="sheet" />

            {/* Header gradient */}
            <SheetHeader className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary-light px-6 py-4 shadow-lg">
              <SheetTitle className="text-lg font-semibold text-white">Modifier l'expérience</SheetTitle>
              <p className="text-sm text-white/70">Modifiez les informations de votre expérience</p>
            </SheetHeader>

            {/* Contenu */}
            <div className="relative px-6 py-6 pb-32 md:pb-6">
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(async (values) => {
                  setIsSubmitting(true);
                  try {
                    await onUpdate(experience.id, values);
                    setIsEditSheetOpen(false);
                  } finally {
                    setIsSubmitting(false);
                  }
                })} className="space-y-6">
                  <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10">
                    <ExperienceForm
                      form={editForm}
                      onDelete={() => onDelete(experience.id)}
                      isEdit
                      darkMode
                      existingFileUrl={existingDocUrl}
                      onRemoveExisting={() => setDocRemoved(true)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                    disabled={isSubmitting}
                  >
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
            </div>
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
            <h3 className="font-bold text-lg text-gray-900 md:text-white line-clamp-2 leading-snug mb-1">
              {experience.title}
            </h3>
            <p className="text-sm text-gray-500 md:text-white/50 font-medium line-clamp-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 md:bg-white/40" />
              {experience.location}
            </p>
          </div>

          {/* Footer avec dates */}
          <div className="pt-3 mt-auto border-t border-gray-100 md:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 md:text-white/40 font-medium">Période</span>
              <span className="text-sm font-semibold text-gray-700 md:text-white/80">
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
      {existingDocUrl && (
        <PDFViewerDialog
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
          documentUrl={existingDocUrl}
          documentTitle={`${experience.title} - Document`}
        />
      )}
    </div>
  );
});
