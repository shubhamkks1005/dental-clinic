import { describe, expect, it } from "vitest";
import { createFakeMessageAdapter } from "./message-fake";
import { createManualWhatsAppAdapter } from "./message-whatsapp-manual";
import { createSmsGatewayStubAdapter } from "./message-sms-stub";
import type { MessageChannel, MessageSendInput } from "./message-channel";

const sample: MessageSendInput = {
  id: "msg1",
  toMobile: "+919876543210",
  body: "Dear Meena, test.",
};

async function contract(adapter: MessageChannel) {
  const health = await adapter.health();
  expect(typeof health.ok).toBe("boolean");
  const result = await adapter.send(sample);
  expect(typeof result.ok).toBe("boolean");
  if (!result.ok) expect(typeof result.errorCode).toBe("string");
  const state = await adapter.getState("any");
  expect(["unknown", "sent", "delivered", "failed"]).toContain(state);
}

describe("MessageChannel adapters (7.2.2)", () => {
  it("FakeAdapter succeeds", async () => {
    const fake = createFakeMessageAdapter();
    await contract(fake);
    const r = await fake.send(sample);
    expect(r.ok).toBe(true);
  });

  it("FakeAdapter can fail retryable", async () => {
    const fake = createFakeMessageAdapter({ failWith: { retryable: true, errorCode: "timeout" } });
    const r = await fake.send(sample);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryable).toBe(true);
  });

  it("ManualWhatsAppAdapter returns needs_human", async () => {
    const wa = createManualWhatsAppAdapter();
    await contract(wa);
    const r = await wa.send(sample);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorCode).toBe("needs_human");
  });

  it("SmsGatewayStub refuses live send", async () => {
    const sms = createSmsGatewayStubAdapter();
    await contract(sms);
    const r = await sms.send(sample);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorCode).toBe("sms_provider_not_configured");
  });
});
