import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Building2, Globe, Lock, Save } from "lucide-react";
import { useState } from "react";
import { ChangePasswordSection } from "./ChangePasswordSection";
import { DecorativeOrbs } from "@/components/shared/DecorativeOrbs";
import { CANTONS_SUISSES } from "@/utils/swissCantons";

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

  // Classes dark theme
  const labelClasses = "text-sm text-white/70";
  const inputClasses = "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all";
  const selectTriggerClasses = "bg-white/10 border-white/20 rounded-xl h-12 text-base text-white focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all [&>span]:text-white/40 [&[data-state=open]>span]:text-white";

  return (
    <div className="relative min-h-full bg-[#0a1628] -m-6 p-6">
      {/* Fond avec dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d2847] to-[#0a1628]" />

      <DecorativeOrbs variant="sheet" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="relative space-y-6 pb-44 md:pb-24">
          {/* Section Organisation */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/30 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="font-semibold text-white">Organisation</span>
            </div>

            {/* Nom organisation - LECTURE SEULE */}
            <FormField
              control={form.control}
              name="organization.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>Nom de l'organisation</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        disabled
                        className="bg-white/5 border-white/10 rounded-xl h-12 text-base text-white/50 cursor-not-allowed pr-10"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    </div>
                  </FormControl>
                  <p className="text-xs text-white/30 mt-1">Le nom de l'organisation ne peut pas être modifié</p>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="organization.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-white/10 border-white/20 rounded-xl text-base text-white placeholder:text-white/40 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 transition-all min-h-[100px] resize-none"
                      placeholder="Décrivez votre organisation..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section Liens */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center">
                <Globe className="h-4 w-4 text-blue-400" />
              </div>
              <span className="font-semibold text-white">Liens et réseaux</span>
            </div>

            <FormField
              control={form.control}
              name="organization.website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>Site web</FormLabel>
                  <FormControl>
                    <Input {...field} className={inputClasses} placeholder="https://www.example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization.facebookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>Facebook</FormLabel>
                  <FormControl>
                    <Input {...field} className={inputClasses} placeholder="https://facebook.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization.instagramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>Instagram</FormLabel>
                  <FormControl>
                    <Input {...field} className={inputClasses} placeholder="https://instagram.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization.linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>LinkedIn</FormLabel>
                  <FormControl>
                    <Input {...field} className={inputClasses} placeholder="https://linkedin.com/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Section Adresse */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/30 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-orange-400" />
              </div>
              <span className="font-semibold text-white">Adresse</span>
            </div>

            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>Rue et numéro</FormLabel>
                  <FormControl>
                    <Input {...field} className={inputClasses} placeholder="Rue de la Gare 15" />
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
                    <Input {...field} className={inputClasses} placeholder="1000 Lausanne" />
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
                    <SelectContent className="max-h-[300px] bg-[#0d2847] border-white/20">
                      {CANTONS_SUISSES.map((canton) => (
                        <SelectItem
                          key={canton.value}
                          value={canton.value}
                          className="py-3 text-white focus:bg-white/10 focus:text-white"
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

          {/* Section Mot de passe */}
          <ChangePasswordSection darkMode />

          {/* Bouton Sauvegarder fixe en bas */}
          <div className="fixed bottom-[100px] md:bottom-0 left-0 right-0 md:left-auto md:right-0 md:w-full md:max-w-xl p-4 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/95 to-transparent z-20">
            <Button
              type="submit"
              className="w-full md:max-w-sm md:mx-auto md:block h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Sauvegarder les modifications
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
