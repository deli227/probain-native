
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import * as z from "zod";

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

  return (
    <div className="space-y-4 border-t pt-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Titre du poste</FormLabel>
            <FormControl>
              <Input {...field} />
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
            <FormLabel>Lieu</FormLabel>
            <FormControl>
              <Input {...field} />
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
            <FormLabel>Type de contrat</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="CDI" />
                  </FormControl>
                  <FormLabel className="font-normal">CDI</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="CDD" />
                  </FormControl>
                  <FormLabel className="font-normal">CDD</FormLabel>
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
              <FormLabel>Date de début</FormLabel>
              <FormControl>
                <Input 
                  type="date"
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    field.onChange(date);
                  }}
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                />
              </FormControl>
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
                <FormLabel>Date de fin</FormLabel>
                <FormControl>
                  <Input 
                    type="date"
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      field.onChange(date);
                    }}
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  />
                </FormControl>
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
        <div className="pt-4 border-t">
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
