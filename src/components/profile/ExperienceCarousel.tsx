import { Plus } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ExperienceCard } from "./ExperienceCard";
import { useExperiences } from "@/hooks/use-experiences";
import { useEffect } from "react";
import * as z from "zod";
import { experienceFormSchema } from "./forms/ExperienceForm";

interface ExperienceCarouselProps {
  onAddClick?: () => void;
}

export const ExperienceCarousel = ({ onAddClick }: ExperienceCarouselProps) => {
  const { experiences, fetchExperiences, updateExperience, deleteExperience } = useExperiences();

  useEffect(() => {
    fetchExperiences();
  }, []);

  // Fonction wrapper pour transformer la valeur de retour de updateExperience (boolean) en void
  const handleUpdateExperience = async (id: string, values: z.infer<typeof experienceFormSchema>): Promise<void> => {
    await updateExperience(id, values);
  };

  return (
    <div className="px-4 py-6 md:py-12 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white w-full text-left md:text-center uppercase">EXPÉRIENCE PROFESSIONNELLE</h2>
        <button
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-95"
          onClick={onAddClick}
        >
          <Plus className="h-5 w-5 text-white transition-transform duration-300 group-hover:rotate-90" />
          <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-white/60">Aucune expérience professionnelle ajoutée</p>
        </div>
      ) : (
        <>
          {/* Mobile: Carousel avec swipe (pas de flèches) */}
          <div className="md:hidden">
            <Carousel
              opts={{
                align: "start",
                loop: false,
                containScroll: "trimSnaps"
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {experiences.map((experience) => (
                  <CarouselItem key={experience.id} className="pl-2 basis-[95%]">
                    <ExperienceCard
                      experience={experience}
                      onUpdate={handleUpdateExperience}
                      onDelete={deleteExperience}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop: Grille de cartes (pas de carousel) */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {experiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                experience={experience}
                onUpdate={handleUpdateExperience}
                onDelete={deleteExperience}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
