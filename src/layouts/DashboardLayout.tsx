import { ReactNode } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { DecorativeOrbs } from "@/components/shared/DecorativeOrbs";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface DashboardLayoutProps {
  children: ReactNode;
  profileType: 'formateur' | 'etablissement' | 'maitre_nageur';
}

/**
 * DashboardLayout - Layout responsive pour l'application
 *
 * Mobile (< 768px):
 * - Contenu avec padding-bottom pour la bottom tab bar
 * - BottomTabBar fixe en bas de l'ecran
 * - Swipe horizontal pour changer d'onglet
 *
 * Desktop (>= 768px):
 * - Sidebar fixe a gauche (256px)
 * - Contenu decale avec md:pl-64
 */
export const DashboardLayout = ({ children, profileType }: DashboardLayoutProps) => {
  // Swipe horizontal entre onglets sur mobile
  useSwipeNavigation(profileType);
  return (
    <div className="min-h-screen bg-primary-dark md:bg-[#0a1628]">
      <DecorativeOrbs variant="desktop" />

      {/* Sidebar - visible uniquement sur desktop */}
      <Sidebar profileType={profileType} />

      {/* Contenu principal — pb-28 (112px) couvre BottomTabBar (76px) + safe-area (jusqu'a 34px) */}
      <div className="pb-28 md:pb-0 md:pl-64 relative z-10">
        <div className="md:max-w-[1400px] md:mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom Tab Bar - visible uniquement sur mobile */}
      <BottomTabBar profileType={profileType} />


    </div>
  );
};

export default DashboardLayout;
