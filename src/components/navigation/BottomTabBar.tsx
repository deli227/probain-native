import { memo, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, Briefcase, GraduationCap, Mail, Newspaper, Users, Megaphone } from "lucide-react";
import { useRescuerNotifications } from "@/hooks/use-rescuer-notifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useFluxNotifications } from "@/hooks/useFluxNotifications";
import { hapticFeedback } from "@/lib/native";

interface TabItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badgeCount?: number;
}

interface BottomTabBarProps {
  profileType: 'maitre_nageur' | 'formateur' | 'etablissement';
}

export const BottomTabBar = memo(({ profileType }: BottomTabBarProps) => {
  const location = useLocation();

  // Hooks pour notifications (sauveteur uniquement pour formations/emplois)
  const rescuerNotifications = useRescuerNotifications();
  const { unreadCount: unreadMessages } = useUnreadMessages();
  const { newPostsCount, markAsSeen: markFluxAsSeen } = useFluxNotifications();

  // Configuration des onglets selon le type de profil
  const tabs: TabItem[] = useMemo(() => {
    switch (profileType) {
      case 'maitre_nageur':
        return [
          { path: '/profile', icon: User, label: 'Profil' },
          { path: '/jobs', icon: Briefcase, label: 'Emplois', badgeCount: rescuerNotifications.counts.jobs },
          { path: '/training', icon: GraduationCap, label: 'Formations', badgeCount: rescuerNotifications.counts.formations },
          { path: '/rescuer/mail', icon: Mail, label: 'Messages', badgeCount: unreadMessages },
          { path: '/flux', icon: Newspaper, label: 'Flux', badgeCount: newPostsCount },
        ];

      case 'formateur':
        return [
          { path: '/trainer-profile', icon: User, label: 'Profil' },
          { path: '/trainer-profile/students', icon: Users, label: 'Eleves' },
          { path: '/trainer-profile/mail', icon: Mail, label: 'Messages', badgeCount: unreadMessages },
          { path: '/flux', icon: Newspaper, label: 'Flux', badgeCount: newPostsCount },
        ];

      case 'etablissement':
        return [
          { path: '/establishment-profile', icon: User, label: 'Profil' },
          { path: '/establishment-profile/announcements', icon: Megaphone, label: 'Annonces' },
          { path: '/establishment-profile/rescuers', icon: Users, label: 'Sauveteurs' },
          { path: '/establishment-profile/mail', icon: Mail, label: 'Messages', badgeCount: unreadMessages },
          { path: '/flux', icon: Newspaper, label: 'Flux', badgeCount: newPostsCount },
        ];

      default:
        return [];
    }
  }, [profileType, rescuerNotifications.counts, unreadMessages, newPostsCount]);

  // Verifier si un onglet est actif (match exact pour eviter les conflits de prefixes)
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Handler pour le flux (marquer comme vu) avec haptic feedback
  const handleTabClick = useCallback((path: string) => {
    const tabIsActive = isActive(path);

    // Haptic feedback natif sur changement d'onglet
    hapticFeedback(tabIsActive ? 'medium' : 'light');

    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Si l'onglet est deja actif, emettre un evenement de reset
    if (tabIsActive) {
      window.dispatchEvent(new CustomEvent('tabReset', { detail: { path } }));
    }

    if (path === '/flux') {
      markFluxAsSeen();
    }
  }, [markFluxAsSeen, location.pathname]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-primary z-[60] bottom-tab-bar-fix"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-[76px] px-3 pt-2" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          const hasBadge = tab.badgeCount !== undefined && tab.badgeCount > 0;
          const ariaLabel = hasBadge
            ? `${tab.label}, ${tab.badgeCount} notification${tab.badgeCount! > 1 ? 's' : ''}`
            : tab.label;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className="flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform duration-100"
              role="tab"
              aria-selected={active}
              aria-label={ariaLabel}
            >
              {/* Conteneur icone avec effet de profondeur */}
              <div
                className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-probain-yellow shadow-lg shadow-yellow-400/40 scale-105'
                    : 'bg-white/20 shadow-md'
                }`}
              >
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-white'
                  }`}
                  strokeWidth={active ? 2.2 : 1.8}
                />

                {/* Badge notification avec animation d'entrée */}
                {hasBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-probain-red rounded-full px-1 shadow-md border-2 border-primary badge-scale-in">
                    {tab.badgeCount! > 99 ? '99+' : tab.badgeCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-1 font-semibold tracking-wide transition-colors duration-200 ${
                active ? 'text-probain-yellow' : 'text-white/80'
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomTabBar.displayName = "BottomTabBar";
