
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  isProcessing?: boolean;
  className?: string;
}

export const LoadingScreen = ({ 
  message = "Chargement...", 
  subMessage = "Veuillez patienter pendant le traitement de votre demande",
  isProcessing = false,
  className = ""
}: LoadingScreenProps) => {
  return (
    <div className={`min-h-screen bg-primary-dark flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-4 animate-fadeIn">
        <Loader2 className={`h-8 w-8 text-white ${isProcessing ? 'animate-spin' : 'animate-pulse'}`} />
        <div className="text-white text-xl font-medium">{message}</div>
        <div className="text-white/70 text-sm text-center px-6 max-w-xs">
          {subMessage}
        </div>
      </div>
    </div>
  );
};
