
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Pencil, Trash } from "lucide-react";
import { memo } from "react";

interface JobPostingCardProps {
  id: string;
  title: string;
  location: string;
  contractType: string;
  createdAt: string;
  onOpenDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const JobPostingCard = memo(function JobPostingCard({
  id,
  title,
  location,
  contractType,
  createdAt,
  onOpenDetails,
  onEdit,
  onDelete,
}: JobPostingCardProps) {
  const formattedDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Card
      className="w-full h-full transition-all duration-300 cursor-pointer group md:hover:shadow-xl md:hover:scale-[1.02] md:hover:-translate-y-1"
      onClick={onOpenDetails}
    >
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="text-lg md:text-xl font-semibold truncate group-hover:text-probain-blue transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2 md:pb-4">
        <div className="flex flex-col space-y-1 md:space-y-2 text-sm md:text-base text-gray-600">
          <p className="font-medium">{location}</p>
          <p className="inline-flex items-center gap-2">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-medium">{contractType}</span>
          </p>
          <p className="text-xs md:text-sm italic text-gray-400">Publié {formattedDate}</p>
        </div>
      </CardContent>
      <CardFooter className="pt-2 md:pt-4 flex justify-end gap-2 md:gap-3 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 hover:bg-primary hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="md:opacity-0 md:group-hover:opacity-100 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
});
