
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserPlus, UserX, User, Search, Backpack, Mail, Check, X } from 'lucide-react';
import { SendMessageDialog } from "@/components/profile/SendMessageDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { safeGetUser } from "@/utils/asyncHelpers";

export const TrainerStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Récupérer les élèves du formateur depuis la base de données
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("trainer_students")
        .select(`
          id,
          training_date,
          training_type,
          certification_issued,
          student_id,
          profiles!student_id(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("trainer_id", user.id);

      if (error) throw error;

      // Transformer les données pour faciliter l'utilisation
      const formattedStudents = data.map(item => ({
        id: item.id,
        student_id: item.student_id,
        name: `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim(),
        email: item.profiles.email || '',
        status: item.certification_issued ? "certifié" : "en formation",
        date: new Date(item.training_date).toLocaleDateString('fr-FR'),
        training_type: item.training_type
      }));

      setStudents(formattedStudents);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: "Erreur",
        description: "Impossible de charger vos élèves",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtrer les élèves par statut et recherche
  const getFilteredStudents = (status = "all") => {
    return students.filter(student => {
      const matchesStatus = status === "all" || 
                          (status === "active" && student.status === "en formation") ||
                          (status === "inactive" && student.status === "certifié");
      
      const matchesSearch = searchQuery === "" || 
                          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  };

  // Mettre à jour le statut de certification d'un élève
  const updateCertificationStatus = async (studentRecordId, newStatus) => {
    try {
      const { error } = await supabase
        .from("trainer_students")
        .update({ certification_issued: newStatus })
        .eq("id", studentRecordId);

      if (error) throw error;

      // Mettre à jour l'état local
      setStudents(prev => prev.map(student =>
        student.id === studentRecordId
          ? { ...student, status: newStatus ? "certifié" : "en formation" }
          : student
      ));

      toast({
        title: "Succès",
        description: newStatus
          ? "L'élève a été certifié avec succès"
          : "La certification a été retirée",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de certification",
        variant: "destructive",
      });
    }
  };

  // Gérer la sélection d'un élève
  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      const isSelected = prev.some(s => s.student_id === studentId);
      if (isSelected) {
        return prev.filter(s => s.student_id !== studentId);
      } else {
        const student = students.find(s => s.student_id === studentId);
        return [...prev, { 
          student_id: student.student_id,
          student: {
            first_name: student.name.split(' ')[0],
            last_name: student.name.split(' ').slice(1).join(' ')
          }
        }];
      }
    });
  };

  // Sélectionner/désélectionner tous les élèves visibles
  const toggleAllStudents = (status) => {
    const filteredStudents = getFilteredStudents(status);
    
    if (filteredStudents.every(s => selectedStudents.some(selected => selected.student_id === s.student_id))) {
      // Désélectionner tous les élèves de ce filtre
      setSelectedStudents(prev => prev.filter(s => 
        !filteredStudents.some(filtered => filtered.student_id === s.student_id)
      ));
    } else {
      // Sélectionner tous les élèves de ce filtre
      const studentsToAdd = filteredStudents
        .filter(s => !selectedStudents.some(selected => selected.student_id === s.student_id))
        .map(s => ({ 
          student_id: s.student_id,
          student: {
            first_name: s.name.split(' ')[0],
            last_name: s.name.split(' ').slice(1).join(' ')
          }
        }));
      
      setSelectedStudents(prev => [...prev, ...studentsToAdd]);
    }
  };

  // Envoyer un message à un seul élève
  const openMessageDialogForStudent = (studentId) => {
    const student = students.find(s => s.student_id === studentId);
    if (student) {
      setSelectedStudents([{ 
        student_id: student.student_id,
        student: {
          first_name: student.name.split(' ')[0],
          last_name: student.name.split(' ').slice(1).join(' ')
        }
      }]);
      setIsMessageDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-dark pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
          <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white w-full text-left md:text-center uppercase mb-8">MES ÉLÈVES</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 flex justify-center items-center">
            <p className="text-white">Chargement des élèves...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-dark pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
          <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white w-full text-left md:text-center uppercase mb-8">MES ÉLÈVES</h2>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 flex justify-center items-center">
            <p className="text-red-400">Erreur: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white w-full text-left md:text-center uppercase">MES ÉLÈVES</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Rechercher un élève..."
                className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-probain-blue"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {selectedStudents.length > 0 && (
                <Button 
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                  onClick={() => setIsMessageDialogOpen(true)}
                >
                  <Mail className="h-4 w-4" />
                  Envoyer un message ({selectedStudents.length})
                </Button>
              )}
              <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Ajouter un élève
              </Button>
            </div>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-primary border border-white/10">
              <TabsTrigger value="active" className="text-white data-[state=active]:bg-primary/80">
                Actifs
              </TabsTrigger>
              <TabsTrigger value="inactive" className="text-white data-[state=active]:bg-primary/80">
                Certifiés
              </TabsTrigger>
              <TabsTrigger value="all" className="text-white data-[state=active]:bg-primary/80">
                Tous
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <div className="flex justify-end mb-2">
                <Button 
                  variant="ghost" 
                  className="text-white p-2 h-8"
                  onClick={() => toggleAllStudents("active")}
                >
                  {getFilteredStudents("active").every(s => selectedStudents.some(selected => selected.student_id === s.student_id)) 
                    ? <><X className="h-4 w-4 mr-1" /> Désélectionner tout</>
                    : <><Check className="h-4 w-4 mr-1" /> Sélectionner tout</>
                  }
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredStudents("active").map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isSelected={selectedStudents.some(s => s.student_id === student.student_id)}
                    onToggleSelect={() => toggleStudentSelection(student.student_id)}
                    onSendMessage={() => openMessageDialogForStudent(student.student_id)}
                    onUpdateCertification={(newStatus) => updateCertificationStatus(student.id, newStatus)}
                  />
                ))}
                {getFilteredStudents("active").length === 0 && (
                  <div className="col-span-full text-center p-8 text-white/60">
                    Aucun élève actif trouvé
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-4">
              <div className="flex justify-end mb-2">
                <Button 
                  variant="ghost" 
                  className="text-white p-2 h-8"
                  onClick={() => toggleAllStudents("inactive")}
                >
                  {getFilteredStudents("inactive").every(s => selectedStudents.some(selected => selected.student_id === s.student_id)) 
                    ? <><X className="h-4 w-4 mr-1" /> Désélectionner tout</>
                    : <><Check className="h-4 w-4 mr-1" /> Sélectionner tout</>
                  }
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredStudents("inactive").map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isSelected={selectedStudents.some(s => s.student_id === student.student_id)}
                    onToggleSelect={() => toggleStudentSelection(student.student_id)}
                    onSendMessage={() => openMessageDialogForStudent(student.student_id)}
                    onUpdateCertification={(newStatus) => updateCertificationStatus(student.id, newStatus)}
                  />
                ))}
                {getFilteredStudents("inactive").length === 0 && (
                  <div className="col-span-full text-center p-8 text-white/60">
                    Aucun élève certifié trouvé
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-4">
              <div className="flex justify-end mb-2">
                <Button 
                  variant="ghost" 
                  className="text-white p-2 h-8"
                  onClick={() => toggleAllStudents("all")}
                >
                  {getFilteredStudents("all").every(s => selectedStudents.some(selected => selected.student_id === s.student_id)) 
                    ? <><X className="h-4 w-4 mr-1" /> Désélectionner tout</>
                    : <><Check className="h-4 w-4 mr-1" /> Sélectionner tout</>
                  }
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredStudents("all").map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isSelected={selectedStudents.some(s => s.student_id === student.student_id)}
                    onToggleSelect={() => toggleStudentSelection(student.student_id)}
                    onSendMessage={() => openMessageDialogForStudent(student.student_id)}
                    onUpdateCertification={(newStatus) => updateCertificationStatus(student.id, newStatus)}
                  />
                ))}
                {getFilteredStudents("all").length === 0 && (
                  <div className="col-span-full text-center p-8 text-white/60">
                    Aucun élève trouvé
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SendMessageDialog
        isOpen={isMessageDialogOpen}
        onClose={() => {
          setIsMessageDialogOpen(false);
          // Réinitialiser la sélection après l'envoi du message
          if (selectedStudents.length === 1) {
            setSelectedStudents([]);
          }
        }}
        selectedStudents={selectedStudents}
      />
    </div>
  );
};

