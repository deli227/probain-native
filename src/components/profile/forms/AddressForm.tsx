import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { formSchema } from "../ProfileForm";
import * as z from "zod";
import { MapPin } from "lucide-react";

const CANTONS_SUISSES = [
  { value: "AG", label: "Argovie" },
  { value: "AI", label: "Appenzell Rhodes-Intérieures" },
  { value: "AR", label: "Appenzell Rhodes-Extérieures" },
  { value: "BE", label: "Berne" },
  { value: "BL", label: "Bâle-Campagne" },
  { value: "BS", label: "Bâle-Ville" },
  { value: "FR", label: "Fribourg" },
  { value: "GE", label: "Genève" },
  { value: "GL", label: "Glaris" },
  { value: "GR", label: "Grisons" },
  { value: "JU", label: "Jura" },
  { value: "LU", label: "Lucerne" },
  { value: "NE", label: "Neuchâtel" },
  { value: "NW", label: "Nidwald" },
  { value: "OW", label: "Obwald" },
  { value: "SG", label: "Saint-Gall" },
  { value: "SH", label: "Schaffhouse" },
  { value: "SO", label: "Soleure" },
  { value: "SZ", label: "Schwytz" },
  { value: "TG", label: "Thurgovie" },
  { value: "TI", label: "Tessin" },
  { value: "UR", label: "Uri" },
  { value: "VD", label: "Vaud" },
  { value: "VS", label: "Valais" },
  { value: "ZG", label: "Zoug" },
  { value: "ZH", label: "Zurich" }
];

interface AddressFormProps {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  darkMode?: boolean;
}

export const AddressForm = ({ form, darkMode = false }: AddressFormProps) => {
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
  const selectTriggerClasses = darkMode
    ? "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all [&>span]:text-white/40 [&[data-state=open]>span]:text-white"
    : "bg-white border-gray-200 rounded-xl h-12 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const titleClasses = darkMode
    ? "font-semibold text-white"
    : "font-semibold text-gray-700";

  return (
    <div className={sectionClasses}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl ${darkMode ? 'bg-orange-500/30' : 'bg-orange-500'} flex items-center justify-center`}>
          <MapPin className={`h-4 w-4 ${darkMode ? 'text-orange-400' : 'text-white'}`} />
        </div>
        <span className={titleClasses}>Adresse</span>
      </div>

      <FormField
        control={form.control}
        name="address.street"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>Rue et numéro</FormLabel>
            <FormControl>
              <Input
                {...field}
                className={inputClasses}
                placeholder="Rue de la Gare 15"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address.cityZip"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>NPA et localité</FormLabel>
            <FormControl>
              <Input
                {...field}
                className={inputClasses}
                placeholder="1000 Lausanne"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address.canton"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClasses}>Canton</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className={selectTriggerClasses}>
                  <SelectValue placeholder="Sélectionnez un canton" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={`max-h-[300px] ${darkMode ? 'bg-[#0d2847] border-white/20' : ''}`}>
                {CANTONS_SUISSES.map((canton) => (
                  <SelectItem
                    key={canton.value}
                    value={canton.value}
                    className={`py-3 ${darkMode ? 'text-white focus:bg-white/10 focus:text-white' : ''}`}
                  >
                    {canton.label}
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
