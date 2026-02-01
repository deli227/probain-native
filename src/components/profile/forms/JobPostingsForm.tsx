
import * as z from "zod";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

const ContractTypes = ["CDI", "CDD", "Stage", "Alternance", "Saisonnier"] as const;

export const jobPostingsFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  location: z.string().min(1, "Le lieu est requis"),
  contractType: z.enum(ContractTypes),
});

interface JobPostingsFormProps {
  form: UseFormReturn<z.infer<typeof jobPostingsFormSchema>>;
  darkMode?: boolean;
}

export const JobPostingsForm = ({ form, darkMode = false }: JobPostingsFormProps) => {
  const labelClasses = darkMode
    ? "text-sm text-white/70"
    : "text-sm text-gray-600";
  const inputClasses = darkMode
    ? "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all"
    : "bg-white border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const selectTriggerClasses = darkMode
    ? "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all [&>span]:text-white/40 [&[data-state=open]>span]:text-white"
    : "bg-white border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>Titre du poste</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Maître-nageur" className={inputClasses} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>Description</FormLabel>
            <FormControl>
              <RichTextEditor
                content={field.value}
                onChange={field.onChange}
                placeholder="Description du poste"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>Lieu</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Genève" className={inputClasses} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contractType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>Type de contrat</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue placeholder="Sélectionnez un type de contrat" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={darkMode ? "bg-[#0d2847] border-white/20" : ""}>
                {ContractTypes.map((type) => (
                  <SelectItem key={type} value={type} className={darkMode ? "text-white focus:bg-white/10 focus:text-white" : ""}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
