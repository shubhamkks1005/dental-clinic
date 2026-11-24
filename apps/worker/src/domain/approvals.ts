import type { Repos } from "@clinic/db";
import {
  answerApprovalSchema,
  createApprovalSchema,
  versionBodySchema,
  type Role,
} from "@clinic/shared";

// Part T: the desk asks the doctor; the doctor answers. Only the answer is recorded.
const firstIssue = (e: { issues: { message: string }[] }) =>
  e.issues[0]?.message ?? "Check the form.";

export async function createApproval(repos: Repos, body: unknown) {
  const parsed = createApprovalSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, message: firstIssue(parsed.error) };
  return { ok: true as const, ...(await repos.approvals.createApproval(parsed.data)) };
}

/** The doctor sees what is waiting; the desk sees the requests it sent. */
export async function listApprovals(repos: Repos, role: Role) {
  return role === "doctor"
    ? repos.approvals.listOpenApprovals()
    : repos.approvals.listMyApprovals();
}

export async function answerApproval(repos: Repos, id: string, body: unknown) {
  const parsed = answerApprovalSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, message: firstIssue(parsed.error) };
  const { decision, note, version } = parsed.data;
  return {
    ok: true as const,
    answer: await repos.approvals.answerApproval(id, decision, note, version),
  };
}

export async function dismissApproval(repos: Repos, id: string, body: unknown) {
  const parsed = versionBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, message: firstIssue(parsed.error) };
  return {
    ok: true as const,
    answer: await repos.approvals.dismissApproval(id, parsed.data.version),
  };
}

export const withdrawApproval = (repos: Repos, id: string) => repos.approvals.withdrawApproval(id);
