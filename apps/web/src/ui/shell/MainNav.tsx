import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { icons } from "../icons";
import { Logo } from "../Logo";
import type { NavItem } from "./nav-items";
import { sampleClinic } from "./sample-session";

// Laptop: navy sidebar with the user card at the bottom. Tablet: a row of top tabs (the user card
// is in the top bar). Phone: hidden (BottomTabs instead).
export function MainNav({ items, user }: { items: NavItem[]; user: ReactNode }) {
  return (
    <nav className="shell-nav" aria-label="Main">
      <div className="nav-brand">
        <Logo />
        <span>
          <span className="nav-clinic">{sampleClinic.name}</span>
          <span className="nav-tagline small">{sampleClinic.tagline}</span>
        </span>
      </div>
      <ul className="nav-list">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.to === "/app"}>
              {icons[item.icon]}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="nav-user">{user}</div>
    </nav>
  );
}
