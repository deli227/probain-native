import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AddressForm } from "./AddressForm";
import { OrganizationForm } from "./OrganizationForm";
import { Loader2 } from "lucide-react";
import { ChangePasswordSection } from "./ChangePasswordSection";

const establishmentFormSchema = z.object({
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

type EstablishmentFormValues = z.infer<typeof establishmentFormSchema>;

interface EstablishmentProfileFormProps {
  onSubmit: (values: EstablishmentFormValues) => void;
  defaultValues?: EstablishmentFormValues;
  isSubmitting?: boolean;
}

export const EstablishmentProfileForm = ({ 
  onSubmit,
  defaultValues,
  isSubmitting = false
}: EstablishmentProfileFormProps) => {
  const form = useForm<EstablishmentFormValues>({
    resolver: zodResolver(establishmentFormSchema),
    defaultValues: defaultValues || {
      organization: {
        name: "",
        website: "",
        facebookUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
      },
      address: {
        street: "",
        cityZip: "",
        canton: ""
      }
    }
  });

  const handleSubmit = async (values: EstablishmentFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <OrganizationForm form={form} isEstablishmentProfile={true} />
        <AddressForm form={form} />
        
        <ChangePasswordSection />

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      </form>
    </Form>
  );
};