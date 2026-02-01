import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { hapticFeedback } from '@/lib/native';

/** Routes des onglets par type de profil (meme ordre que BottomTabBar) */
const TAB_ROUTES: Record<string, string[]> = {
  maitre_nageur: ['/profile', '/jobs', '/training', '/rescuer/mail', '/flux'],
  formateur: ['/trainer-profile', '/trainer-profile/students', '/trainer-profile/mail', '/flux'],
  etablissement: ['/establishment-profile', '/establishment-profile/announcements', '/establishment-profile/rescuers', '/establishment-profile/mail', '/flux'],
};

/** Pages profil exclues du swipe (contiennent des carousels horizontaux) */
const SWIPE_EXCLUDED_ROUTES = ['/profile', '/trainer-profile', '/establishment-profile', '/establishment-profile/announcements'];

/** Seuil minimal de deplacement horizontal en pixels */
const SWIPE_THRESHOLD = 50;
/** Ratio minimum horizontal/vertical pour distinguer un swipe d'un scroll */
const DIRECTION_RATIO = 1.5;

/**
 * Hook qui detecte les swipes horizontaux sur mobile et navigue entre les onglets.
 * Utilise des event listeners natifs sur document pour capturer les gestes
 * meme au-dessus d'elements scrollables.
 */
export function useSwipeNavigation(profileType: string | null) {
  const location = useLocation();
  const navigate = useNavigate();

  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const locked = useRef<'horizontal' | 'vertical' | null>(null);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!profileType) return;

    // Ne pas swiper sur les pages profil (carousels horizontaux)
    if (SWIPE_EXCLUDED_ROUTES.includes(location.pathname)) return;

    const routes = TAB_ROUTES[profileType];
    if (!routes) return;

    const currentIndex = routes.indexOf(location.pathname);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= routes.length) return;

    hapticFeedback('light');
    navigate(routes[nextIndex]);
  }, [profileType, location.pathname, navigate]);

  useEffect(() => {
    // Desktop : pas de swipe
    const mql = window.matchMedia('(max-width: 767px)');
    if (!mql.matches) return;

    const onTouchStart = (e: TouchEvent) => {
      // Ignorer les multi-touch
      if (e.touches.length !== 1) return;

      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
      locked.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking.current || e.touches.length !== 1) return;

      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Verrouiller la direction des le premier mouvement significatif (10px)
      if (!locked.current && (absDx > 10 || absDy > 10)) {
        locked.current = absDx > absDy ? 'horizontal' : 'vertical';
      }

      // Si le geste est vertical, arreter le tracking pour ne pas interferer avec le scroll
      if (locked.current === 'vertical') {
        tracking.current = false;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;

      // Utiliser changedTouches pour le point final
      const endX = e.changedTouches[0]?.clientX ?? startX.current;
      const endY = e.changedTouches[0]?.clientY ?? startY.current;

      const dx = endX - startX.current;
      const dy = endY - startY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Verifier que c'est un swipe horizontal : distance suffisante et ratio directionnel ok
      if (absDx < SWIPE_THRESHOLD) return;
      if (absDy > 0 && absDx / absDy < DIRECTION_RATIO) return;

      handleSwipe(dx < 0 ? 'left' : 'right');
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleSwipe]);
}
