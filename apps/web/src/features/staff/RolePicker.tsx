import { STAFF_ROLES, type StaffRole } from "@clinic/shared";
import { ROLE_LABEL } from "../../ui/role-label";
import { Radio } from "../../ui/form";

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
          <Radio
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
