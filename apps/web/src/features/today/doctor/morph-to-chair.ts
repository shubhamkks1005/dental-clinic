/**
 * Start: the row flies into the "In chair now" card (design: executeStartPatient, 520 ms, "Moving
 * to chair..."). `onLanded` runs when the card should show the new patient (500 ms in);
 * `onEnd` after the ghost is gone (640 ms). With prefers-reduced-motion nothing flies: both run
 * at once. Returns a function that undoes the animation (the server said no).
 */
export function morphToChair(
  row: HTMLElement,
  card: HTMLElement,
  who: { name: string; line: string },
  hooks: { onLanded: () => void; onEnd: () => void },
): () => void {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (reduce) {
    hooks.onLanded();
    hooks.onEnd();
    return () => undefined;
  }
  const from = row.getBoundingClientRect();
  const to = card.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "td-ghost";
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
  });
  const label = document.createElement("div");
  label.className = "td-ghost-label";
  label.textContent = "Moving to chair…";
  const name = document.createElement("div");
  name.className = "td-ghost-name";
  name.textContent = who.name;
  const line = document.createElement("div");
  line.className = "td-ghost-line";
  line.textContent = who.line;
  ghost.append(label, name, line);
  document.body.appendChild(ghost);
  row.style.opacity = "0";
  card.classList.add("is-swapping");

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      Object.assign(ghost.style, {
        left: `${to.left}px`,
        top: `${to.top}px`,
        width: `${to.width}px`,
        height: `${to.height}px`,
        backgroundColor: "#054d61",
        color: "#ffffff",
        borderColor: "rgba(255,255,255,0.28)",
        boxShadow: "0 22px 44px -10px rgba(5, 77, 97, 0.55)",
      });
    }),
  );
  const landed = window.setTimeout(() => {
    card.classList.remove("is-swapping");
    card.classList.add("is-receiving");
    ghost.style.transition = "opacity 140ms ease";
    ghost.style.opacity = "0";
    hooks.onLanded();
  }, 500);
  const end = window.setTimeout(() => {
    ghost.remove();
    card.classList.remove("is-receiving");
    row.style.opacity = "";
    hooks.onEnd();
  }, 640);
  return () => {
    window.clearTimeout(landed);
    window.clearTimeout(end);
    ghost.remove();
    row.style.opacity = "";
    card.classList.remove("is-swapping", "is-receiving");
  };
}
