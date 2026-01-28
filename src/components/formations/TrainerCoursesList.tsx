import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { safeGetUser } from '@/utils/asyncHelpers';

interface TrainerCoursesListProps {
  trainerId: string;
}

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
}

export const TrainerCoursesList = ({ trainerId }: TrainerCoursesListProps) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isWaitingListMode, setIsWaitingListMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, [trainerId]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('trainer_courses')
        .select('*')
        .eq('trainer_id', trainerId)
        .in('status', ['DISPONIBLE', 'COMPLET'])
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (coursesError) throw coursesError;

      setCourses(coursesData || []);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les cours',
        variant: 'destructive',
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (course: Course, isWaitingList: boolean) => {
    setSelectedCourse(course);
    setIsWaitingListMode(isWaitingList);
    setConfirmDialogOpen(true);
  };

  const handleConfirmRegistration = async () => {
    if (!selectedCourse) return;

    setRegistering(selectedCourse.id);
    setConfirmDialogOpen(false);

    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) {
        toast({
          title: 'Connexion requise',
          description: 'Vous devez être connecté pour vous inscrire',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('course_registrations').insert({
        course_id: selectedCourse.id,
        student_id: user.id,
        status: isWaitingListMode ? 'LISTE_ATTENTE' : 'INSCRIT',
      });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Vous êtes déjà inscrit à ce cours');
        }
        throw error;
      }

      toast({
        title: 'Inscription réussie',
        description: isWaitingListMode
          ? 'Vous avez été ajouté à la liste d\'attente'
          : 'Vous êtes maintenant inscrit à ce cours',
      });

      fetchCourses();
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de vous inscrire à ce cours',
        variant: 'destructive',
      });
    } finally {
      setRegistering(null);
      setSelectedCourse(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">Aucun cours disponible pour le moment</p>
        <p className="text-gray-500 text-sm mt-2">
          Revenez plus tard pour découvrir de nouvelles formations
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const isFull = course.status === 'COMPLET';
        const formattedDate = new Date(course.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        return (
          <Card key={course.id} className="p-6 hover:shadow-xl transition-shadow bg-white relative">
            {isFull && (
              <Badge
                variant="secondary"
                className="absolute top-4 right-4 bg-probain-yellow text-primary font-bold"
              >
                COMPLET
              </Badge>
            )}

            <div className="flex flex-col gap-4">
              <h3 className="font-bold text-primary text-xl pr-20">{course.title}</h3>

              {course.description && (
                <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
              )}

              <div className="flex flex-col gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-medium">{formattedDate}</span>
                </div>

                {(course.start_time || course.end_time) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>
                      {course.start_time && course.start_time.substring(0, 5)}
                      {course.start_time && course.end_time && ' - '}
                      {course.end_time && course.end_time.substring(0, 5)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{course.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>
                    {course.current_participants}/{course.max_participants} participants
                  </span>
                </div>

                {course.price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">CHF {course.price}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {!isFull ? (
                  <Button
                    onClick={() => openConfirmDialog(course, false)}
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
                    onClick={() => openConfirmDialog(course, true)}
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

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="bg-white max-w-sm p-4">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle className="text-primary text-base">
              Confirmer l'inscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-xs">
              {selectedCourse && (
                <div className="space-y-1.5 mt-1">
                  <div className="bg-gray-50 p-2 rounded space-y-1">
                    <p className="font-bold text-primary text-sm">{selectedCourse.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(selectedCourse.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{selectedCourse.location}</span>
                    </div>
                    {selectedCourse.price && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-semibold">CHF {selectedCourse.price}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 text-xs h-8">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRegistration}
              className="bg-probain-blue hover:bg-blue-700 text-xs h-8"
            >
              {isWaitingListMode ? "Rejoindre" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainerCoursesList;
