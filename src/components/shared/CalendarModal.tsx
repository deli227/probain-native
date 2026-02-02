import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Liste d'années pour le sélecteur (module-level pour stabilité de référence)
export const CALENDAR_YEARS = Array.from({ length: new Date().getFullYear() - 1970 + 10 }, (_, i) => 1970 + i).reverse();

export interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tempDate: Date | undefined;
  setTempDate: (date: Date | undefined) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onConfirm: () => void;
  onClear: () => void;
  onYearChange: (year: string) => void;
  onPrevYear: () => void;
  onNextYear: () => void;
}

export const CalendarModal = ({
  isOpen,
  onClose,
  title,
  tempDate,
  setTempDate,
  currentYear,
  setCurrentYear,
  currentMonth,
  setCurrentMonth,
  onConfirm,
  onClear,
  onYearChange,
  onPrevYear,
  onNextYear,
}: CalendarModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden overflow-y-auto w-full max-w-sm max-h-[calc(100vh-2rem)] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header du calendrier */}
        <div className="bg-gradient-to-r from-primary to-primary-light p-4">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <p className="text-white/80 text-sm">
            {tempDate
              ? format(tempDate, "EEEE dd MMMM yyyy", { locale: fr })
              : "Aucune date sélectionnée"
            }
          </p>
        </div>

        {/* Sélecteur d'année */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevYear}
            className="rounded-full hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Select
            value={currentYear.toString()}
            onValueChange={onYearChange}
          >
            <SelectTrigger className="w-[120px] border-0 bg-white shadow-sm rounded-xl">
              <SelectValue placeholder={currentYear.toString()} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-y-auto">
              {CALENDAR_YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextYear}
            className="rounded-full hover:bg-gray-200"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calendrier - min-h fixe pour éviter le saut quand le nb de semaines change */}
        <div className="min-h-[310px]">
          <Calendar
            mode="single"
            selected={tempDate}
            onSelect={(date) => {
              setTempDate(date);
              if (date) {
                const newMonth = new Date(date);
                setCurrentMonth(newMonth);
                setCurrentYear(newMonth.getFullYear());
              }
            }}
            onMonthChange={(month) => {
              setCurrentMonth(month);
              setCurrentYear(month.getFullYear());
            }}
            month={currentMonth}
            locale={fr}
            captionLayout="buttons"
            className="p-3"
          />
        </div>

        {/* Boutons d'action */}
        <div className="p-4 border-t flex gap-3">
          <Button
            variant="outline"
            onClick={onClear}
            className="flex-1 h-12 rounded-xl border-gray-200"
          >
            <X className="h-4 w-4 mr-2" />
            Effacer
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark"
            disabled={!tempDate}
          >
            <Check className="h-4 w-4 mr-2" />
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
};
