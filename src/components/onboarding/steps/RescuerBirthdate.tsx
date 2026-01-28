import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RescuerBirthdateProps {
  birthDate: Date | undefined;
  onBirthDateChange: (date: Date | undefined) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const RescuerBirthdate = ({
  birthDate,
  onBirthDateChange,
  onNext,
  onBack,
  onSkip,
}: RescuerBirthdateProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentYear, setCurrentYear] = useState(birthDate?.getFullYear() || 1995);
  const [currentMonth, setCurrentMonth] = useState(birthDate || new Date(1995, 0, 1));

  const years = Array.from(
    { length: new Date().getFullYear() - 1920 + 1 },
    (_, i) => 1920 + i
  ).reverse();

  const isValid = birthDate instanceof Date;

  const handleYearChange = (year: string) => {
    const yearValue = parseInt(year);
    setCurrentYear(yearValue);
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(yearValue);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-4 animate-slide-up">
      {/* Bouton retour */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-white/60 hover:text-white transition-colors mb-8 self-start"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">Retour</span>
      </button>

      {/* Icône */}
      <div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 mx-auto mb-8">
        <CalendarDays className="w-10 h-10 text-white" />
      </div>

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Ta date de naissance
        </h2>
        <p className="text-white/60">
          Pour vérifier que tu as l'âge requis
        </p>
      </div>

      {/* Date sélectionnée ou bouton pour ouvrir le calendrier */}
      <div className="flex-1">
        <button
          onClick={() => setShowCalendar(true)}
          className="w-full h-16 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white text-lg font-medium hover:bg-white/15 transition-all"
        >
          {birthDate ? (
            format(birthDate, "dd MMMM yyyy", { locale: fr })
          ) : (
            <span className="text-white/40">Sélectionner une date</span>
          )}
        </button>
      </div>

      {/* Modal calendrier */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCalendar(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header avec sélecteur d'année */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const prevYear = Math.max(currentYear - 1, 1920);
                  handleYearChange(prevYear.toString());
                }}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-28 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const nextYear = Math.min(currentYear + 1, new Date().getFullYear());
                  handleYearChange(nextYear.toString());
                }}
                disabled={currentYear >= new Date().getFullYear()}
                className="text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Calendrier */}
            <Calendar
              mode="single"
              selected={birthDate}
              onSelect={(date) => {
                onBirthDateChange(date);
                if (date) {
                  setCurrentMonth(date);
                  setCurrentYear(date.getFullYear());
                }
              }}
              month={currentMonth}
              onMonthChange={(month) => {
                setCurrentMonth(month);
                setCurrentYear(month.getFullYear());
              }}
              disabled={(date) => date > new Date() || date < new Date("1920-01-01")}
              locale={fr}
              className="p-3"
            />

            {/* Footer */}
            <div className="p-3 border-t flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCalendar(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => setShowCalendar(false)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Boutons */}
      <div className="pb-8 pt-4 space-y-3">
        <Button
          onClick={onNext}
          disabled={!isValid}
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-full shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          CONTINUER
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-white/60 hover:text-white text-sm py-2 transition-colors"
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
};
