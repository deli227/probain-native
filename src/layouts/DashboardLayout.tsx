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
    <div className="min-h-screen bg-primary-dark md:bg-[#0a1628]">
      {/* Orbes lumineuses - visibles uniquement sur desktop */}
      <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 left-1/5 w-[350px] h-[350px] bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar - visible uniquement sur desktop */}
      <Sidebar profileType={profileType} />

      {/* Contenu principal */}
      <div className="pb-20 md:pb-0 md:pl-64 relative z-10">
        <div className="md:max-w-[1400px] md:mx-auto">
          {children}
        </div>
      </div>

      {/* Bottom Tab Bar - visible uniquement sur mobile */}
      <BottomTabBar profileType={profileType} />

      {/* Animations CSS desktop */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
