import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Mail, X, Loader2, SlidersHorizontal } from 'lucide-react';
import { SendMessageDialog } from "@/components/profile/SendMessageDialog";
import { useTrainerStudents } from "@/hooks/use-trainer-students";
import { CompactHeader } from './CompactHeader';
import { FilterPanel } from './FilterPanel';
import { StudentList } from './StudentList';
import { StudentDetailSheet } from './StudentDetailSheet';

export const TrainerStudents = () => {
  const {
    students,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedStudents,
    setSelectedStudents,
    isMessageDialogOpen,
    setIsMessageDialogOpen,
    detailStudent,
    setDetailStudent,
    externalFormations,
    loadingExternal,
    selectedBrevet,
    setSelectedBrevet,
    formationSource,
    setFormationSource,
    showFilters,
    setShowFilters,
    availableBrevets,
    activeStudents,
    allStudents,
    totalCount,
    activeCount,
    fetchStudents,
    handleSelectBrevet,
    toggleStudentSelection,
    toggleAllStudents,
    openMessageDialogForStudent,
  } = useTrainerStudents();

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
        <CompactHeader activeCount={0} totalCount={0} />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
        <CompactHeader activeCount={0} totalCount={0} />
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 text-center">
            <p className="text-red-400">Erreur : {error}</p>
            <Button
              onClick={fetchStudents}
              variant="ghost"
              className="mt-3 text-white/70 hover:text-white"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark pb-20 md:pb-6">
      {/* Header compact */}
      <CompactHeader activeCount={activeCount} totalCount={totalCount} />

      {/* Contenu */}
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Barre de recherche + bouton filtre */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-probain-blue/50 focus:border-probain-blue/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`relative h-[42px] w-[42px] rounded-xl border flex-shrink-0 transition-all ${
              showFilters || selectedBrevet
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {selectedBrevet && !showFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
            )}
          </Button>
        </div>

        {/* Panneau de filtres */}
        <FilterPanel
          show={showFilters}
          selectedBrevet={selectedBrevet}
          onSelectBrevet={handleSelectBrevet}
          formationSource={formationSource}
          onSelectSource={setFormationSource}
          availableBrevets={availableBrevets}
          onClearFilters={() => {
            setSelectedBrevet(null);
            setFormationSource('all');
          }}
        />

        {/* Indicateur de filtre actif (panneau fermé) */}
        {!showFilters && selectedBrevet && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-white/40">Filtre :</span>
            <span
              className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full text-xs cursor-pointer hover:bg-cyan-500/30 transition-colors"
              onClick={() => setShowFilters(true)}
            >
              {selectedBrevet}
              {formationSource !== 'all' && ` · ${formationSource === 'own' ? 'Chez moi' : 'Ailleurs'}`}
            </span>
            <button
              onClick={() => { setSelectedBrevet(null); setFormationSource('all'); }}
              className="text-white/30 hover:text-white/50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 h-auto">
            <TabsTrigger
              value="active"
              className="rounded-lg py-2 text-sm text-white/60 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              Actifs ({activeStudents.length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="rounded-lg py-2 text-sm text-white/60 data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              Tous ({allStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <StudentList
              students={activeStudents}
              selectedStudents={selectedStudents}
              onToggleSelect={toggleStudentSelection}
              onSendMessage={openMessageDialogForStudent}
              onToggleAll={() => toggleAllStudents(activeStudents)}
              onViewDetails={setDetailStudent}
              emptyType="active"
            />
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <StudentList
              students={allStudents}
              selectedStudents={selectedStudents}
              onToggleSelect={toggleStudentSelection}
              onSendMessage={openMessageDialogForStudent}
              onToggleAll={() => toggleAllStudents(allStudents)}
              onViewDetails={setDetailStudent}
              emptyType="all"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB : Envoyer message (fixé en bas quand sélection active) */}
      {selectedStudents.length > 0 && (
        <div className="fixed bottom-[100px] md:bottom-6 left-0 right-0 px-4 z-[55]">
          <div className="max-w-4xl mx-auto">
            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all py-3"
              onClick={() => setIsMessageDialogOpen(true)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer un message ({selectedStudents.length})
            </Button>
          </div>
        </div>
      )}

      {/* Sheet détail élève */}
      <StudentDetailSheet
        student={detailStudent}
        ownFormations={detailStudent ? students.filter(s => s.student_id === detailStudent.student_id) : []}
        externalFormations={externalFormations}
        loadingExternal={loadingExternal}
        open={!!detailStudent}
        onOpenChange={(open) => { if (!open) setDetailStudent(null); }}
        onSendMessage={() => {
          if (detailStudent) {
            openMessageDialogForStudent(detailStudent.student_id);
          }
        }}
      />

      <SendMessageDialog
        isOpen={isMessageDialogOpen}
        onClose={() => {
          setIsMessageDialogOpen(false);
          if (selectedStudents.length === 1) {
            setSelectedStudents([]);
          }
        }}
        selectedStudents={selectedStudents}
      />
    </div>
  );
};
