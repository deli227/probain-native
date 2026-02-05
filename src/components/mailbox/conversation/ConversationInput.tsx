import { Send } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { hapticFeedback } from "@/lib/native";

interface ConversationInputProps {
  onSend: (content: string, subject: string) => void;
  isSending: boolean;
  lastSubject?: string;
}

export const ConversationInput = ({ onSend, isSending, lastSubject }: ConversationInputProps) => {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!content.trim() || isSending) return;

    const subject = lastSubject
      ? lastSubject.startsWith("Re:") ? lastSubject : `Re: ${lastSubject}`
      : "Message";

    onSend(content.trim(), subject);
    setContent("");
    hapticFeedback('light');

    // Reset la hauteur du textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, isSending, lastSubject, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl p-3 flex-shrink-0">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all"
          style={{ maxHeight: "120px" }}
        />
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSending}
          size="icon"
          className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:shadow-none flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
