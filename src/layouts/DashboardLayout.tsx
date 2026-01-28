import { ReactNode } from "react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";

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
 *
 * Desktop (>= 768px):
 * - Sidebar fixe a gauche (256px)
 * - Contenu decale avec md:pl-64
 */
export const DashboardLayout = ({ children, profileType }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-blue-50">
      {/* Sidebar - visible uniquement sur desktop */}
      <Sidebar profileType={profileType} />

      {/* Contenu principal */}
      {/* pb-20 sur mobile pour laisser place a la bottom tab bar */}
      {/* md:pb-0 sur desktop car pas de bottom bar */}
      {/* md:pl-64 sur desktop pour laisser place a la sidebar */}
      <div className="pb-20 md:pb-0 md:pl-64">
        {children}
      </div>

      {/* Bottom Tab Bar - visible uniquement sur mobile */}
      <BottomTabBar profileType={profileType} />
    </div>
  );
};

export default DashboardLayout;
