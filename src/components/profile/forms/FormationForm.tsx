import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { SimpleFileUpload } from "@/components/shared/SimpleFileUpload";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useOrganizations } from "@/hooks/use-organizations";
import { Loader2 } from "lucide-react";
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
);

type FormationFormValues = z.infer<typeof formationFormSchema>;

interface FormationFormProps {
  form: UseFormReturn<FormationFormValues>;
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

export const FormationForm = ({
  form,
  onDelete,
  isEdit,
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
    "Autre diplôme",
  ];

  const showCustomInput = form.watch("certificationType") === "Autre diplôme";
  const showCustomOrganization = form.watch("organization") === "__autre__";

  return (
    <div className="space-y-4 border-t pt-4">
      <FormField
        control={form.control}
        name="certificationType"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel>Type de brevet</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Sélectionnez un brevet" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {certificationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
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
              <FormLabel>Nom du diplôme</FormLabel>
              <FormControl>
                <Input 
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
            <FormLabel>Organisation</FormLabel>
            {loadingOrgs ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des organisations...
              </div>
            ) : (
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Sélectionnez une organisation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-60">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.organization_name}>
                      {org.organization_name}
                      {org.canton && <span className="text-gray-400 ml-1">({org.canton})</span>}
                    </SelectItem>
                  ))}
                  <SelectItem value="__autre__" className="border-t mt-1 pt-1">
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
              <FormLabel>Nom de l'organisation</FormLabel>
              <FormControl>
                <Input
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
              <FormLabel>Date d'obtention du brevet</FormLabel>
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
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Date du dernier recyclage (optionnel)</FormLabel>
              <FormControl>
                <Input 
                  type="date"
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    field.onChange(date);
                  }}
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <SimpleFileUpload
        form={form}
        name="document"
        label="Document justificatif (PDF uniquement)"
        acceptedTypes={['application/pdf']}
        maxSize={5 * 1024 * 1024}
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
