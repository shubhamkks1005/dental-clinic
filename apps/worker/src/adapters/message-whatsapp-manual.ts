import type { MessageChannel, MessageSendResult } from "./message-channel";

/**
 * Manual WhatsApp (7.2.2 / T8): does not send. Dispatcher sets needs_human;
 * receptionist opens wa.me in the browser.
 */
export function createManualWhatsAppAdapter(): MessageChannel {
  return {
    name: "whatsapp_manual",
    async send(): Promise<MessageSendResult> {
      return { ok: false, retryable: false, errorCode: "needs_human" };
    },
    async getState() {
      return "unknown";
    },
    async health() {
      return { ok: true, note: "Manual wa.me — receptionist sends." };
    },
  };
}
