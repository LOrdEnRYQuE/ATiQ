import { createClient } from "./supabaseClient";

let cachedSessionId: string | null = null;

function generateUUID() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  if (cachedSessionId) return cachedSessionId;
  const existing = sessionStorage.getItem("vibe-session-id");
  if (existing) {
    cachedSessionId = existing;
    return existing;
  }
  const id = generateUUID();
  sessionStorage.setItem("vibe-session-id", id);
  cachedSessionId = id;
  return id;
}

type TelemetryEvent =
  | { type: "CRASH_REPAIRED"; model?: string; success: boolean; error_signature?: string; metadata?: Record<string, unknown> }
  | { type: "REPAIR_FAILED"; model?: string; success: false; error_signature?: string; metadata?: Record<string, unknown> }
  | { type: "PROMPT_USED"; model?: string; prompt_version?: string; metadata?: Record<string, unknown> }
  | { type: "CRASH"; error_signature?: string; metadata?: Record<string, unknown> }
  | { type: "FEATURE_USED"; feature: string; metadata?: Record<string, unknown> }
  | { type: "SESSION_START"; metadata?: Record<string, unknown> }
  | { type: "SESSION_END"; metadata?: Record<string, unknown> };

export async function logTelemetry(event: TelemetryEvent) {
  try {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = {
      user_id: user?.id || null,
      session_id: getSessionId(),
      event_type: event.type,
      model: ("model" in event) ? event.model || null : null,
      success: "success" in event ? event.success : null,
      error_signature: "error_signature" in event ? event.error_signature || null : null,
      event_data: event.metadata || {},
      duration_ms: null,
      created_at: new Date().toISOString()
    };

    // Fire-and-forget; do not block UI
    void supabase.from("telemetry_logs").insert(payload);
  } catch (error) {
    // Silently fail to not break the app
    console.warn('Failed to log telemetry:', error);
  }
}

export async function trackActiveSession() {
  try {
    const supabase = createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sessionId = getSessionId();
    
    // Upsert active session
    await supabase.from('active_sessions').upsert({
      user_id: user.id,
      session_id: sessionId,
      last_seen: new Date().toISOString(),
      metadata: {
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timestamp: Date.now()
      }
    });

    // Set up heartbeat
    if (typeof window !== 'undefined') {
      const heartbeat = setInterval(async () => {
        try {
          await supabase.from('active_sessions')
            .update({ last_seen: new Date().toISOString() })
            .eq('session_id', sessionId);
        } catch {
          // Silently fail
        }
      }, 30000); // Every 30 seconds

      // Cleanup on page unload
      const cleanup = () => {
        clearInterval(heartbeat);
        void supabase.from('active_sessions').delete().eq('session_id', sessionId);
        void logTelemetry({ type: 'SESSION_END' });
      };

      window.addEventListener('beforeunload', cleanup);
      window.addEventListener('pagehide', cleanup);
    }
  } catch (error) {
    console.warn('Failed to track active session:', error);
  }
}

export async function createSupportTicket(
  issueType: 'CRASH' | 'BUG' | 'FEATURE_REQUEST' | 'HELP',
  title: string,
  description: string
) {
  try {
    const supabase = createClient();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      session_id: getSessionId(),
      issue_type: issueType,
      title,
      description,
      status: 'open',
      priority: issueType === 'CRASH' ? 'high' : 'medium'
    }).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    return null;
  }
}

// Enhanced telemetry functions for specific events
export const telemetry = {
  crash: (errorSignature: string, metadata?: Record<string, unknown>) => 
    logTelemetry({ type: 'CRASH', error_signature: errorSignature, metadata }),
    
  crashRepaired: (model: string, success: boolean, errorSignature?: string, metadata?: Record<string, unknown>) =>
    logTelemetry({ type: 'CRASH_REPAIRED', model, success, error_signature: errorSignature, metadata }),
    
  repairFailed: (model: string, errorSignature: string, metadata?: Record<string, unknown>) =>
    logTelemetry({ type: 'REPAIR_FAILED', model, success: false, error_signature: errorSignature, metadata }),
    
  featureUsed: (feature: string, metadata?: Record<string, unknown>) =>
    logTelemetry({ type: 'FEATURE_USED', feature, metadata }),
    
  promptUsed: (model: string, promptVersion: string, metadata?: Record<string, unknown>) =>
    logTelemetry({ type: 'PROMPT_USED', model, prompt_version: promptVersion, metadata }),
    
  sessionStart: (metadata?: Record<string, unknown>) =>
    logTelemetry({ type: 'SESSION_START', metadata }),
    
  sessionEnd: () =>
    logTelemetry({ type: 'SESSION_END' })
};
