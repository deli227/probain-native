import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";

// Définition du schéma pour le formulaire établissement
export const establishmentFormSchema = z.object({
  organization: z.object({
    name: z.string().min(1, "Le nom est requis"),
    website: z.string().optional(),
    facebookUrl: z.string().optional(),
    instagramUrl: z.string().optional(),
    linkedinUrl: z.string().optional(),
  }),
  address: z.object({
    street: z.string().optional(),
    cityZip: z.string().optional(),
    canton: z.string().optional()
  })
});

interface OrganizationFormProps {
  form: UseFormReturn<z.infer<typeof establishmentFormSchema>>;
  isEstablishmentProfile?: boolean;
}

export const OrganizationForm = ({ form, isEstablishmentProfile = false }: OrganizationFormProps) => {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="organization.name"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-primary font-semibold">Nom de l'organisation</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white focus:ring-primary" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="organization.website"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-primary font-semibold">Site web</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white focus:ring-primary" placeholder="https://" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="organization.facebookUrl"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-primary font-semibold">Facebook</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white focus:ring-primary" placeholder="https://" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="organization.instagramUrl"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-primary font-semibold">Instagram</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white focus:ring-primary" placeholder="https://" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="organization.linkedinUrl"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="text-primary font-semibold">LinkedIn</FormLabel>
            <FormControl>
              <Input {...field} className="bg-white focus:ring-primary" placeholder="https://" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};