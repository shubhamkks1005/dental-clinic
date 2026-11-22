import type { Repos } from "@clinic/db";
import type { NewStaff, StaffMember, StaffRole } from "@clinic/shared";

// Settings > Staff (1.3.6). Permission and guards live in the staff repository. Every change
// replies with the fresh list, so the screen always shows what is saved.
export type StaffChange =
  | { kind: "deactivate" | "reactivate"; version: number }
  | { kind: "role"; role: StaffRole; version: number }
  | { kind: "google_reset"; email: string; version: number };

export const listStaff = (repos: Repos): Promise<StaffMember[]> => repos.staff.list();

export async function addStaff(repos: Repos, input: NewStaff): Promise<StaffMember[]> {
  await repos.staff.add(input);
  return repos.staff.list();
}

export async function changeStaff(
  repos: Repos,
  id: string,
  change: StaffChange,
): Promise<StaffMember[]> {
  const { staff } = repos;
  switch (change.kind) {
    case "deactivate":
      await staff.deactivate(id, change.version);
      break;
    case "reactivate":
      await staff.reactivate(id, change.version);
      break;
    case "role":
      await staff.changeRole(id, change.role, change.version);
      break;
    case "google_reset":
      await staff.resetGoogleLink(id, change.email, change.version);
  }
  return staff.list();
}
