
import * as z from "zod";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";

const ContractTypes = ["CDI", "CDD", "Stage", "Alternance", "Saisonnier"] as const;

export const jobPostingsFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  location: z.string().min(1, "Le lieu est requis"),
  contractType: z.enum(ContractTypes),
  linkUrl: z.string().url("L'URL n'est pas valide").or(z.literal("")).optional(),
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
                darkMode={darkMode}
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
            {darkMode ? (
              <FormControl>
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={cn(
                    "w-full bg-white/10 border border-white/20 rounded-xl h-12 px-3 text-base text-white",
                    "focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 focus:outline-none transition-all",
                    "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.5)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                  )}
                >
                  <option value="" disabled className="bg-[#0d2847] text-white/40">
                    Sélectionnez un type de contrat
                  </option>
                  {ContractTypes.map((type) => (
                    <option key={type} value={type} className="bg-[#0d2847] text-white">
                      {type}
                    </option>
                  ))}
                </select>
              </FormControl>
            ) : (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder="Sélectionnez un type de contrat" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ContractTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="linkUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>Lien (optionnel)</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://exemple.com"
                className={inputClasses}
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
