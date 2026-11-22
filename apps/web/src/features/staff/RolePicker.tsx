import { STAFF_ROLES, type Role, type StaffRole } from "@clinic/shared";

export const ROLE_LABEL: Record<Role, string> = {
  doctor: "Doctor",
  receptionist: "Receptionist",
  developer: "Developer (support)",
};

// Two large radio buttons; the doctor can give only these two roles.
export function RolePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: StaffRole;
  onChange: (role: StaffRole) => void;
}) {
  return (
    <fieldset className="role-picker">
      <legend>Role</legend>
      {STAFF_ROLES.map((role) => (
        <label key={role} className="role-option">
          <input
            type="radio"
            name={name}
            value={role}
            checked={value === role}
            onChange={() => onChange(role)}
          />
          {ROLE_LABEL[role]}
        </label>
      ))}
    </fieldset>
  );
}
