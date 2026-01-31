/**
 * DecorativeOrbs - Orbes lumineuses animees reutilisables
 *
 * Centralise les 3 variantes d'orbes decoratives utilisees dans l'app :
 * - "sheet" : orbes pour les Sheet/dialogs (petites, blur-3xl)
 * - "page" : orbes pour les pages full-screen avec radial-gradient (grandes)
 * - "desktop" : orbes pour le DashboardLayout desktop (tres grandes, blur-3xl)
 */

interface DecorativeOrbsProps {
  variant: 'sheet' | 'page' | 'desktop';
}

export const DecorativeOrbs = ({ variant }: DecorativeOrbsProps) => {
  if (variant === 'sheet') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(37, 99, 235, 0.2) 40%, transparent 70%)',
            animation: 'pulse-glow 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 70%)',
            animation: 'float-slow 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 70%)',
            animation: 'float-slow 10s ease-in-out infinite reverse',
          }}
        />
      </div>
    );
  }

  // variant === 'desktop'
  return (
    <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 left-[20%] w-[350px] h-[350px] bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
    </div>
  );
};
