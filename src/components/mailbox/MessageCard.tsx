import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { Message } from "@/types/message";

interface MessageCardProps {
  message: Message;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export const MessageCard = ({ message, onClick, onDelete }: MessageCardProps) => (
  <Card className="mb-4 relative group">
    <CardHeader className="cursor-pointer pr-16" onClick={onClick}>
      <CardTitle className="text-lg">
        {message.subject}
      </CardTitle>
      <div className="text-sm text-muted-foreground">
        {message?.sender?.first_name && (
          <>De: {message.sender.first_name} {message.sender.last_name}</>
        )}
        {message?.recipient?.first_name && (
          <div>À: {message.recipient.first_name} {message.recipient.last_name}</div>
        )}
        <div>
          {format(new Date(message.created_at), "PPP 'à' HH:mm", { locale: fr })}
        </div>
      </div>
    </CardHeader>
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={(e) => {
        e.stopPropagation();
        onDelete(message.id);
      }}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </Card>
);