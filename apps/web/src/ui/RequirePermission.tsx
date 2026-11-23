import type { ReactNode } from "react";
import { useMe } from "../features/auth";
import { PageMessage } from "./PageMessage";

/**
 * Q1.11: one permission page for every screen a role may not open, so nobody lands on a blank page
 * or an unexplained error. The server still refuses the data; this is the sentence the person reads.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { permissions } = useMe();
  if (!permissions.includes(permission)) {
    return (
      <PageMessage
        title="Not available for your role"
        text="You do not have permission to open this page. Ask the doctor if you need it."
      />
    );
  }
  return <>{children}</>;
}
