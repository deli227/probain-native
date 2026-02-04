import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'action';
  category: string;
  event: string;
  message?: string;
  metadata?: Record<string, unknown>;
  duration_ms?: number;
  error_stack?: string;
}

interface BufferedLog extends LogEntry {
  user_id: string | null;
  profile_type: string | null;
  session_id: string;
  device_info: Record<string, unknown>;
  created_at: string;
}

const generateSessionId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
};

const collectDeviceInfo = (): Record<string, unknown> => {
  try {
    return {
      userAgent: navigator.userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      is_dev: !import.meta.env.PROD,
    };
  } catch {
    return { is_dev: !import.meta.env.PROD };
  }
};

class AppLogger {
  private buffer: BufferedLog[] = [];
  private userId: string | null = null;
  private profileType: string | null = null;
  private sessionId: string;
  private deviceInfo: Record<string, unknown>;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  constructor() {
    this.sessionId = generateSessionId();
    this.deviceInfo = collectDeviceInfo();
    this.startFlushTimer();
    this.setupBeforeUnload();
  }

  setUser(userId: string, profileType: string | null) {
    this.userId = userId;
    this.profileType = profileType;
  }

  clearUser() {
    this.flush();
    this.userId = null;
    this.profileType = null;
  }

  logAction(category: string, event: string, message?: string, metadata?: Record<string, unknown>) {
    this.addToBuffer({ level: 'action', category, event, message, metadata });
  }

  logError(category: string, event: string, error: unknown, metadata?: Record<string, unknown>) {
    let errorStack: string | undefined;
    let errorMessage: string | undefined;

    if (error instanceof Error) {
      errorStack = error.stack;
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }

    this.addToBuffer({ level: 'error', category, event, message: errorMessage, metadata, error_stack: errorStack });
  }

  logNavigation(from: string, to: string) {
    this.addToBuffer({ level: 'info', category: 'navigation', event: 'nav.page', message: `${from} -> ${to}`, metadata: { from, to } });
  }

  logInfo(category: string, event: string, message?: string, metadata?: Record<string, unknown>) {
    this.addToBuffer({ level: 'info', category, event, message, metadata });
  }

  logWarn(category: string, event: string, message?: string, metadata?: Record<string, unknown>) {
    this.addToBuffer({ level: 'warn', category, event, message, metadata });
  }

  private addToBuffer(entry: LogEntry) {
    const bufferedLog: BufferedLog = {
      ...entry,
      user_id: this.userId,
      profile_type: this.profileType,
      session_id: this.sessionId,
      device_info: this.deviceInfo,
      created_at: new Date().toISOString(),
    };

    this.buffer.push(bufferedLog);
    logger.log(`[appLogger] ${entry.level}:${entry.event}`, entry.message || '', entry.metadata || '');

    if (this.buffer.length >= 10) {
      this.flush();
    }
  }

  private startFlushTimer() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000);
  }

  private setupBeforeUnload() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushSync();
        }
      });
    }
  }

  async flush() {
    if (this.buffer.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      const { error } = await supabase.from('app_logs').insert(
        logsToSend.map((log) => ({
          user_id: log.user_id,
          profile_type: log.profile_type,
          session_id: log.session_id,
          level: log.level,
          category: log.category,
          event: log.event,
          message: log.message || null,
          metadata: log.metadata || {},
          device_info: log.device_info,
          duration_ms: log.duration_ms || null,
          error_stack: log.error_stack || null,
        }))
      );

      if (error) {
        logger.warn('[appLogger] Flush failed, will retry:', error.message);
        this.buffer = [...logsToSend, ...this.buffer];
      }
    } catch (err: unknown) {
      logger.warn('[appLogger] Flush error, will retry:', err instanceof Error ? err.message : String(err));
      this.buffer = [...logsToSend, ...this.buffer];
    } finally {
      this.isFlushing = false;
    }
  }

  private flushSync() {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey && navigator.sendBeacon) {
        const payload = JSON.stringify(
          logsToSend.map((log) => ({
            user_id: log.user_id,
            profile_type: log.profile_type,
            session_id: log.session_id,
            level: log.level,
            category: log.category,
            event: log.event,
            message: log.message || null,
            metadata: log.metadata || {},
            device_info: log.device_info,
            duration_ms: log.duration_ms || null,
            error_stack: log.error_stack || null,
          }))
        );

        const blob = new Blob([payload], { type: 'application/json' });
        const url = `${supabaseUrl}/rest/v1/app_logs`;

        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: blob,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Silent fail during unload
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

export const appLogger = new AppLogger();
