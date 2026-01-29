
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as z from "zod";
import { CalendarModal, CALENDAR_YEARS } from "@/components/shared/CalendarModal";

export const experienceFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  location: z.string().min(1, "Le lieu est requis"),
  startDate: z.date({
    required_error: "La date de début est requise",
  }),
  endDate: z.date().optional(),
  document: z.instanceof(File).optional(),
  documentUrl: z.string().optional(),
  contractType: z.enum(['CDD', 'CDI']),
});

type ExperienceFormValues = z.infer<typeof experienceFormSchema>;

interface ExperienceFormProps {
  form: UseFormReturn<ExperienceFormValues>;
  onDelete?: () => void;
  isEdit?: boolean;
  darkMode?: boolean;
  onFileSelectStart?: () => void;
  onFileSelectEnd?: () => void;
  onFileSelected?: () => void;
  onUploadComplete?: () => void;
  // Mode externe: l'input file est géré par le parent (hors du Sheet)
  externalTrigger?: () => void;
  externalFile?: File | null;
  externalUploadState?: {
    status: 'idle' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
  };
  onExternalReset?: () => void;
}

export const ExperienceForm = ({
  form,
  onDelete,
  isEdit,
  darkMode = false,
  onFileSelectStart,
  onFileSelectEnd,
  onFileSelected,
  onUploadComplete,
  // Props pour le mode externe (input file hors du Sheet)
  externalTrigger,
  externalFile,
  externalUploadState,
  onExternalReset
}: ExperienceFormProps) => {
  const watchContractType = form.watch('contractType');

  // États pour le calendrier de date de début
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const startDate = form.watch("startDate");
  const [startCurrentYear, setStartCurrentYear] = useState<number>(
    startDate ? new Date(startDate).getFullYear() : new Date().getFullYear()
  );
  const [startCurrentMonth, setStartCurrentMonth] = useState<Date>(
    startDate ? new Date(startDate) : new Date()
  );

  // États pour le calendrier de date de fin
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);
  const endDate = form.watch("endDate");
  const [endCurrentYear, setEndCurrentYear] = useState<number>(
    endDate ? new Date(endDate).getFullYear() : new Date().getFullYear()
  );
  const [endCurrentMonth, setEndCurrentMonth] = useState<Date>(
    endDate ? new Date(endDate) : new Date()
  );

  const years = CALENDAR_YEARS;

  // Synchroniser les états pour la date de début
  useEffect(() => {
    if (startDate) {
      const date = new Date(startDate);
      setStartCurrentYear(date.getFullYear());
      setStartCurrentMonth(date);
    }
  }, [startDate]);

  useEffect(() => {
    if (isStartCalendarOpen) {
      setTempStartDate(startDate ? new Date(startDate) : undefined);
    }
  }, [isStartCalendarOpen, startDate]);

  // Synchroniser les états pour la date de fin
  useEffect(() => {
    if (endDate) {
      const date = new Date(endDate);
      setEndCurrentYear(date.getFullYear());
      setEndCurrentMonth(date);
    }
  }, [endDate]);

  useEffect(() => {
    if (isEndCalendarOpen) {
      setTempEndDate(endDate ? new Date(endDate) : undefined);
    }
  }, [isEndCalendarOpen, endDate]);

  // Handlers pour date de début
  const handleStartYearChange = (year: string) => {
    const yearValue = parseInt(year);
    setStartCurrentYear(yearValue);
    const newMonth = new Date(startCurrentMonth);
    newMonth.setFullYear(yearValue);
    setStartCurrentMonth(newMonth);
    if (tempStartDate) {
      const newDate = new Date(tempStartDate);
      newDate.setFullYear(yearValue);
      setTempStartDate(newDate);
    }
  };

  const goToStartPreviousYear = () => {
    const prevYear = Math.max(startCurrentYear - 1, 1970);
    setStartCurrentYear(prevYear);
    const newMonth = new Date(startCurrentMonth);
    newMonth.setFullYear(prevYear);
    setStartCurrentMonth(newMonth);
  };

  const goToStartNextYear = () => {
    const nextYear = Math.min(startCurrentYear + 1, new Date().getFullYear() + 10);
    setStartCurrentYear(nextYear);
    const newMonth = new Date(startCurrentMonth);
    newMonth.setFullYear(nextYear);
    setStartCurrentMonth(newMonth);
  };

  const confirmStartDateSelection = () => {
    form.setValue("startDate", tempStartDate as Date);
    setIsStartCalendarOpen(false);
  };

  const clearStartDateSelection = () => {
    setTempStartDate(undefined);
    setIsStartCalendarOpen(false);
  };

  // Handlers pour date de fin
  const handleEndYearChange = (year: string) => {
    const yearValue = parseInt(year);
    setEndCurrentYear(yearValue);
    const newMonth = new Date(endCurrentMonth);
    newMonth.setFullYear(yearValue);
    setEndCurrentMonth(newMonth);
    if (tempEndDate) {
      const newDate = new Date(tempEndDate);
      newDate.setFullYear(yearValue);
      setTempEndDate(newDate);
    }
  };

  const goToEndPreviousYear = () => {
    const prevYear = Math.max(endCurrentYear - 1, 1970);
    setEndCurrentYear(prevYear);
    const newMonth = new Date(endCurrentMonth);
    newMonth.setFullYear(prevYear);
    setEndCurrentMonth(newMonth);
  };

  const goToEndNextYear = () => {
    const nextYear = Math.min(endCurrentYear + 1, new Date().getFullYear() + 10);
    setEndCurrentYear(nextYear);
    const newMonth = new Date(endCurrentMonth);
    newMonth.setFullYear(nextYear);
    setEndCurrentMonth(newMonth);
  };

  const confirmEndDateSelection = () => {
    form.setValue("endDate", tempEndDate);
    setIsEndCalendarOpen(false);
  };

  const clearEndDateSelection = () => {
    setTempEndDate(undefined);
    form.setValue("endDate", undefined);
    setIsEndCalendarOpen(false);
  };

  // Classes conditionnelles pour dark mode
  const labelClasses = darkMode
    ? "text-sm text-white/70"
    : "text-sm text-gray-600";
  const inputClasses = darkMode
    ? "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all"
    : "bg-white border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const containerClasses = darkMode
    ? "space-y-4 border-t border-white/10 pt-4"
    : "space-y-4 border-t pt-4";
  const radioClasses = darkMode
    ? "text-white/70 border-white/20 data-[state=checked]:border-cyan-400 data-[state=checked]:bg-cyan-400"
    : "";

  return (
    <div className={containerClasses}>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className={labelClasses}>Titre du poste</FormLabel>
            <FormControl>
              <Input {...field} className={inputClasses} placeholder="Ex: Maître-nageur sauveteur" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className={labelClasses}>Lieu</FormLabel>
            <FormControl>
              <Input {...field} className={inputClasses} placeholder="Ex: Piscine municipale de Lausanne" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contractType"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className={labelClasses}>Type de contrat</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="CDI" className={radioClasses} />
                  </FormControl>
                  <FormLabel className={`font-normal ${darkMode ? 'text-white' : ''}`}>CDI</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="CDD" className={radioClasses} />
                  </FormControl>
                  <FormLabel className={`font-normal ${darkMode ? 'text-white' : ''}`}>CDD</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClasses}>Date de début</FormLabel>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsStartCalendarOpen(true);
                  }}
                  className={`w-full flex justify-between rounded-xl h-12 text-base font-normal transition-all ${
                    darkMode
                      ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {field.value ? (
                    <span className={darkMode ? "text-white" : "text-gray-900"}>
                      {format(field.value, "dd MMMM yyyy", { locale: fr })}
                    </span>
                  ) : (
                    <span className={darkMode ? "text-white/40" : "text-gray-400"}>
                      Sélectionner une date
                    </span>
                  )}
                  <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-white/40' : 'text-gray-400'}`} />
                </Button>

                <CalendarModal
                  isOpen={isStartCalendarOpen}
                  onClose={() => setIsStartCalendarOpen(false)}
                  title="Date de début"
                  tempDate={tempStartDate}
                  setTempDate={setTempStartDate}
                  currentYear={startCurrentYear}
                  setCurrentYear={setStartCurrentYear}
                  currentMonth={startCurrentMonth}
                  setCurrentMonth={setStartCurrentMonth}
                  onConfirm={confirmStartDateSelection}
                  onClear={clearStartDateSelection}
                  onYearChange={handleStartYearChange}
                  onPrevYear={goToStartPreviousYear}
                  onNextYear={goToStartNextYear}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {watchContractType === 'CDD' && (
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClasses}>Date de fin</FormLabel>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEndCalendarOpen(true);
                    }}
                    className={`w-full flex justify-between rounded-xl h-12 text-base font-normal transition-all ${
                      darkMode
                        ? 'bg-white/10 border-white/20 hover:bg-white/15 text-white'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {field.value ? (
                      <span className={darkMode ? "text-white" : "text-gray-900"}>
                        {format(field.value, "dd MMMM yyyy", { locale: fr })}
                      </span>
                    ) : (
                      <span className={darkMode ? "text-white/40" : "text-gray-400"}>
                        Sélectionner une date
                      </span>
                    )}
                    <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-white/40' : 'text-gray-400'}`} />
                  </Button>

                  <CalendarModal
                    isOpen={isEndCalendarOpen}
                    onClose={() => setIsEndCalendarOpen(false)}
                    title="Date de fin"
                    tempDate={tempEndDate}
                    setTempDate={setTempEndDate}
                    currentYear={endCurrentYear}
                    setCurrentYear={setEndCurrentYear}
                    currentMonth={endCurrentMonth}
                    setCurrentMonth={setEndCurrentMonth}
                    onConfirm={confirmEndDateSelection}
                    onClear={clearEndDateSelection}
                    onYearChange={handleEndYearChange}
                    onPrevYear={goToEndPreviousYear}
                    onNextYear={goToEndNextYear}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <SimpleFileUpload
        form={form}
        name="document"
        label="Document justificatif (PDF uniquement)"
        acceptedTypes={['application/pdf']}
        maxSize={20 * 1024 * 1024}
        darkMode={darkMode}
        onFileSelectStart={onFileSelectStart}
        onFileSelectEnd={onFileSelectEnd}
        onFileSelected={onFileSelected}
        onUploadComplete={onUploadComplete}
        // Props pour le mode externe (input file hors du Sheet)
        externalTrigger={externalTrigger}
        externalFile={externalFile}
        externalUploadState={externalUploadState}
        onExternalReset={onExternalReset}
      />

      {isEdit && onDelete && (
        <div className={`pt-4 ${darkMode ? 'border-t border-white/10' : 'border-t'}`}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="w-full px-4 py-2 text-white bg-probain-red hover:bg-red-600 rounded-md transition-colors"
              >
                Supprimer l'expérience
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Êtes-vous certain de vouloir supprimer cette expérience ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Non</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-probain-red hover:bg-red-600"
                >
                  Oui
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
