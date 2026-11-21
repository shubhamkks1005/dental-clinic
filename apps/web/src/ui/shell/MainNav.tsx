import { NavLink } from "react-router";
import { icons } from "../icons";
import { Logo } from "../Logo";
import { MAIN_NAV } from "./nav-items";
import { sampleClinic, sampleUser } from "./sample-session";

// Laptop: navy sidebar. Tablet: a row of top tabs. Phone: hidden (BottomTabs instead).
export function MainNav() {
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
        {MAIN_NAV.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end>
              {icons[item.icon]}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="nav-user">
        <span className="nav-avatar">{sampleUser.initials}</span>
        <span>
          <span className="nav-user-name">{sampleUser.name}</span>
          <span className="small">{sampleUser.role}</span>
        </span>
      </div>
    </nav>
  );
}
