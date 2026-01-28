
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, Pencil, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { FormationForm, formationFormSchema } from "./forms/FormationForm";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, memo } from "react";
import { PDFViewerDialog } from "./PDFViewerDialog";
import * as z from "zod";

interface FormationCardProps {
  formation: {
    id: string;
    title: string;
    organization: string;
    start_date: string;
    end_date?: string;
    document_url?: string;
  };
  onUpdate: (id: string, values: z.infer<typeof formationFormSchema>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const FormationCard = memo(function FormationCard({ formation, onUpdate, onDelete }: FormationCardProps) {
  const isMobile = useIsMobile();
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const editForm = useForm<z.infer<typeof formationFormSchema>>({
    resolver: zodResolver(formationFormSchema),
    defaultValues: {
      certificationType: formation.title.startsWith("Autre: ") ? "Autre diplôme" : formation.title,
      organization: formation.organization,
      startDate: new Date(formation.start_date),
      endDate: formation.end_date ? new Date(formation.end_date) : undefined,
      customCertification: formation.title.startsWith("Autre: ") ? formation.title.substring(7) : undefined,
    },
  });

  const formatDate = (date: string) => {
    return format(new Date(date), isMobile ? 'dd/MM/yy' : 'd MMM yyyy', { locale: fr });
  };

  const handleDelete = async () => {
    await onDelete(formation.id);
  };

  const displayTitle = formation.title.startsWith("Autre: ") 
    ? formation.title.substring(7)
    : formation.title;

  return (
    <div className="relative min-h-[200px] w-full sm:w-[320px] max-w-[95vw] sm:max-w-none">
      {/* Carte principale cliquable */}
      <div
        className="min-h-full w-full rounded-2xl bg-white shadow-xl border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] flex overflow-hidden relative cursor-pointer"
        onClick={() => setIsEditSheetOpen(true)}
      >
        {/* Boutons FIXES - position absolue par rapport à la CARTE */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {formation.document_url && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPdfViewerOpen(true);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-110 active:scale-95 touch-manipulation"
              aria-label="Voir le document"
            >
              <FileText className="h-5 w-5 text-white" />
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 touch-manipulation"
            aria-label="Modifier la formation"
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
              <SheetTitle>Modifier la formation</SheetTitle>
            </SheetHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(async (values) => {
                setIsSubmitting(true);
                try {
                  await onUpdate(formation.id, values);
                  setIsEditSheetOpen(false);
                } finally {
                  setIsSubmitting(false);
                }
              })} className="space-y-6 mt-4 pb-20">
                <FormationForm form={editForm} onDelete={handleDelete} isEdit />
                <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    "Modifier la formation"
                  )}
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>

        {/* Barre latérale colorée - bleu pour les formations */}
        <div className="w-2 rounded-l-2xl bg-gradient-to-b from-blue-500 to-indigo-600 flex-shrink-0" />

        {/* Contenu */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Badge organisation - avec marge pour ne pas chevaucher les boutons */}
          <div className="mb-3 mr-14">
            <span className="inline-block px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-700 max-w-full truncate">
              {formation.organization}
            </span>
          </div>

          {/* Titre de la formation */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-snug">
              {displayTitle}
            </h3>
          </div>

          {/* Footer avec dates */}
          <div className="pt-3 mt-auto border-t border-gray-100">
            <div className="text-xs space-y-1">
              <div>
                <span className="text-gray-400">Obtenu le </span>
                <span className="font-semibold text-gray-700">{formatDate(formation.start_date)}</span>
              </div>
              {formation.end_date && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="font-semibold text-emerald-600">
                    Recyclé le {formatDate(formation.end_date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog pour la visualisation du PDF */}
      {formation.document_url && (
        <PDFViewerDialog
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
          documentUrl={formation.document_url}
          documentTitle={`${displayTitle} - Document`}
        />
      )}
    </div>
  );
});
