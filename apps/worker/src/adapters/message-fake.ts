import type { MessageChannel, MessageSendInput, MessageSendResult } from "./message-channel";

/** Tests and MESSAGING_MODE=dry_run — never leaves the process. */
export function createFakeMessageAdapter(opts?: {
  failWith?: { retryable: boolean; errorCode: string };
  delayMs?: number;
}): MessageChannel {
  return {
    name: "fake",
    async send(msg: MessageSendInput): Promise<MessageSendResult> {
      if (opts?.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      if (opts?.failWith) {
        return {
          ok: false,
          retryable: opts.failWith.retryable,
          errorCode: opts.failWith.errorCode,
        };
      }
      return { ok: true, providerId: `fake-${msg.id}` };
    },
    async getState() {
      return "delivered";
    },
    async health() {
      return { ok: true };
    },
  };
}
