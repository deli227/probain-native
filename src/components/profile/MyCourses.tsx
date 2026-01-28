import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Users, X } from 'lucide-react';
import { safeGetUser } from '@/utils/asyncHelpers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Registration {
  id: string;
  course_id: string;
  status: string;
  payment_status: string;
  trainer_courses: {
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
  };
}

export const MyCourses = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMyRegistrations = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      const { data: registrationsData, error: registrationsError } = await supabase
        .from('course_registrations')
        .select(`
          id,
          course_id,
          status,
          payment_status,
          trainer_courses (
            title,
            description,
            date,
            start_time,
            end_time,
            location,
            max_participants,
            current_participants,
            status,
            price
          )
        `)
        .eq('student_id', user.id)
        .in('status', ['INSCRIT', 'LISTE_ATTENTE'])
        .order('trainer_courses(date)', { ascending: true });

      if (registrationsError) throw registrationsError;

      setRegistrations(registrationsData || []);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos inscriptions.',
        variant: 'destructive',
      });
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRegistrations();
  }, []);

  const handleCancelRegistration = async (registrationId: string) => {
    setCancelling(registrationId);
    try {
      const { error } = await supabase
        .from('course_registrations')
        .update({ status: 'ANNULE' })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: 'Inscription annulée',
        description: 'Votre inscription a été annulée avec succès',
      });

      fetchMyRegistrations();
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler l\'inscription',
        variant: 'destructive',
      });
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="py-6 md:py-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/70">Chargement de vos cours...</p>
        </div>
      </div>
    );
  }

  const activeCourses = registrations.filter((reg) => reg.status === 'INSCRIT');

  return (
    <div className="py-6 md:py-12">
      <h2 className="text-xl md:text-2xl font-bold text-white italic uppercase mb-6">MES COURS</h2>

      {activeCourses.length === 0 ? (
        <Card className="p-6 bg-white/10 border-white/20">
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Calendar className="h-12 w-12" />
            <p className="text-center">Aucune inscription active</p>
            <p className="text-sm text-center">
              Consultez les cours disponibles pour vous inscrire
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {activeCourses.map((registration) => {
            const course = registration.trainer_courses;
            const formattedDate = new Date(course.date).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: '2-digit',
            });

            return (
              <Card key={registration.id} className="p-3 bg-white relative">
                <Badge
                  variant="secondary"
                  className="absolute top-2 right-2 bg-green-500 text-white font-bold text-xs"
                >
                  INSCRIT
                </Badge>

                <div className="flex flex-col">
                  <p className="text-sm text-gray-500 mb-1">{formattedDate}</p>
                  <h3 className="font-bold text-primary text-base md:text-lg mb-1 line-clamp-1">{course.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600 line-clamp-1">{course.location}</p>

                  {(course.start_time || course.end_time) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {course.start_time && course.start_time.substring(0, 5)}
                      {course.start_time && course.end_time && ' - '}
                      {course.end_time && course.end_time.substring(0, 5)}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        {course.current_participants}/{course.max_participants}
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={cancelling === registration.id}
                        >
                          {cancelling === registration.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white max-w-sm p-4">
                        <AlertDialogHeader className="space-y-1">
                          <AlertDialogTitle className="text-primary text-base">
                            Confirmer l'annulation
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-600 text-xs">
                            Êtes-vous sûr de vouloir annuler votre inscription à ce cours ?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 mt-2">
                          <AlertDialogCancel className="bg-gray-200 hover:bg-gray-300 text-xs h-8">
                            Non, garder
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelRegistration(registration.id)}
                            className="bg-red-500 hover:bg-red-600 text-xs h-8"
                          >
                            Oui, annuler
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
