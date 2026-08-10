import { supabase } from "../lib/supabaseClient";

export async function logAuditEvent(eventName: string, targetType?: string, targetId?: string) {
  await supabase.rpc("log_audit_event", {
    event_name: eventName,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    event_metadata: {},
  });
}
