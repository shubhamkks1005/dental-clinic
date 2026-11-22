import type { Role } from "@clinic/shared";
import { newUlid } from "@clinic/shared";
import type { Db } from "./client";
import { authRepo, type StaffUser } from "./repos/auth";
import { users } from "./schema";

// LOCAL DEVELOPMENT ONLY (imported as @clinic/db/dev by apps/worker/src/dev/ and nothing else).
// Creates a fake staff user so the dev login stub works on an empty local database.
export async function ensureDevUser(db: Db, role: Exclude<Role, "developer">): Promise<StaffUser> {
  const email = `dev-${role}@example.test`;
  await db
    .insert(users)
    .values({
      id: newUlid(),
      email,
      name: role === "doctor" ? "Dev Doctor" : "Dev Receptionist",
      role,
      createdBy: "system",
      updatedBy: "system",
    })
    .onConflictDoNothing({ target: users.email });
  const user = await authRepo(db).findStaffByEmail(email);
  if (!user) throw new Error("Dev user could not be created");
  return user;
}