const StudentCard = ({ student, isSelected, onToggleSelect, onSendMessage, onUpdateCertification }) => {
  return (
    <Card className={`bg-white/10 border-white/20 text-white overflow-hidden hover:bg-white/15 transition-colors ${isSelected ? 'border-probain-blue ring-1 ring-probain-blue' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="border-white/40 data-[state=checked]:bg-primary"
            />
            <div className="bg-primary-dark p-2 rounded-full">
              <User className="h-5 w-5 text-probain-blue" />
            </div>
            <div>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <CardDescription className="text-white/70">{student.email}</CardDescription>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            student.status === 'en formation' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {student.status === 'en formation' ? 'En formation' : 'Certifié'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Backpack className="h-4 w-4" />
          <span>Inscrit le {student.date}</span>
        </div>
        <div className="mt-1 text-sm text-white/60">
          <span>Formation: {student.training_type || 'Non spécifiée'}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t border-white/10">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 p-2 h-8">
          Voir détails
        </Button>
        <div className="flex">
          <Button 
            variant="ghost" 
            className="text-primary-light hover:text-primary hover:bg-primary/10 p-2 h-8"
            onClick={onSendMessage}
          >
            <Mail className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              {student.status === 'en formation' ? (
                <Button variant="ghost" className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 h-8">
                  <Check className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              <p className="mb-2">{student.status === 'en formation' ? 'Marquer comme certifié?' : 'Retirer la certification?'}</p>
              <div className="flex justify-end gap-2">
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">Annuler</Button>
                </PopoverTrigger>
                <Button
                  size="sm"
                  onClick={() => {
                    const newStatus = student.status === 'en formation';
                    onUpdateCertification(newStatus);
                  }}
                >
                  {student.status === 'en formation' ? 'Certifier' : 'Retirer'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardFooter>
    </Card>
  );
};
