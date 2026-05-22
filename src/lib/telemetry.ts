import * as Sentry from '@sentry/react';

export interface LatencyLog {
  id: string;
  action: string;
  durationMs: number;
  success: boolean;
  timestamp: string;
}

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  timestamp: string;
  context?: any;
}

type TelemetryListener = () => void;

class TelemetryService {
  private latencies: LatencyLog[] = [];
  private errors: ErrorLog[] = [];
  private listeners: Set<TelemetryListener> = new Set();
  private sentryInitialized = false;

  public init() {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (dsn) {
      try {
        Sentry.init({
          dsn,
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
              maskAllText: false,
              blockAllMedia: false,
            }),
          ],
          // Performance Monitoring
          tracesSampleRate: 1.0,
          // Session Replay
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        });
        this.sentryInitialized = true;
        console.log("Sentry monitoring initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize Sentry:", err);
      }
    } else {
      console.log("Sentry DSN not found. Remote monitoring disabled.");
    }

    // Set up global error event listeners
    window.addEventListener('error', (event) => {
      // Extract error details safely
      const error = event.error || event.message;
      this.recordError(error, { source: 'window.onerror' });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason || 'Unhandled Promise Rejection';
      this.recordError(reason, { source: 'window.onunhandledrejection' });
    });
  }

  public getLatencies(): LatencyLog[] {
    return this.latencies;
  }

  public getErrors(): ErrorLog[] {
    return this.errors;
  }

  public subscribe(listener: TelemetryListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  public recordLatency(action: string, durationMs: number, success: boolean) {
    const log: LatencyLog = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      action,
      durationMs,
      success,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.latencies = [log, ...this.latencies].slice(0, 50);
    this.notify();

    if (this.sentryInitialized) {
      Sentry.withScope((scope) => {
        scope.setTag("action", action);
        scope.setTag("success", success.toString());
        scope.setExtra("durationMs", durationMs);
        Sentry.captureMessage(`API Latency: ${action} - ${durationMs}ms`, 'info');
      });
    }
  }

  public recordError(error: any, context?: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const log: ErrorLog = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toLocaleTimeString(),
      context,
    };
    this.errors = [log, ...this.errors].slice(0, 50);
    this.notify();

    if (this.sentryInitialized) {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setExtras(context);
        }
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureException(new Error(errorMessage));
        }
      });
    }
  }

  public isSentryActive(): boolean {
    return this.sentryInitialized;
  }
}

export const telemetry = new TelemetryService();
