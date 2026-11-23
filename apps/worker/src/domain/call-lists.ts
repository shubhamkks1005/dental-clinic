import type { Repos } from "@clinic/db";

export async function listCallList(repos: Repos, kind: string) {
  const rows = await repos.callLists.list(kind);
  return { rows };
}

export async function contactCallList(
  repos: Repos,
  kind: string,
  patientId: string,
  body: unknown,
) {
  return repos.callLists.contact(kind, patientId, body);
}
