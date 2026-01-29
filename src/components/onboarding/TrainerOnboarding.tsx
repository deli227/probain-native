import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CANTONS_SUISSES, OnboardingFormData } from "./OnboardingWizard";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { PhotoPickerSheet } from "@/components/shared/PhotoPickerSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TrainerOnboardingProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData) => void;
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploading: boolean;
}

export const TrainerOnboarding = ({ 
  formData, 
  setFormData, 
  handleAvatarUpload,
  uploading 
}: TrainerOnboardingProps) => {
  const [step, setStep] = useState(0);

  const { isPickerOpen, openPicker, setPickerOpen, desktopInputRef, handleFileSelected } = usePhotoPicker({
    onFileSelected: handleAvatarUpload,
  });

  const isStepValid = () => {
    switch (step) {
      case 0:
        return formData.organizationName?.length >= 2;
      case 1:
        return true; // Avatar est optionnel
      case 2:
        return formData.description?.length >= 10;
      case 3:
        return formData.address?.street?.length >= 5;
      case 4:
        return formData.address?.cityZip?.length >= 4;
      case 5:
        return formData.address?.canton?.length >= 2;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quel est le nom de votre organisation ?</h2>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nom de l'organisation</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                placeholder="Entrez le nom de votre organisation"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ajoutez un logo</h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white/90 rounded-lg shadow-lg overflow-hidden">
                  <AvatarImage 
                    src={formData.avatarUrl || "/placeholder.svg"}
                    alt="Logo"
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-lg">
                    {formData.organizationName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openPicker}
                  onKeyDown={(e) => e.key === 'Enter' && openPicker()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg
                           opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <Upload className="w-6 h-6 text-white" />
                </div>
                {/* Desktop fallback input */}
                <input
                  ref={desktopInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">
                Cliquez sur l'image pour télécharger un logo
              </p>
              <PhotoPickerSheet
                open={isPickerOpen}
                onOpenChange={setPickerOpen}
                onFileSelected={handleFileSelected}
                uploading={uploading}
                cameraFacing="environment"
                title="Logo"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Décrivez votre organisation</h2>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre organisation, vos services..."
                className="min-h-[150px]"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quelle est votre adresse ?</h2>
            <div className="space-y-2">
              <Label htmlFor="street">Rue et numéro</Label>
              <Input
                id="street"
                value={formData.address?.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
                placeholder="Entrez votre adresse"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quel est votre NPA et lieu ?</h2>
            <div className="space-y-2">
              <Label htmlFor="cityZip">NPA/Lieu</Label>
              <Input
                id="cityZip"
                value={formData.address?.cityZip}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, cityZip: e.target.value }
                })}
                placeholder="Ex: 1200 Genève"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Dans quel canton êtes-vous situé ?</h2>
            <div className="space-y-2">
              <Select onValueChange={(value) => setFormData({
                ...formData,
                address: { ...formData.address, canton: value }
              })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un canton" />
                </SelectTrigger>
                <SelectContent>
                  {CANTONS_SUISSES.map((canton) => (
                    <SelectItem key={canton.value} value={canton.value}>
                      {canton.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
      <div className="flex justify-between mt-8">
        {step > 0 && (
          <Button onClick={() => setStep(step - 1)} variant="outline">
            Précédent
          </Button>
        )}
        {step < 5 ? (
          <Button 
            onClick={() => isStepValid() && setStep(step + 1)}
            className="ml-auto"
          >
            Suivant
          </Button>
        ) : null}
      </div>
    </div>
  );
};
