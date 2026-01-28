import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const NotFound = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReturn = () => {
    toast({
      title: "Redirection",
      description: "Retour à la page d'accueil",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">Page non trouvée</h1>
        <p className="text-white/80">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button onClick={handleReturn} variant="secondary">
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;