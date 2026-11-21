import { Link, NavLink } from "react-router";
import { icons } from "../icons";
import { NEW_PATIENT_PATH, PHONE_TABS } from "./nav-items";

// Phone only: bottom tab bar and the round "+" button for a new patient.
export function BottomTabs() {
  return (
    <>
      <Link to={NEW_PATIENT_PATH} className="shell-fab" aria-label="New patient">
        {icons.plus}
      </Link>
      <nav className="shell-tabs" aria-label="Main">
        {PHONE_TABS.map((item) => (
          <NavLink key={item.to} to={item.to} end>
            {icons[item.icon]}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
