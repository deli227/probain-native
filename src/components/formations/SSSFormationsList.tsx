import { useState } from "react";
import { useSSSFormations, SSSFormation } from "@/hooks/use-sss-formations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar, Users, ExternalLink, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SSSFormationsListProps {
  filters?: {
    region?: string;
    type?: string;
  };
}

export function SSSFormationsList({ filters }: SSSFormationsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { data: formations, isLoading, error } = useSSSFormations(filters);

  // Calculer la pagination
  const totalPages = Math.ceil((formations?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFormations = formations?.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement des formations SSS...</p>
        <p className="text-xs text-muted-foreground mt-2">
          Le premier chargement peut prendre quelques secondes
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="font-semibold text-lg mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">
              Impossible de récupérer les formations depuis le site SSS.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liste des formations avec fond bleu */}
      {paginatedFormations && paginatedFormations.length > 0 ? (
        <>
          <div className="bg-primary/5 p-6 rounded-2xl">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedFormations.map((formation) => (
                <FormationCard key={formation.id} formation={formation} />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Afficher seulement quelques pages autour de la page courante
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Aucune formation disponible pour le moment
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

function FormationCard({ formation }: { formation: SSSFormation }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium line-clamp-2">
              {formation.titre || "Formation SSS"}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0">
              SSS
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formation.date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{formation.date}</span>
            </div>
          )}

          {formation.lieu && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{formation.lieu}</span>
            </div>
          )}

          {formation.organisateur && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{formation.organisateur}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {formation.places && !formation.places.toLowerCase().includes('consulter') && (
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    formation.placesColor === 'red'
                      ? 'bg-red-500'
                      : formation.placesColor === 'orange'
                      ? 'bg-orange-500'
                      : formation.placesColor === 'green'
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                  }`}
                  title={
                    formation.placesColor === 'red'
                      ? 'Complet'
                      : formation.placesColor === 'orange'
                      ? 'Peu de places'
                      : formation.placesColor === 'green'
                      ? 'Places disponibles'
                      : 'Disponibilite inconnue'
                  }
                />
                <Badge variant="outline" className="text-xs">
                  {formation.places}
                </Badge>
              </div>
            )}

            {formation.prix && (
              <span className="text-sm font-medium text-primary">
                {formation.prix}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl" aria-describedby={undefined}>
          {/* Header simplifié */}
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {formation.titre || "Formation SSS"}
            </DialogTitle>
            {formation.description && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 w-fit mt-2">
                {formation.description}
              </Badge>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Informations en liste compacte */}
            <div className="space-y-3">
              {formation.date && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formation.date}</p>
                  </div>
                </div>
              )}

              {formation.lieu && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Lieu</p>
                    <p className="text-sm font-semibold text-gray-900">{formation.lieu}</p>
                  </div>
                </div>
              )}

              {formation.organisateur && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Organisateur</p>
                    <p className="text-sm font-semibold text-gray-900">{formation.organisateur}</p>
                  </div>
                </div>
              )}

              {formation.prix && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="bg-primary rounded-full p-2 text-white">
                    <span className="text-sm font-bold">CHF</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Prix</p>
                    <p className="text-base font-bold text-gray-900">{formation.prix}</p>
                  </div>
                </div>
              )}

              {formation.places && !formation.places.toLowerCase().includes('consulter') && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  formation.placesColor === 'red'
                    ? 'bg-red-50 border-red-200'
                    : formation.placesColor === 'orange'
                    ? 'bg-orange-50 border-orange-200'
                    : formation.placesColor === 'green'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-primary/10 border-primary/20'
                }`}>
                  <div className={`rounded-full p-2 text-white ${
                    formation.placesColor === 'red'
                      ? 'bg-red-500'
                      : formation.placesColor === 'orange'
                      ? 'bg-orange-500'
                      : formation.placesColor === 'green'
                      ? 'bg-green-500'
                      : 'bg-primary'
                  }`}>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${
                      formation.placesColor === 'red'
                        ? 'text-red-600'
                        : formation.placesColor === 'orange'
                        ? 'text-orange-600'
                        : formation.placesColor === 'green'
                        ? 'text-green-600'
                        : 'text-primary'
                    }`}>Disponibilite</p>
                    <p className={`text-base font-bold ${
                      formation.placesColor === 'red'
                        ? 'text-red-700'
                        : formation.placesColor === 'orange'
                        ? 'text-orange-700'
                        : formation.placesColor === 'green'
                        ? 'text-green-700'
                        : 'text-primary'
                    }`}>{formation.places}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col gap-2 pt-4">
              {formation.url && (
                <Button
                  asChild
                  className="w-full rounded-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
                >
                  <a href={formation.url} target="_blank" rel="noopener noreferrer">
                    S'inscrire
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}

              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="w-full rounded-full h-11"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SSSFormationsList;
