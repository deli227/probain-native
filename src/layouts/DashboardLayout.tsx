import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";
import { DecorativeOrbs } from "@/components/shared/DecorativeOrbs";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface DashboardLayoutProps {
  children: ReactNode;
  navbar?: ReactNode;
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
export const DashboardLayout = ({ children, navbar, profileType }: DashboardLayoutProps) => {
  const location = useLocation();
  // Swipe horizontal entre onglets sur mobile
  useSwipeNavigation(profileType);
  return (
    <div className="min-h-screen bg-primary-dark md:bg-[#0a1628]">
      <DecorativeOrbs variant="desktop" />

      {/* Sidebar - visible uniquement sur desktop */}
      <Sidebar profileType={profileType} />

      {/* Contenu principal — .dashboard-bottom-safe gère le dégagement BottomTabBar + safe-area automatiquement sur mobile */}
      <div className="dashboard-bottom-safe md:pb-0 md:pl-64 relative z-10">
        {/* Navbar stable — ne remonte PAS lors des changements de route */}
        {navbar}
        <div className="md:max-w-[1400px] md:mx-auto">
          {/* Transition animée entre les pages (seul le contenu est remonté) */}
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar - visible uniquement sur mobile */}
      <BottomTabBar profileType={profileType} />
    </div>
  );
};

export default DashboardLayout;
