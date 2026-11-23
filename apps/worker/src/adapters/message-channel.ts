/** 7.2.2: provider interface — business code never talks to SMS/WhatsApp APIs directly. */

export type MessageSendInput = {
  id: string;
  /** E.164 (+91…) — adapters must not log this. */
  toMobile: string;
  body: string;
  /** Seconds until expire (gateway ttl). */
  ttlSeconds?: number;
};

export type MessageSendResult =
  | { ok: true; providerId: string }
  | { ok: false; retryable: boolean; errorCode: string; providerId?: string };

export type MessageChannel = {
  readonly name: string;
  send(msg: MessageSendInput): Promise<MessageSendResult>;
  getState(providerId: string): Promise<"unknown" | "sent" | "delivered" | "failed">;
  health(): Promise<{ ok: boolean; note?: string }>;
};
