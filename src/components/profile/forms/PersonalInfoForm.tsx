
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { formSchema } from "../ProfileForm";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, X, Phone, User, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PersonalInfoFormProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  darkMode?: boolean;
}

export const PersonalInfoForm = ({ form, darkMode = false }: PersonalInfoFormProps) => {
  // État pour contrôler l'ouverture/fermeture du calendrier
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // État pour stocker temporairement la date sélectionnée avant confirmation
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(undefined);

  // Récupérer la date de naissance actuelle (si elle existe)
  const birthDate = form.watch("birthDate");

  // Initialiser l'année courante en fonction de la date de naissance ou l'année actuelle
  const [currentYear, setCurrentYear] = useState<number>(
    birthDate ? new Date(birthDate).getFullYear() : new Date().getFullYear()
  );

  // Génération d'une liste d'années depuis 1920 jusqu'à l'année actuelle
  const years = Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => 1920 + i).reverse();

  // Création d'une date pour le mois courant à afficher dans le calendrier
  const [currentMonth, setCurrentMonth] = useState<Date>(
    birthDate ? new Date(birthDate) : new Date()
  );

  // Synchroniser les états lorsque la date de naissance change
  useEffect(() => {
    if (birthDate) {
      const date = new Date(birthDate);
      setCurrentYear(date.getFullYear());
      setCurrentMonth(date);
    }
  }, [birthDate]);

  // Initialiser la date temporaire lors de l'ouverture du calendrier
  useEffect(() => {
    if (isCalendarOpen) {
      setTempSelectedDate(birthDate ? new Date(birthDate) : undefined);
    }
  }, [isCalendarOpen, birthDate]);

  // Gérer le changement d'année dans le sélecteur
  const handleYearChange = (year: string) => {
    const yearValue = parseInt(year);
    setCurrentYear(yearValue);

    // Mettre à jour le mois affiché dans le calendrier
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(yearValue);
    setCurrentMonth(newMonth);

    // Si une date temporaire est déjà sélectionnée, conserver le jour et le mois
    if (tempSelectedDate) {
      const newDate = new Date(tempSelectedDate);
      newDate.setFullYear(yearValue);
      setTempSelectedDate(newDate);
    }
  };

  // Naviguer vers l'année précédente
  const goToPreviousYear = () => {
    const prevYear = Math.max(currentYear - 1, 1920);
    setCurrentYear(prevYear);

    // Mettre à jour le mois affiché dans le calendrier
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(prevYear);
    setCurrentMonth(newMonth);

    // Mettre à jour la date temporaire si elle existe
    if (tempSelectedDate) {
      const newDate = new Date(tempSelectedDate);
      newDate.setFullYear(prevYear);
      setTempSelectedDate(newDate);
    }
  };

  // Naviguer vers l'année suivante
  const goToNextYear = () => {
    const nextYear = Math.min(currentYear + 1, new Date().getFullYear());
    setCurrentYear(nextYear);

    // Mettre à jour le mois affiché dans le calendrier
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(nextYear);
    setCurrentMonth(newMonth);

    // Mettre à jour la date temporaire si elle existe
    if (tempSelectedDate) {
      const newDate = new Date(tempSelectedDate);
      newDate.setFullYear(nextYear);
      setTempSelectedDate(newDate);
    }
  };

  // Confirmer la sélection de la date
  const confirmDateSelection = () => {
    form.setValue("birthDate", tempSelectedDate);
    setIsCalendarOpen(false);
  };

  // Effacer la date sélectionnée
  const clearDateSelection = () => {
    setTempSelectedDate(undefined);
    form.setValue("birthDate", undefined);
    setIsCalendarOpen(false);
  };

  // Fonction pour ouvrir manuellement le calendrier
  const openCalendar = () => {
    setIsCalendarOpen(true);
  };

  // Fonction pour gérer la sélection de date dans le calendrier
  const handleDateSelect = (date: Date | undefined) => {
    setTempSelectedDate(date);
    if (date) {
      const newMonth = new Date(date);
      setCurrentMonth(newMonth);
      setCurrentYear(newMonth.getFullYear());
    }
    // Ne pas fermer le calendrier après la sélection
  };

  // Classes conditionnelles pour dark mode
  const sectionClasses = darkMode
    ? "space-y-4"
    : "bg-gray-50 rounded-2xl p-4 space-y-4";
  const labelClasses = darkMode
    ? "text-sm text-white/70"
    : "text-sm text-gray-600";
  const inputClasses = darkMode
    ? "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all"
    : "bg-white border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const textareaClasses = darkMode
    ? "bg-white/10 border-white/20 rounded-xl min-h-[120px] text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all resize-none"
    : "bg-white border-gray-200 rounded-xl min-h-[120px] text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none";
  const titleClasses = darkMode
    ? "font-semibold text-white"
    : "font-semibold text-gray-700";

  return (
    <div className="space-y-4">
      {/* Section Identité */}
      <div className={sectionClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-cyan-500/30' : 'bg-primary'} flex items-center justify-center`}>
            <User className={`h-4 w-4 ${darkMode ? 'text-cyan-400' : 'text-white'}`} />
          </div>
          <span className={titleClasses}>Identité</span>
        </div>

        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>Prénom</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={inputClasses}
                  placeholder="Votre prénom"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>Nom</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={inputClasses}
                  placeholder="Votre nom"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>Date de naissance</FormLabel>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openCalendar();
                  }}
                  className={`w-full flex justify-between rounded-xl h-12 text-base font-normal transition-all ${
                    darkMode
                      ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {field.value ? (
                    <span className={darkMode ? "text-white" : "text-gray-900"}>{format(field.value, "dd MMMM yyyy", { locale: fr })}</span>
                  ) : (
                    <span className={darkMode ? "text-white/40" : "text-gray-400"}>Sélectionner une date</span>
                  )}
                  <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-white/40' : 'text-gray-400'}`} />
                </Button>

                {/* Modal du calendrier */}
                {isCalendarOpen && (
                  <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setIsCalendarOpen(false);
                    }
                  }}>
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden w-full sm:max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
                      {/* Header du calendrier */}
                      <div className="bg-gradient-to-r from-primary to-primary-light p-4">
                        <h3 className="text-white font-semibold text-lg">Date de naissance</h3>
                        <p className="text-white/80 text-sm">
                          {tempSelectedDate
                            ? format(tempSelectedDate, "EEEE dd MMMM yyyy", { locale: fr })
                            : "Aucune date sélectionnée"
                          }
                        </p>
                      </div>

                      {/* Sélecteur d'année */}
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={goToPreviousYear}
                          className="rounded-full hover:bg-gray-200"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Select
                          value={currentYear.toString()}
                          onValueChange={handleYearChange}
                        >
                          <SelectTrigger className="w-[120px] border-0 bg-white shadow-sm rounded-xl">
                            <SelectValue placeholder={currentYear.toString()} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
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
                          onClick={goToNextYear}
                          disabled={currentYear >= new Date().getFullYear()}
                          className="rounded-full hover:bg-gray-200"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Calendrier */}
                      <Calendar
                        mode="single"
                        selected={tempSelectedDate}
                        onSelect={handleDateSelect}
                        onMonthChange={(month) => {
                          setCurrentMonth(month);
                          setCurrentYear(month.getFullYear());
                        }}
                        disabled={(date) => date > new Date()}
                        month={currentMonth}
                        initialFocus
                        captionLayout="buttons"
                        className="p-3"
                      />

                      {/* Boutons d'action */}
                      <div className="p-4 border-t flex gap-3">
                        <Button
                          variant="outline"
                          onClick={clearDateSelection}
                          className="flex-1 h-12 rounded-xl border-gray-200"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Effacer
                        </Button>
                        <Button
                          onClick={confirmDateSelection}
                          className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Valider
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Section Biographie */}
      <div className={sectionClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-blue-500/30' : 'bg-probain-blue'} flex items-center justify-center`}>
            <FileText className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-white'}`} />
          </div>
          <span className={titleClasses}>À propos de vous</span>
        </div>

        <FormField
          control={form.control}
          name="biography"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>Biographie</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className={textareaClasses}
                  placeholder="Parlez-nous de vous, de votre parcours, de vos motivations..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Section Téléphone */}
      <div className={sectionClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-green-500/30' : 'bg-green-500'} flex items-center justify-center`}>
            <Phone className={`h-4 w-4 ${darkMode ? 'text-green-400' : 'text-white'}`} />
          </div>
          <span className={titleClasses}>Contact</span>
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClasses}>Numéro de téléphone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  className={inputClasses}
                  placeholder="+41 79 123 45 67"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneVisible"
          render={({ field }) => (
            <FormItem className={`rounded-xl p-4 border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <FormLabel className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rendre mon numéro visible
                  </FormLabel>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    Les établissements pourront vous contacter directement
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-green-500"
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
