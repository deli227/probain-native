import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SSSCalendarEmbed() {
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header avec instructions */}
      <Card className="border-primary/20 bg-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                <img
                  src="/lovable-uploads/3fa4b80d-983c-4fef-809b-51044342371f.png"
                  alt="SSS"
                  className="w-8 h-8 object-contain"
                />
                Calendrier des Formations SSS
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Consultez toutes les formations disponibles de la Société Suisse de Sauvetage
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Comment utiliser :</strong> Parcourez le calendrier ci-dessous, utilisez les filtres pour affiner votre recherche,
              puis cliquez sur une formation pour voir tous les détails et vous inscrire directement sur le site SSS.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Iframe du calendrier SSS */}
      <Card className="border-primary/20 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center h-96 bg-gray-50">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  Chargement du calendrier SSS...
                </p>
              </div>
            </div>
          )}
          <iframe
            key={key}
            src="https://formation.sss.ch/Calendrier-des-Cours"
            className="w-full h-[800px] border-0"
            title="Calendrier des formations SSS"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
            style={{
              display: isLoading ? 'none' : 'block'
            }}
          />
        </CardContent>
      </Card>

      {/* Lien direct vers SSS */}
      <div className="text-center">
        <Button
          asChild
          variant="outline"
          className="gap-2"
        >
          <a
            href="https://formation.sss.ch/Calendrier-des-Cours"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir dans une nouvelle fenêtre
          </a>
        </Button>
      </div>
    </div>
  );
}

export default SSSCalendarEmbed;
