import type { ReactNode } from "react";
import { NavLink } from "react-router";

export type NavItem = { to: string; label: string };

type Props = { title: string; nav: NavItem[]; children: ReactNode };

export function AppShell({ title, nav, children }: Props) {
  return (
    <div className="shell">
      <header className="shell-header">
        <h1 className="shell-title">{title}</h1>
      </header>
      <nav className="shell-nav" aria-label="Main">
        <ul>
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="shell-main">{children}</main>
    </div>
  );
}
