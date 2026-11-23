import type { MessageChannel, MessageSendResult } from "./message-channel";

/**
 * Stub for a future SMS gateway / DLT provider (7.2.2).
 * Never integrates a real provider in Phase 7 (owner: no card / no DLT).
 */
export function createSmsGatewayStubAdapter(): MessageChannel {
  return {
    name: "sms_gateway_stub",
    async send(): Promise<MessageSendResult> {
      return {
        ok: false,
        retryable: false,
        errorCode: "sms_provider_not_configured",
      };
    },
    async getState() {
      return "unknown";
    },
    async health() {
      return { ok: false, note: "No SMS provider configured (dry_run / waiting on SIM)." };
    },
  };
}
