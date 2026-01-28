import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MapPin } from "lucide-react";

interface CourseParticipantsDialogProps {
  courseId: string;
  courseTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Participant {
  id: string;
  status: string;
  registration_date: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    city: string | null;
    avatar_url: string | null;
  };
}

export const CourseParticipantsDialog = ({
  courseId,
  courseTitle,
  open,
  onOpenChange,
}: CourseParticipantsDialogProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && courseId) {
      fetchParticipants();
    }
  }, [open, courseId]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_registrations")
        .select(`
          id,
          status,
          registration_date,
          student:profiles!course_registrations_student_id_fkey (
            id,
            first_name,
            last_name,
            email,
            city,
            avatar_url
          )
        `)
        .eq("course_id", courseId)
        .in("status", ["INSCRIT", "LISTE_ATTENTE"])
        .order("registration_date", { ascending: true });

      if (error) throw error;

      setParticipants(data as any || []);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les participants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registeredParticipants = participants.filter(p => p.status === "INSCRIT");
  const waitingListParticipants = participants.filter(p => p.status === "LISTE_ATTENTE");

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const ParticipantCard = ({ participant }: { participant: Participant }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={participant.student.avatar_url || undefined} />
        <AvatarFallback className="bg-primary text-white">
          {getInitials(participant.student.first_name, participant.student.last_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">
          {participant.student.first_name} {participant.student.last_name}
        </p>
        <div className="flex flex-col gap-1 mt-1">
          {participant.student.email && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Mail className="h-3 w-3" />
              <span className="truncate">{participant.student.email}</span>
            </div>
          )}
          {participant.student.city && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="h-3 w-3" />
              <span>{participant.student.city}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Inscrit le {new Date(participant.registration_date).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-primary text-xl">
            Participants - {courseTitle}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Liste des personnes inscrites et en liste d'attente
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-gray-600">Chargement des participants...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Participants inscrits */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  Inscrits
                </h3>
                <Badge className="bg-probain-blue">
                  {registeredParticipants.length}
                </Badge>
              </div>
              {registeredParticipants.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                  Aucun participant inscrit pour le moment
                </p>
              ) : (
                <div className="space-y-2">
                  {registeredParticipants.map((participant) => (
                    <ParticipantCard key={participant.id} participant={participant} />
                  ))}
                </div>
              )}
            </div>

            {/* Liste d'attente */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  Liste d'attente
                </h3>
                <Badge variant="outline" className="border-primary text-primary">
                  {waitingListParticipants.length}
                </Badge>
              </div>
              {waitingListParticipants.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-lg">
                  Aucune personne en liste d'attente
                </p>
              ) : (
                <div className="space-y-2">
                  {waitingListParticipants.map((participant) => (
                    <ParticipantCard key={participant.id} participant={participant} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
