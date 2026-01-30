import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LOGO_PATH } from "@/utils/constants";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useFluxNotifications } from "@/hooks/useFluxNotifications";
import { cn } from "@/lib/utils";
import {
  User,
  Users,
  Mail,
  Settings,
  Newspaper,
  LogOut,
  Megaphone,
  GraduationCap,
  Briefcase,
  Home,
} from "lucide-react";

interface SidebarProps {
  profileType: 'formateur' | 'etablissement' | 'maitre_nageur';
}

export const Sidebar = ({ profileType }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { unreadCount: unreadMessages } = useUnreadMessages();
  const { newPostsCount, markAsSeen: markFluxAsSeen } = useFluxNotifications();

  const handleLogout = useCallback(async () => {
    try {
      queryClient.clear();
      sessionStorage.removeItem('training_search_state');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Deconnexion reussie",
        description: "A bientot !",
      });
      navigate('/auth', { replace: true });
    } catch {
      toast({
        title: "Erreur",
        description: "Un probleme est survenu lors de la deconnexion",
        variant: "destructive",
      });
    }
  }, [navigate, toast, queryClient]);

  // Liens selon le profil
  const getLinks = () => {
    if (profileType === 'formateur') {
      return [
        { href: '/trainer-profile', icon: Home, label: 'Dashboard' },
        { href: '/trainer-profile/students', icon: Users, label: 'Mes Eleves' },
        { href: '/trainer-profile/mail', icon: Mail, label: 'Messagerie', badge: unreadMessages },
        { href: '/flux', icon: Newspaper, label: 'Flux', badge: newPostsCount, onClick: markFluxAsSeen },
        { href: '/settings', icon: Settings, label: 'Parametres' },
      ];
    }

    if (profileType === 'etablissement') {
      return [
        { href: '/establishment-profile', icon: Home, label: 'Dashboard' },
        { href: '/establishment-profile/announcements', icon: Megaphone, label: 'Mes Annonces' },
        { href: '/establishment-profile/rescuers', icon: Users, label: 'Sauveteurs' },
        { href: '/establishment-profile/mail', icon: Mail, label: 'Messagerie', badge: unreadMessages },
        { href: '/flux', icon: Newspaper, label: 'Flux', badge: newPostsCount, onClick: markFluxAsSeen },
        { href: '/settings', icon: Settings, label: 'Parametres' },
      ];
    }

    // Sauveteur
    return [
      { href: '/profile', icon: User, label: 'Mon Profil' },
      { href: '/training', icon: GraduationCap, label: 'Me Former' },
      { href: '/jobs', icon: Briefcase, label: 'Trouver du Travail' },
      { href: '/rescuer/mail', icon: Mail, label: 'Messagerie', badge: unreadMessages },
      { href: '/flux', icon: Newspaper, label: 'Flux', badge: newPostsCount, onClick: markFluxAsSeen },
      { href: '/settings', icon: Settings, label: 'Parametres' },
    ];
  };

  const links = getLinks();

  const isActive = (href: string) => {
    if (href === '/trainer-profile' || href === '/establishment-profile' || href === '/profile') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-white/5 backdrop-blur-xl border-r border-white/10 z-40">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <img src={LOGO_PATH} alt="Probain" className="h-8 w-auto relative z-10" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Probain</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={link.onClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative",
                active
                  ? "bg-white/10 text-white border-l-2 border-cyan-400 shadow-lg shadow-cyan-500/5"
                  : "text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-cyan-400")} />
              <span className="flex-1">{link.label}</span>
              {link.badge && link.badge > 0 && (
                <Badge className={cn(
                  "h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold rounded-full",
                  link.label === 'Flux' ? "bg-blue-500" : "bg-red-500"
                )}>
                  {link.badge > 9 ? '9+' : link.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Deconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
