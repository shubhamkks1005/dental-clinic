import { createDb, createRepos } from "@clinic/db";
import { planMessages, type PlanAppointment, type PlanConsent } from "@clinic/shared";
import type { Bindings } from "../types";
import {
  buildBody,
  enqueuePlanned,
  loadMessagingConfig,
  messagingMode,
  patientFirstName,
  pickAdapter,
} from "../domain/messages";

const SYSTEM_CTX = { userId: "system", role: "doctor" as const, requestId: "cron-messaging" };

/** 7.2.5 dispatcher branch — dry_run / WhatsApp manual only in Phase 7. */
export async function runMessagingTick(
  env: Bindings,
  now = new Date(),
): Promise<{
  planned: number;
  claimed: number;
  dispatched: number;
}> {
  const mode = messagingMode(env.MESSAGING_MODE);
  const db = createDb(env.DB);
  const repos = createRepos(db, SYSTEM_CTX);
  const { settings, templates, clinicName, clinicPhone } = await loadMessagingConfig(repos);

  if (!settings.enabled) return { planned: 0, claimed: 0, dispatched: 0 };

  const horizon = new Date(now.getTime() + 36 * 3600_000);
  const fromDay = now.toISOString().slice(0, 10);
  const toDay = horizon.toISOString().slice(0, 10);

  const apptRows = await repos.messagesPlan.listAppointmentsForPlan(fromDay, toDay);
  const patientIds = [...new Set(apptRows.map((a) => a.patientId))];
  const latestConsent = await repos.messagesPlan.latestSmsReminderConsent(patientIds);
  const nameByPatient = await repos.messagesPlan.patientNames(patientIds);

  const planAppts: PlanAppointment[] = apptRows.map((a) => ({
    id: a.id,
    patientId: a.patientId,
    dateLocal: a.dateLocal,
    startMin: a.startMin,
    status: a.status,
    startAt: a.startAt,
  }));
  const planConsents: PlanConsent[] = patientIds.map((id) => ({
    patientId: id,
    smsReminders: latestConsent.get(id) === true,
  }));

  const planned = planMessages({
    appointments: planAppts,
    consents: planConsents,
    settings,
    now,
  });

  const apptById = new Map(planAppts.map((a) => [a.id, a]));
  let plannedCount = 0;
  for (const p of planned) {
    const appt = p.appointmentId ? apptById.get(p.appointmentId) : undefined;
    const body = buildBody({
      templates,
      planned: p,
      firstName: patientFirstName(nameByPatient.get(p.patientId) ?? "Patient"),
      clinicName,
      clinicPhone,
      dateLocal: appt?.dateLocal,
      startMin: appt?.startMin,
    });
    const res = await enqueuePlanned(repos, p, {
      body,
      settings,
      mode,
      audit: false,
    });
    if (res.created) plannedCount += 1;
  }

  const limit = Math.min(settings.dispatchPerTick, 30);
  const claimed = await repos.messages.claimDue(now.toISOString(), limit);
  let dispatched = 0;
  for (const row of claimed) {
    const adapter = pickAdapter(row.channel, mode);
    const toMobile = (await repos.messagesPlan.patientMobile(row.patientId)) ?? "";
    const result = await adapter.send({
      id: row.id,
      toMobile,
      body: row.body,
    });
    await repos.messages.recordAttempt({
      outboxId: row.id,
      attemptNo: row.attempts,
      at: now.toISOString(),
      adapter: adapter.name,
      result: result.ok ? "ok" : result.errorCode,
      errorCode: result.ok ? null : result.errorCode,
    });
    if (result.ok) {
      await repos.messages.setStatus(row.id, mode === "dry_run" ? "dry_run" : "sent", {
        providerId: result.providerId,
      });
    } else if (!result.ok && result.errorCode === "needs_human") {
      await repos.messages.setStatus(row.id, "needs_human");
    } else if (!result.ok && result.retryable) {
      await repos.messages.setStatus(row.id, "queued", { lastErrorCode: result.errorCode });
    } else if (!result.ok) {
      await repos.messages.setStatus(row.id, "failed", { lastErrorCode: result.errorCode });
    }
    dispatched += 1;
  }

  return { planned: plannedCount, claimed: claimed.length, dispatched };
}
