import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useOrganizations } from "@/hooks/use-organizations";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as z from "zod";

export const formationFormSchema = z.object({
  certificationType: z.string().min(1, "Le type de brevet est requis"),
  customCertification: z.string().optional(),
  organization: z.string().min(1, "L'organisation est requise"),
  customOrganization: z.string().optional(),
  startDate: z.date({
    required_error: "La date d'obtention est requise",
  }),
  endDate: z.date().optional(),
  recyclingOrganization: z.string().optional(),
  customRecyclingOrganization: z.string().optional(),
  document: z.custom<File>(
    (value) => value instanceof File || value === undefined,
    "Le document doit être un fichier PDF"
  ).refine(
    (file) => {
      if (!file) return true;
      return (
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
      );
    },
    "Le fichier doit être un PDF"
  ).optional(),
  documentUrl: z.string().optional(),
}).refine(
  (data) => data.organization !== "__autre__" || (data.customOrganization && data.customOrganization.trim().length > 0),
  {
    message: "Le nom de l'organisation est requis",
    path: ["customOrganization"],
  }
).refine(
  (data) => data.certificationType !== "Autre diplôme" || (data.customCertification && data.customCertification.trim().length > 0),
  {
    message: "Le nom du diplôme est requis",
    path: ["customCertification"],
  }
).refine(
  (data) => {
    if (!data.endDate) return true;
    if (data.recyclingOrganization !== "__autre__") return true;
    return (data.customRecyclingOrganization?.trim().length ?? 0) > 0;
  },
  {
    message: "Le nom de l'organisation de recyclage est requis",
    path: ["customRecyclingOrganization"],
  }
);

type FormationFormValues = z.infer<typeof formationFormSchema>;

interface FormationFormProps {
  form: UseFormReturn<FormationFormValues>;
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

export const FormationForm = ({
  form,
  onDelete,
  isEdit,
  darkMode = false,
  onFileSelectStart,
  onFileSelectEnd,
  onFileSelected,
  onUploadComplete,
  externalTrigger,
  externalFile,
  externalUploadState,
  onExternalReset
}: FormationFormProps) => {
  const { data: organizations = [], isLoading: loadingOrgs } = useOrganizations();

  const certificationTypes = [
    "Base Pool",
    "Plus Pool",
    "BLS-AED",
    "Pro Pool",
    "Module Lac",
    "Module Rivière",
    "Expert Pool",
    "Expert BLS-AED",
    "Expert Lac",
    "Expert Rivière",
    "Autre diplôme",
  ];

  const showCustomInput = form.watch("certificationType") === "Autre diplôme";
  const showCustomOrganization = form.watch("organization") === "__autre__";
  const watchedEndDate = form.watch("endDate");
  const showRecyclingOrg = !!watchedEndDate;
  const showCustomRecyclingOrganization = form.watch("recyclingOrganization") === "__autre__";

  // États pour le calendrier de date d'obtention
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const startDate = form.watch("startDate");
  const [startCurrentYear, setStartCurrentYear] = useState<number>(
    startDate ? new Date(startDate).getFullYear() : new Date().getFullYear()
  );
  const [startCurrentMonth, setStartCurrentMonth] = useState<Date>(
    startDate ? new Date(startDate) : new Date()
  );

  // États pour le calendrier de date de recyclage
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);
  const endDate = form.watch("endDate");
  const [endCurrentYear, setEndCurrentYear] = useState<number>(
    endDate ? new Date(endDate).getFullYear() : new Date().getFullYear()
  );
  const [endCurrentMonth, setEndCurrentMonth] = useState<Date>(
    endDate ? new Date(endDate) : new Date()
  );

  // Génération d'une liste d'années
  const years = Array.from({ length: new Date().getFullYear() - 1970 + 10 }, (_, i) => 1970 + i).reverse();

  // Synchroniser les états pour la date d'obtention
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

  // Synchroniser les états pour la date de recyclage
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

  // Nettoyer les champs recyclage quand endDate est supprimé
  useEffect(() => {
    if (!watchedEndDate) {
      form.setValue("recyclingOrganization", undefined);
      form.setValue("customRecyclingOrganization", undefined);
    }
  }, [watchedEndDate, form]);

  // Handlers pour date d'obtention
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

  // Handlers pour date de recyclage
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
  const selectTriggerClasses = darkMode
    ? "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all [&>span]:text-white/40 [&[data-state=open]>span]:text-white"
    : "bg-white border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const containerClasses = darkMode
    ? "space-y-4 border-t border-white/10 pt-4"
    : "space-y-4 border-t pt-4";

