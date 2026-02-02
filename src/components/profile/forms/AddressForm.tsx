import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { formSchema } from "../ProfileForm";
import * as z from "zod";
import { MapPin } from "lucide-react";
import { CantonCombobox } from "@/components/shared/CantonCombobox";

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
            <CantonCombobox
              value={field.value || ""}
              onValueChange={field.onChange}
              placeholder="Sélectionnez un canton"
              darkMode={darkMode}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
