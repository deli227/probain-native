import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { CalendarIcon, Upload, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CANTONS_SUISSES, OnboardingFormData } from "./OnboardingWizard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RescuerOnboardingProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData) => void;
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  uploading: boolean;
}

export const RescuerOnboarding = ({
  formData,
  setFormData,
  handleAvatarUpload,
  uploading
}: RescuerOnboardingProps) => {
  const [step, setStep] = useState(0);

  // États pour le calendrier de date de naissance
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | undefined>(formData.birthDate);
  const [currentYear, setCurrentYear] = useState<number>(
    formData.birthDate ? new Date(formData.birthDate).getFullYear() : 1990
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(
    formData.birthDate ? new Date(formData.birthDate) : new Date(1990, 0, 1)
  );

  // Génération d'une liste d'années depuis 1920 jusqu'à l'année actuelle
  const years = Array.from({ length: new Date().getFullYear() - 1920 + 1 }, (_, i) => 1920 + i).reverse();

  const isStepValid = () => {
    switch (step) {
      case 0:
        return formData.firstName?.length >= 2;
      case 1:
        return formData.lastName?.length >= 2;
      case 2:
        return formData.birthDate instanceof Date;
      case 3:
        return true;
      case 4:
        return formData.address?.street?.length >= 5;
      case 5:
        return formData.address?.cityZip?.length >= 4;
      case 6:
        return formData.address?.canton?.length >= 2;
      default:
        return true;
    }
  };

  const handleFormUpdate = (field: string, value: string | Date) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quel est votre prénom ?</h2>
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleFormUpdate('firstName', e.target.value)}
                placeholder="Entrez votre prénom"
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quel est votre nom ?</h2>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleFormUpdate('lastName', e.target.value)}
                placeholder="Entrez votre nom"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quelle est votre date de naissance ?</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTempSelectedDate(formData.birthDate);
                  setIsCalendarOpen(true);
                }}
                className="w-full justify-start text-left font-normal"
              >
                {formData.birthDate ? (
                  format(formData.birthDate, "dd MMMM yyyy", { locale: fr })
                ) : (
                  <span className="text-muted-foreground">Sélectionnez une date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>

              {isCalendarOpen && (
                <div
                  className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setIsCalendarOpen(false);
                    }
                  }}
                >
                  <div
                    className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const prevYear = Math.max(currentYear - 1, 1920);
                          setCurrentYear(prevYear);
                          const newMonth = new Date(currentMonth);
                          newMonth.setFullYear(prevYear);
                          setCurrentMonth(newMonth);
                        }}
                        title="Année précédente"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Select
                        value={currentYear.toString()}
                        onValueChange={(year) => {
                          const yearValue = parseInt(year);
                          setCurrentYear(yearValue);
                          const newMonth = new Date(currentMonth);
                          newMonth.setFullYear(yearValue);
                          setCurrentMonth(newMonth);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder={currentYear.toString()} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const nextYear = Math.min(currentYear + 1, new Date().getFullYear());
                          setCurrentYear(nextYear);
                          const newMonth = new Date(currentMonth);
                          newMonth.setFullYear(nextYear);
                          setCurrentMonth(newMonth);
                        }}
                        disabled={currentYear >= new Date().getFullYear()}
                        title="Année suivante"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={tempSelectedDate}
                      onSelect={(date) => {
                        setTempSelectedDate(date);
                        if (date) {
                          setCurrentMonth(date);
                          setCurrentYear(date.getFullYear());
                        }
                      }}
                      onMonthChange={(month) => {
                        setCurrentMonth(month);
                        setCurrentYear(month.getFullYear());
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      month={currentMonth}
                      initialFocus
                      locale={fr}
                    />
                    <div className="p-3 border-t flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempSelectedDate(undefined);
                          handleFormUpdate("birthDate", undefined);
                          setIsCalendarOpen(false);
                        }}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Effacer
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleFormUpdate("birthDate", tempSelectedDate);
                          setIsCalendarOpen(false);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Valider
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Ajoutez une photo de profil</h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white/90 rounded-full shadow-lg overflow-hidden">
                  <AvatarImage 
                    src={formData.avatarUrl || "/placeholder.svg"} 
                    alt="Photo de profil"
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-lg">
                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                <label 
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full 
                           opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  htmlFor="avatar-upload"
                >
                  <Upload className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">
                Cliquez sur l'image pour télécharger une photo
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quelle est votre adresse ?</h2>
            <div className="space-y-2">
              <Label htmlFor="street">Rue et numéro</Label>
              <Input
                id="street"
                value={formData.address?.street}
                onChange={(e) => handleFormUpdate('address.street', e.target.value)}
                placeholder="Entrez votre adresse"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Quel est votre NPA et lieu ?</h2>
            <div className="space-y-2">
              <Label htmlFor="cityZip">NPA/Lieu</Label>
              <Input
                id="cityZip"
                value={formData.address?.cityZip}
                onChange={(e) => handleFormUpdate('address.cityZip', e.target.value)}
                placeholder="Ex: 1200 Genève"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Dans quel canton habitez-vous ?</h2>
            <div className="space-y-2">
              <Select onValueChange={(value) => handleFormUpdate('address.canton', value)}>
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
        {step < 6 ? (
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
