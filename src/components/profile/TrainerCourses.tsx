import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, Users, Eye } from "lucide-react";
import { CreateCourseDialog } from "./CreateCourseDialog";
import { CourseParticipantsDialog } from "./CourseParticipantsDialog";
import { safeGetUser } from "@/utils/asyncHelpers";

export const TrainerCourses = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>("");
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCourses = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error("Non authentifié");

      // Récupérer les cours depuis la table trainer_courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("trainer_courses")
        .select("*")
        .eq("trainer_id", user.id)
        .order("date", { ascending: true });

      if (coursesError) throw coursesError;

      // Formater les cours pour l'affichage
      const eventsArray = coursesData?.map((course) => ({
        id: course.id,
        date: new Date(course.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        }),
        title: course.title,
        location: course.location,
        status: course.status,
        participants: course.current_participants,
        maxParticipants: course.max_participants,
        startTime: course.start_time,
        endTime: course.end_time,
        price: course.price
      })) || [];

      setUpcomingEvents(eventsArray);

    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les cours. Veuillez réessayer.",
        variant: "destructive",
      });
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
      if (initialLoad) {
        setInitialLoad(false);
      }
    }
  };

  useEffect(() => {
    fetchCourses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (loading) {
    return (
      <div className="py-6 md:py-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/70">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white italic uppercase">MES COURS</h2>
        <CreateCourseDialog onCourseCreated={() => fetchCourses(false)} />
      </div>
      <section className="mt-6">
        {upcomingEvents.length === 0 ? (
          <Card className="p-6 bg-white/10 border-white/20">
            <div className="flex flex-col items-center gap-3 text-white/70">
              <Calendar className="h-12 w-12" />
              <p className="text-center">Aucun cours créé pour le moment</p>
              <p className="text-sm text-center">Cliquez sur le bouton + pour créer votre premier cours</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 lg:gap-6">
            {upcomingEvents.map((event) => (
              <Card
                key={event.id}
                className={`p-3 md:p-4 lg:p-5 bg-white relative transition-all duration-300 md:hover:shadow-xl md:hover:scale-[1.02] md:hover:-translate-y-1 cursor-pointer group ${event.status === "COMPLET" ? 'opacity-75' : ''}`}
              >
                <div className="flex flex-col">
                  <p className="text-sm md:text-base text-gray-500 mb-1 md:mb-2">{event.date}</p>
                  <h3 className="font-bold text-primary text-base md:text-lg lg:text-xl mb-1 md:mb-2 line-clamp-1 group-hover:text-probain-blue transition-colors">{event.title}</h3>
                  <p className="text-xs md:text-sm lg:text-base text-gray-600 line-clamp-1">{event.location}</p>
                  {(event.startTime || event.endTime) && (
                    <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                      {event.startTime && event.startTime.substring(0, 5)}
                      {event.startTime && event.endTime && ' - '}
                      {event.endTime && event.endTime.substring(0, 5)}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 mt-2 md:mt-4 pt-2 md:pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                      <span className="text-xs md:text-sm text-gray-600">
                        {event.participants}/{event.maxParticipants}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                      {event.price && (
                        <span className="text-xs md:text-sm font-semibold text-primary">
                          CHF {event.price}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-primary/10 transition-all md:opacity-0 md:group-hover:opacity-100"
                        onClick={() => {
                          setSelectedCourseId(event.id);
                          setSelectedCourseTitle(event.title);
                          setParticipantsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </Button>
                    </div>
                  </div>
                  {event.status === "COMPLET" && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 md:top-3 md:right-3 bg-probain-yellow text-primary font-bold text-xs md:text-sm"
                    >
                      {event.status}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {selectedCourseId && (
        <CourseParticipantsDialog
          courseId={selectedCourseId}
          courseTitle={selectedCourseTitle}
          open={participantsDialogOpen}
          onOpenChange={setParticipantsDialogOpen}
        />
      )}
    </div>
  );
};
