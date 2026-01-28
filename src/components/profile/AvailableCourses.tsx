import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { safeGetUser } from '@/utils/asyncHelpers';

interface Course {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string;
  max_participants: number;
  current_participants: number;
  status: string;
  price: number | null;
  trainer_id: string;
}

export const AvailableCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      // Récupérer tous les cours disponibles ou complets (pour liste d'attente)
      const { data: coursesData, error: coursesError } = await supabase
        .from('trainer_courses')
        .select('*')
        .in('status', ['DISPONIBLE', 'COMPLET'])
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (coursesError) throw coursesError;

      // Récupérer les inscriptions de l'utilisateur
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('course_registrations')
        .select('course_id, status')
        .eq('student_id', user.id);

      if (registrationsError) throw registrationsError;

      // Marquer les cours auxquels l'utilisateur est déjà inscrit
      const registeredCourseIds = new Set(
        registrationsData?.map((r) => r.course_id) || []
      );

      const filteredCourses = coursesData?.filter(
        (course) => !registeredCourseIds.has(course.id)
      ) || [];

      setCourses(filteredCourses);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les cours disponibles.',
        variant: 'destructive',
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRegister = async (courseId: string, isWaitingList: boolean) => {
    setRegistering(courseId);
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('course_registrations').insert({
        course_id: courseId,
        student_id: user.id,
        status: isWaitingList ? 'LISTE_ATTENTE' : 'INSCRIT',
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Vous êtes déjà inscrit à ce cours');
        }
        throw error;
      }

      toast({
        title: 'Inscription réussie',
        description: isWaitingList
          ? 'Vous avez été ajouté à la liste d\'attente'
          : 'Vous êtes maintenant inscrit à ce cours',
      });

      // Retirer le cours de la liste après inscription
      fetchCourses();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de vous inscrire à ce cours',
        variant: 'destructive',
      });
    } finally {
      setRegistering(null);
    }
  };

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
      <div className="flex justify-between items-center mb-4 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white w-full text-left md:text-center uppercase">
          COURS DISPONIBLES
        </h2>
      </div>

      {courses.length === 0 ? (
        <Card className="p-6 bg-white/10 border-white/20">
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Calendar className="h-12 w-12" />
            <p className="text-center">Aucun cours disponible pour le moment</p>
            <p className="text-sm text-center">
              Revenez plus tard pour découvrir de nouvelles formations
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => {
            const isFull = course.status === 'COMPLET';
            const formattedDate = new Date(course.date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });

            return (
              <Card key={course.id} className="p-4 bg-white relative">
                {isFull && (
                  <Badge
                    variant="secondary"
                    className="absolute top-3 right-3 bg-probain-yellow text-primary font-bold"
                  >
                    COMPLET
                  </Badge>
                )}

                <div className="flex flex-col gap-3">
                  <h3 className="font-bold text-primary text-lg pr-20">{course.title}</h3>

                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  )}

                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formattedDate}</span>
                    </div>

                    {(course.start_time || course.end_time) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {course.start_time && course.start_time.substring(0, 5)}
                          {course.start_time && course.end_time && ' - '}
                          {course.end_time && course.end_time.substring(0, 5)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{course.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {course.current_participants}/{course.max_participants} participants
                      </span>
                    </div>

                    {course.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">CHF {course.price}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    {!isFull ? (
                      <Button
                        onClick={() => handleRegister(course.id, false)}
                        disabled={registering === course.id}
                        className="flex-1 bg-probain-blue hover:bg-blue-700"
                      >
                        {registering === course.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Inscription...
                          </>
                        ) : (
                          "S'inscrire"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRegister(course.id, true)}
                        disabled={registering === course.id}
                        variant="outline"
                        className="flex-1"
                      >
                        {registering === course.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Inscription...
                          </>
                        ) : (
                          "Rejoindre la liste d'attente"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
