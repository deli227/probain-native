import { MessageSquare, Mail } from "lucide-react";

interface EmptyStateProps {
  type: "no-conversations" | "no-selection";
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  if (type === "no-conversations") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="relative z-0">
          <div className="p-5 bg-white/5 rounded-2xl mb-4 border border-white/10">
            <Mail className="h-12 w-12 text-white/20" />
          </div>
          <p className="text-base font-medium text-white/50">
            Aucune conversation
          </p>
          <p className="text-sm text-white/30 mt-1 text-center">
            Les messages que vous recevrez apparaîtront ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <div className="relative z-0">
        <div className="p-6 bg-white/5 rounded-2xl mb-4 border border-white/10">
          <MessageSquare className="h-16 w-16 text-white/20" />
        </div>
        <p className="text-lg font-medium text-white/50">
          Sélectionnez une conversation
        </p>
        <p className="text-sm text-white/30 mt-1">
          Cliquez sur une conversation pour voir les messages
        </p>
      </div>
    </div>
  );
};
