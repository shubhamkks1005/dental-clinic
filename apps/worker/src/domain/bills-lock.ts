import { InvalidError, type Repos } from "@clinic/db";
import { EXTRA_RETURNED_REASON, parseLockBill } from "@clinic/shared";

// Visit finished page (owner 2026-11-27): Lock = issue the invoice (number, locked) and use the
// patient's advance on it. If the patient paid more than the invoice, the doctor must say what
// happened to the extra first: "returned" records a refund of what is left, "advance" keeps it.
// Issue and refund are two writes (D1 has no cross-call transaction): when the refund fails after
// the issue, the reply says so plainly and the invoice stays locked (handoff L6).
export async function lockBill(repos: Repos, id: string, body: unknown) {
  const parsed = parseLockBill(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const { version, extra } = parsed.value;

  const bill = await repos.bills.get(id);
  // A second tap (or two at once): it is already locked. Same invoice, nothing done twice.
  if (bill.status === "issued") return { ok: true as const, bill, refundError: null };
  if (bill.status !== "draft") throw new InvalidError("This invoice is cancelled.");

  const left = await repos.payments.advanceLeft(bill.patientId);
  const advancePaise = left.reduce((s, x) => s + x.unallocatedPaise, 0);
  const extraPaise = Math.max(0, advancePaise - bill.totalPaise);
  if (extraPaise > 0 && !extra) {
    return { ok: false as const, message: "Choose Returned or Keep as advance." };
  }

  let issued;
  try {
    issued = await repos.bills.issue(id, version, { applyAdvance: advancePaise > 0 });
  } catch (e) {
    const now = await repos.bills.get(id);
    if (now.status === "issued") return { ok: true as const, bill: now, refundError: null };
    throw e;
  }
  if (extraPaise === 0 || extra !== "returned") {
    return { ok: true as const, bill: issued, refundError: null };
  }

  try {
    // What is left after the invoice took its share, newest payment first.
    let need = extraPaise;
    for (const slice of await repos.payments.advanceLeft(bill.patientId)) {
      if (need <= 0) break;
      const amountPaise = Math.min(need, slice.unallocatedPaise);
      await repos.refunds.record({
        paymentId: slice.paymentId,
        amountPaise,
        mode: slice.mode as Parameters<Repos["refunds"]["record"]>[0]["mode"],
        reason: EXTRA_RETURNED_REASON,
      });
      need -= amountPaise;
    }
    return { ok: true as const, bill: await repos.bills.get(id), refundError: null };
  } catch {
    return {
      ok: true as const,
      bill: issued,
      refundError: "Invoice locked. The return was not recorded: record it on the full invoice.",
    };
  }
}
