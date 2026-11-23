import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { signedIn } from "../http";
import type { AppEnv } from "../types";
import {
  cancelMessage,
  createOneOffPatientMessage,
  dumpQueuedSmsToWhatsApp,
  markMessageDoneManual,
  messagesBoard,
  messagingStatus,
  openMessageInWhatsApp,
  patientMessages,
  sendAppointmentMessageNow,
} from "../domain/staff-messages";

export const staffMessages = new Hono<AppEnv>();

staffMessages.get("/messages/board", async (c) => {
  const board = await messagesBoard(signedIn(c).repos);
  return c.json(ok(board));
});

staffMessages.get("/messages/status", async (c) => {
  const status = await messagingStatus(signedIn(c).repos, c.env.MESSAGING_MODE);
  return c.json(ok(status));
});

staffMessages.post("/messages/dump-to-whatsapp", async (c) => {
  const result = await dumpQueuedSmsToWhatsApp(signedIn(c).repos);
  return c.json(ok(result));
});

staffMessages.post("/messages/:id/open-whatsapp", async (c) => {
  const result = await openMessageInWhatsApp(
    signedIn(c).repos,
    c.req.param("id"),
    c.env.MESSAGING_MODE,
  );
  return c.json(ok(result));
});

staffMessages.post("/messages/:id/done-manual", async (c) => {
  const result = await markMessageDoneManual(signedIn(c).repos, c.req.param("id"));
  return c.json(ok(result));
});

staffMessages.post("/messages/:id/cancel", async (c) => {
  const result = await cancelMessage(signedIn(c).repos, c.req.param("id"));
  return c.json(ok(result));
});

staffMessages.get("/patients/:id/messages", async (c) => {
  const result = await patientMessages(signedIn(c).repos, c.req.param("id"));
  return c.json(ok(result));
});

staffMessages.post("/patients/:id/messages", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const templateKey =
    typeof body === "object" && body && "templateKey" in body
      ? String((body as { templateKey: unknown }).templateKey)
      : "";
  if (!templateKey) return c.json(fail("invalid", "Pick a message template."), 400);
  const result = await createOneOffPatientMessage(
    signedIn(c).repos,
    c.req.param("id"),
    templateKey,
    c.env.MESSAGING_MODE,
  );
  return c.json(ok(result), 201);
});

staffMessages.post("/appointments/:id/messages/send-now", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const kind =
    typeof body === "object" && body && "kind" in body
      ? String((body as { kind: unknown }).kind)
      : "confirm";
  if (!["confirm", "remind", "cancel", "reschedule"].includes(kind)) {
    return c.json(fail("invalid", "Pick confirm, remind, cancel or reschedule."), 400);
  }
  const result = await sendAppointmentMessageNow(
    signedIn(c).repos,
    c.req.param("id"),
    kind as "confirm" | "remind" | "cancel" | "reschedule",
    c.env.MESSAGING_MODE,
  );
  return c.json(ok(result), 201);
});
