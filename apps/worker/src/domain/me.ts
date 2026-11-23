import { permissionsFor, type SessionRow } from "@clinic/db";

// What the staff app needs about the signed-in person: header text and which screens to show.
export function meView(session: SessionRow) {
  const { id, name, role } = session.user;
  return { id, name, role, permissions: permissionsFor(role) };
}
