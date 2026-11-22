import type { NewStaff, StaffMember, StaffRole } from "@clinic/shared";
import { api } from "../../api/client";

// Every change replies with the fresh staff list. Each change sends the version the doctor saw.
type Reply = { staff: StaffMember[] };
const staffOf = (reply: Reply) => reply.staff;
const BASE = "/api/staff/users";

function change(member: StaffMember, action: string, body: object = {}) {
  return api<Reply>(`${BASE}/${encodeURIComponent(member.id)}/${action}`, {
    method: "POST",
    body: { ...body, version: member.version },
  }).then(staffOf);
}

export const getStaff = () => api<Reply>(BASE).then(staffOf);
export const addStaff = (input: NewStaff) =>
  api<Reply>(BASE, { method: "POST", body: input }).then(staffOf);
export const deactivate = (member: StaffMember) => change(member, "deactivate");
export const reactivate = (member: StaffMember) => change(member, "reactivate");
export const changeRole = (member: StaffMember, role: StaffRole) =>
  change(member, "role", { role });
export const resetGoogleLink = (member: StaffMember, email: string) =>
  change(member, "google-reset", { email });
