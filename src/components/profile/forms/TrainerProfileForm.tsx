import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AddressForm } from "./AddressForm";
import { OrganizationForm } from "./OrganizationForm";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const RegionEnum = z.enum(["nyon_la_cote", "geneve", "lausanne", "morges", "vaud"]);

export const trainerFormSchema = z.object({
  biography: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    cityZip: z.string().optional(),
    canton: z.string().optional(),
  }).optional(),
  organization: z.object({
    name: z.string().min(1, "Le nom de l'organisation est requis"),
    region: RegionEnum.optional(),
    website: z.string().url("URL invalide").optional().or(z.literal("")),
    facebookUrl: z.string().url("URL invalide").optional().or(z.literal("")),
    instagramUrl: z.string().url("URL invalide").optional().or(z.literal("")),
    linkedinUrl: z.string().url("URL invalide").optional().or(z.literal("")),
    description: z.string().optional(),
    certifications: z.array(z.string())
  })
});

interface TrainerProfileFormProps {
  defaultValues: z.infer<typeof trainerFormSchema>;
  onSubmit: (values: z.infer<typeof trainerFormSchema>) => Promise<void>;
}

export const TrainerProfileForm = ({ defaultValues, onSubmit }: TrainerProfileFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof trainerFormSchema>>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues,
  });

  const handleSubmit = async (values: z.infer<typeof trainerFormSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <AddressForm form={form} />
        <OrganizationForm form={form} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            "Sauvegarder"
          )}
        </Button>
      </form>
    </Form>
  );
};