  // Composant calendrier réutilisable
  const CalendarModal = ({
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
    onNextYear
  }: {
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
  }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden w-full sm:max-w-sm animate-in slide-in-from-bottom duration-300"
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
              onClick={onNextYear}
              className="rounded-full hover:bg-gray-200"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendrier */}
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
            initialFocus
            captionLayout="buttons"
            className="p-3"
          />

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

  return (
    <div className={containerClasses}>
      <FormField
        control={form.control}
        name="certificationType"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className={labelClasses}>Type de brevet</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue placeholder="Sélectionnez un brevet" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={darkMode ? "bg-[#0d2847] border-white/20" : ""}>
                {certificationTypes.map((type) => (
                  <SelectItem
                    key={type}
                    value={type}
                    className={darkMode ? "text-white focus:bg-white/10 focus:text-white" : ""}
                  >
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {showCustomInput && (
        <FormField
          control={form.control}
          name="customCertification"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClasses}>Nom du diplôme</FormLabel>
              <FormControl>
                <Input
                  className={inputClasses}
                  placeholder="Entrez le nom de votre diplôme"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="organization"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className={labelClasses}>Organisation</FormLabel>
            {loadingOrgs ? (
              <div className={`flex items-center gap-2 text-sm py-2 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des organisations...
              </div>
            ) : (
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder="Sélectionnez une organisation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={`max-h-60 ${darkMode ? 'bg-[#0d2847] border-white/20' : ''}`}>
                  {organizations.map((org) => (
                    <SelectItem
                      key={org.id}
                      value={org.organization_name}
                      className={darkMode ? "text-white focus:bg-white/10 focus:text-white" : ""}
                    >
                      {org.organization_name}
                      {org.canton && <span className={darkMode ? "text-white/40 ml-1" : "text-gray-400 ml-1"}>({org.canton})</span>}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__autre__"
                    className={`border-t mt-1 pt-1 ${darkMode ? 'text-white focus:bg-white/10 focus:text-white border-white/10' : ''}`}
                  >
                    Autre organisation...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {showCustomOrganization && (
        <FormField
          control={form.control}
          name="customOrganization"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClasses}>Nom de l'organisation</FormLabel>
              <FormControl>
                <Input
                  className={inputClasses}
                  placeholder="Entrez le nom de l'organisation"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClasses}>Date d'obtention</FormLabel>
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
                  title="Date d'obtention du brevet"
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
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className={labelClasses}>Dernier recyclage</FormLabel>
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
                      Optionnel
                    </span>
                  )}
                  <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-white/40' : 'text-gray-400'}`} />
                </Button>

                <CalendarModal
                  isOpen={isEndCalendarOpen}
                  onClose={() => setIsEndCalendarOpen(false)}
                  title="Date du dernier recyclage"
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
      </div>

      {/* Section "Recyclé chez" - visible uniquement si une date de recyclage est définie */}
      {showRecyclingOrg && (
        <>
          <FormField
            control={form.control}
            name="recyclingOrganization"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className={labelClasses}>Recyclé chez (optionnel)</FormLabel>
                {loadingOrgs ? (
                  <div className={`flex items-center gap-2 text-sm py-2 ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des organisations...
                  </div>
                ) : (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClasses}>
                        <SelectValue placeholder="Sélectionnez l'organisme de recyclage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={`max-h-60 ${darkMode ? 'bg-[#0d2847] border-white/20' : ''}`}>
                      {organizations.map((org) => (
                        <SelectItem
                          key={org.id}
                          value={org.organization_name}
                          className={darkMode ? "text-white focus:bg-white/10 focus:text-white" : ""}
                        >
                          {org.organization_name}
                          {org.canton && <span className={darkMode ? "text-white/40 ml-1" : "text-gray-400 ml-1"}>({org.canton})</span>}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="__autre__"
                        className={`border-t mt-1 pt-1 ${darkMode ? 'text-white focus:bg-white/10 focus:text-white border-white/10' : ''}`}
                      >
                        Autre organisation...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {showCustomRecyclingOrganization && (
            <FormField
              control={form.control}
              name="customRecyclingOrganization"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className={labelClasses}>Nom de l'organisme de recyclage</FormLabel>
                  <FormControl>
                    <Input
                      className={inputClasses}
                      placeholder="Entrez le nom de l'organisme"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )}

      <SimpleFileUpload
        form={form}
        name="document"
        label="Document justificatif (PDF uniquement)"
        acceptedTypes={['application/pdf']}
        maxSize={5 * 1024 * 1024}
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
                Supprimer la formation
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Êtes-vous certain de vouloir supprimer cette formation ?
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
