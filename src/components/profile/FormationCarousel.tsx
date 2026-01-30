
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Plus } from "lucide-react";
import { FormationCard } from "./FormationCard";
import { useFormations } from "@/hooks/use-formations";
import { useEffect, useMemo } from "react";
import * as z from "zod";
import { formationFormSchema } from "./forms/FormationForm";
import { sortCertificationsByLevel } from "@/utils/sortingUtils";
import { getRecyclingInfo } from "@/utils/recyclingUtils";

interface FormationCarouselProps {
  onAddClick?: () => void;
}

export const FormationCarousel = ({ onAddClick }: FormationCarouselProps) => {
  const { formations, fetchFormations, updateFormation, deleteFormation } = useFormations();

  // Trier les formations par niveau de brevet (du plus haut au plus bas)
  const sortedFormations = useMemo(
    () => sortCertificationsByLevel(formations),
    [formations]
  );

  useEffect(() => {
    fetchFormations();
  }, []);

  const handleUpdate = async (id: string, values: z.infer<typeof formationFormSchema>) => {
    await updateFormation(id, values);
  };

  const handleDelete = async (id: string) => {
    await deleteFormation(id);
  };

  return (
    <div className="px-4 py-6 md:py-8 md:px-0 max-w-5xl md:max-w-none mx-auto">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white w-full text-left uppercase">FORMATION</h2>
        <button
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
          onClick={onAddClick}
        >
          <Plus className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-90" />
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {sortedFormations.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/60">Aucune formation ajoutée</p>
        </div>
      ) : (
        <>
          {/* Mobile: Carousel avec swipe (pas de flèches) */}
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
                {sortedFormations.map((formation) => (
                  <CarouselItem key={formation.id} className="pl-2 basis-[95%]">
                    <FormationCard
                      formation={formation}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      recyclingInfo={getRecyclingInfo(formation)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop: Grille de cartes (pas de carousel) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {sortedFormations.map((formation) => (
              <FormationCard
                key={formation.id}
                formation={formation}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                recyclingInfo={getRecyclingInfo(formation)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
