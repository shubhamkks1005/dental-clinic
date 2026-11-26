import { CalIcon } from "../CalIcon";

// Popover footer (HTML 780-801): Cancel on the left; the two action groups cross-fade with the
// tab (M14, 300 ms), the hidden group is inert. Primary buttons press to scale .95 (M21).
export function BookFooter({
  tab,
  move,
  pending,
  onCancel,
  onBook,
  onSave,
}: {
  tab: "slot" | "new";
  move: boolean;
  pending: boolean;
  onCancel: () => void;
  onBook: () => void;
  onSave: (next: "only" | "book") => void;
}) {
  return (
    <div className="bk-foot">
      <button type="button" className="bk-btn" onClick={onCancel}>
        Cancel
      </button>
      <div className="bk-foot-right">
        <div className={`bk-actions${tab === "slot" ? " is-on" : ""}`} inert={tab !== "slot"}>
          <button
            type="button"
            className="bk-btn bk-btn-primary bk-press"
            disabled={pending}
            onClick={onBook}
          >
            <CalIcon name="event_available" />
            <span>
              {pending
                ? move
                  ? "Moving…"
                  : "Booking…"
                : move
                  ? "Move appointment"
                  : "Book Appointment"}
            </span>
          </button>
        </div>
        <div
          className={`bk-actions bk-actions-new${tab === "new" ? " is-on" : ""}`}
          inert={tab !== "new"}
        >
          <button type="button" className="bk-btn bk-btn-quiet" onClick={() => onSave("only")}>
            Save only
          </button>
          <button
            type="button"
            className="bk-btn bk-btn-primary bk-press"
            onClick={() => onSave("book")}
          >
            <CalIcon name="arrow_forward" />
            <span>Save &amp; Book</span>
          </button>
        </div>
      </div>
    </div>
  );
}
