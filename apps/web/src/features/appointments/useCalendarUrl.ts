import { istDate } from "@clinic/shared";
import { useSearchParams } from "react-router";

const validDate = (raw: string | null) => (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null);

function parseBookMin(raw: string | null): number | undefined {
  if (raw === null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < 1440 ? n : undefined;
}

// Calendar state kept in the URL: ?date, ?view=day|week, ?doctors=id,id (none = "none"; absent =
// all, P5.2.1), and the booking links other pages use: ?book=1|<minute>&patient=<id>.
export function useCalendarUrl() {
  const [params, setParams] = useSearchParams();
  const today = istDate(new Date());
  const date = validDate(params.get("date")) ?? today;
  const rawDoctors = params.get("doctors");
  const doctors: string[] | null =
    rawDoctors === null ? null : rawDoctors === "none" ? [] : rawDoctors.split(",").filter(Boolean);
  const bookMin = parseBookMin(params.get("book"));
  const patientId = params.get("patient") || undefined;
  const wantBook = bookMin !== undefined || Boolean(patientId) || params.get("book") === "1";

  function update(change: (p: URLSearchParams) => void) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        change(next);
        return next;
      },
      { replace: true },
    );
  }

  return {
    today,
    date,
    view: params.get("view"),
    doctors,
    book: wantBook ? { startMin: bookMin, patientId } : null,
    setDate: (d: string) => update((p) => p.set("date", d)),
    setView: (v: "day" | "week", d?: string) =>
      update((p) => {
        p.set("view", v);
        if (d) p.set("date", d);
      }),
    setDoctors: (ids: string[] | null) =>
      update((p) => {
        if (ids === null) p.delete("doctors");
        else p.set("doctors", ids.length ? ids.join(",") : "none");
      }),
    clearBook: () =>
      update((p) => {
        p.delete("book");
        p.delete("patient");
      }),
  };
}
