import { displayMobile } from "@clinic/shared";
import { FLYER, timerList } from "./motion";

export type FlyerPatient = { name: string; code: string; mobile: string | null };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .slice(0, 2)
    .join("") || "?";

function makeFlyer(p: FlyerPatient): HTMLElement {
  const el = document.createElement("div");
  el.className = "cal-scope cal-flyer";
  el.setAttribute("aria-hidden", "true");
  const left = document.createElement("div");
  left.className = "cal-flyer-left";
  const ini = document.createElement("span");
  ini.className = "cal-initials cal-initials-lg";
  ini.textContent = initials(p.name);
  const who = document.createElement("div");
  who.className = "cal-flyer-who";
  const line = document.createElement("div");
  line.className = "cal-flyer-line";
  const name = document.createElement("span");
  name.className = "cal-flyer-name";
  name.textContent = p.name;
  const code = document.createElement("span");
  code.className = "cal-code-chip";
  code.textContent = p.code;
  line.append(name, code);
  const mob = document.createElement("span");
  mob.className = "cal-flyer-mobile";
  mob.textContent = p.mobile ? `+91 ${displayMobile(p.mobile)}` : "No mobile";
  who.append(line, mob);
  left.append(ini, who);
  el.append(left);
  return el;
}

const px = (n: number) => `${Math.round(n)}px`;

/**
 * Save & Book (HTML 1378-1525, M15-M19): the name + mobile box lifts (320 ms), the panels slide
 * back at 320 ms, the copy docks onto the selected-patient box at 760 ms (260 ms), and at 1050 ms
 * the copy is removed and the real box shows (fixes L18). Returns a cancel for unmount.
 */
export function runFlyer(opts: {
  source: HTMLElement;
  patient: FlyerPatient;
  highlight: HTMLElement[];
  slideBack: () => void;
  target: () => HTMLElement | null;
  done: () => void;
}): () => void {
  const timers = timerList();
  const start = opts.source.getBoundingClientRect();
  const flyer = makeFlyer(opts.patient);
  Object.assign(flyer.style, {
    transition: "none",
    left: px(start.left),
    top: px(start.top),
    width: px(start.width),
    height: px(start.height),
    padding: "0.75rem 1rem",
    opacity: "0.85",
    transform: "translateY(0px) scale(0.99)",
  });
  document.body.appendChild(flyer);
  for (const el of opts.highlight) el.classList.add("cal-input-highlight");
  requestAnimationFrame(() => {
    flyer.style.transition =
      "transform 320ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 320ms cubic-bezier(0.4, 0, 0.2, 1)";
    flyer.style.transform = "translateY(-14px) scale(1.02)";
    flyer.style.boxShadow = "0 16px 24px -5px rgba(0, 0, 0, 0.2)";
  });
  timers.at(FLYER.slideAt, () => {
    for (const el of opts.highlight) el.classList.remove("cal-input-highlight");
    opts.slideBack();
  });
  timers.at(FLYER.dockAt, () => {
    const box = opts.target()?.getBoundingClientRect();
    if (!box) return;
    flyer.style.transition = "all 260ms cubic-bezier(0.4, 0, 0.2, 1)";
    Object.assign(flyer.style, {
      left: px(box.left),
      top: px(box.top),
      width: px(box.width),
      height: px(box.height),
      transform: "translateY(0px) scale(1)",
      opacity: "1",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      padding: "0.5rem",
    });
  });
  timers.at(FLYER.doneAt, () => {
    flyer.remove();
    opts.done();
  });
  return () => {
    timers.clear();
    flyer.remove();
    for (const el of opts.highlight) el.classList.remove("cal-input-highlight");
  };
}
