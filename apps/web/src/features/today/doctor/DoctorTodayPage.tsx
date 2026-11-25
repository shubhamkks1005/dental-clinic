import { useEffect, useState } from "react";
import { icons } from "../../../ui/icons";
import { useMe } from "../../auth";
import { CancelMissedDialog, QuickBookDialog } from "../../appointments";
import { useToast } from "../../../ui/Toast";
import { shortName } from "../../../ui/names";
import { istDate, formatClockTime } from "@clinic/shared";
import { BreakBanner } from "./BreakBanner";
import { ChairCard } from "./ChairCard";
import { BreakWarning, ConfirmSheet, LateSheet } from "./DoctorDialogs";
import { DoctorHeader } from "./DoctorHeader";
import { DoctorList } from "./DoctorList";
import type { DoctorRow } from "./doctor-model";
import { PopMenu, type PopItem } from "./PopMenu";
import { useDoctorActions } from "./useDoctorActions";
import { useDoctorToday } from "./useDoctorToday";
import { WaitingPanel } from "./WaitingPanel";
import "./doctor-tokens.css";
import "./doctor-motion.css";
import "./doctor-layout.css";
import "./doctor-list.css";

/** The doctor's Today page (final design docs/design/final/doctor_today.html). */
export function DoctorTodayPage() {
  const me = useMe();
  const toast = useToast();
  const data = useDoctorToday(me.permissions.includes("requests.view"));
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [menu, setMenu] = useState<{ row: DoctorRow; button: HTMLButtonElement } | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [animating, setAnimating] = useState(false);
  const model = data.model;
  const act = useDoctorActions({
    model: model ?? EMPTY,
    patch: data.patch,
    load: data.load,
    hide: data.hide,
  });

  // One search box: the top bar's is hidden while this page is open.
  useEffect(() => {
    document.documentElement.dataset.doctorToday = "1";
    return () => {
      delete document.documentElement.dataset.doctorToday;
    };
  }, []);

  if (!model) {
    return (
      <div className="today-doc td-page" aria-busy={!data.error}>
        {data.error ? (
          <p className="notice notice-error" role="alert">
            {data.error}
          </p>
        ) : (
          <div className="td-skeleton" aria-label="Loading today">
            <span className="td-sk td-sk-head" />
            <span className="td-sk td-sk-card" />
            <span className="td-sk td-sk-list" />
          </div>
        )}
      </div>
    );
  }

  const next = model.rows.find((r) => r.isNext) ?? null;
  const startBlocked = model.chair ? "Finish the visit in the chair first" : null;
  const toggle = (minimize: boolean) => {
    setAnimating(true);
    setMinimized(minimize);
  };

  const rowMenu: PopItem[] = menu
    ? [
        ...(model.rows.indexOf(menu.row) > 0
          ? [
              {
                key: "pull",
                label: "Pull forward (see next)",
                icon: icons.arrowUp,
                onSelect: () => act.pull(menu.row),
              },
            ]
          : []),
        {
          key: "skip",
          label: "Skip (stepped out)",
          icon: icons.walk,
          onSelect: () => act.skip(menu.row),
        },
        {
          key: "late",
          label: "Late arrived",
          icon: icons.clock,
          onSelect: () => act.setLateRow(menu.row),
        },
        {
          key: "missed",
          label: "Missed",
          icon: icons.personOff,
          onSelect: () => act.setCancelRow({ row: menu.row, mode: "missed" }),
        },
        {
          key: "resched",
          label: "Reschedule",
          icon: icons.eventRepeat,
          onSelect: () => act.setRescheduleRow(menu.row),
        },
        {
          key: "cancel",
          label: "Cancel appointment",
          icon: icons.cancel,
          tone: "danger",
          divider: true,
          onSelect: () => act.setCancelRow({ row: menu.row, mode: "cancel" }),
        },
      ]
    : [];

  const restore = (
    <button
      type="button"
      className={`td-btn td-restore${minimized ? "" : " is-hidden"}`}
      aria-hidden={!minimized}
      tabIndex={minimized ? 0 : -1}
      onClick={() => toggle(false)}
    >
      <span className="td-ic" aria-hidden="true">
        {icons.panelOpen}
      </span>
      Waiting for you
      <span className="td-badge">{data.items.length}</span>
    </button>
  );

  return (
    <div className="today-doc td-page">
      <BreakBanner
        current={model.currentBreak}
        doctorName={shortName(me.name)}
        busy={act.breakBusy}
        onAdjust={(d) => model.currentBreak && void act.changeBreak(model.currentBreak, d)}
        onBack={() => model.currentBreak && void act.backFromBreak(model.currentBreak)}
      />
      {data.error && !data.updatedAt ? (
        <p className="notice notice-error" role="alert">
          {data.error}
        </p>
      ) : null}
      <DoctorHeader
        model={model}
        now={data.now}
        updatedAt={data.updatedAt}
        refreshFailed={data.error !== null}
        breakNow={model.currentBreak}
        breakBlocked={model.chair ? "Finish the visit in the chair first" : null}
        onStartBreak={(m, l) => void act.takeBreak(m, l)}
        onHide={setHidden}
        onJump={act.jump}
      />
      <ChairCard
        chair={model.chair}
        spotlight={model.chair?.id === act.spotlightId}
        opening={act.openingId !== null}
        finishing={act.finishing}
        nextName={next?.name ?? null}
        done={model.done}
        onBreak={model.currentBreak !== null}
        breakBack={model.currentBreak ? act.breakBackLabel(model.currentBreak) : ""}
        onStartNext={next && !model.chair ? () => act.start(next) : undefined}
        onOpenVisit={() => model.chair && void act.openVisit(model.chair)}
        onDone={() => void act.finishChair()}
      />
      <div
        className={`td-split${animating ? " is-animating" : ""}`}
        onTransitionEnd={() => setAnimating(false)}
      >
        <DoctorList
          model={model}
          hiddenIds={hidden}
          spotlightId={act.spotlightId}
          liftedId={act.liftedId}
          removingIds={act.removingIds}
          cancelledIds={act.cancelledIds}
          startBlocked={startBlocked}
          restore={restore}
          onOpen={(r) => void act.openVisit(r)}
          onStart={act.start}
          onBack={(r) => act.move(r, "step-back")}
          onMenu={(row, button) => setMenu(menu?.row.id === row.id ? null : { row, button })}
        />
        <WaitingPanel
          items={data.items}
          freshKeys={data.freshKeys}
          minimized={minimized}
          animating={animating}
          onResolve={act.resolve}
          onMinimize={() => toggle(true)}
        />
      </div>

      <PopMenu
        label={`Actions for ${menu?.row.name ?? "patient"}`}
        open={menu !== null}
        anchor={menu?.button ?? null}
        items={rowMenu}
        onClose={() => setMenu(null)}
      />
      <ConfirmSheet state={act.confirm} onClose={() => act.setConfirm(null)} />
      <LateSheet
        row={act.lateRow}
        onClose={() => act.setLateRow(null)}
        onToday={(r) => act.move(r, "late", `${r.name} is back in the queue.`)}
        onAnotherDay={act.setRescheduleRow}
        onNotComing={(r) => act.setCancelRow({ row: r, mode: "cancel" })}
      />
      <BreakWarning
        row={act.breakWarn}
        back={model.currentBreak ? act.breakBackLabel(model.currentBreak) : ""}
        onClose={() => act.setBreakWarn(null)}
        onAnyway={act.startAhead}
      />
      {act.cancelRow ? (
        <CancelMissedDialog
          open
          mode={act.cancelRow.mode}
          patientName={act.cancelRow.row.name}
          appointment={act.cancelRow.row}
          onClose={() => act.setCancelRow(null)}
          onStart={() => {
            const row = act.cancelRow?.row;
            act.setCancelRow(null);
            if (row) act.markCancelled(row);
          }}
          onFail={(message) => {
            const row = act.cancelRow?.row;
            if (row) act.undoCancelled(row, message);
          }}
          onDone={(text) => toast({ text })}
        />
      ) : null}
      {act.rescheduleRow ? (
        <QuickBookDialog
          open
          prefill={{
            dateLocal: istDate(new Date()),
            patientId: act.rescheduleRow.patientId,
            visitTypeId: act.rescheduleRow.visitTypeId,
          }}
          reschedule={{ id: act.rescheduleRow.id, version: act.rescheduleRow.version }}
          onClose={() => act.setRescheduleRow(null)}
          onBooked={(slot) => {
            toast({ text: `Moved to ${slot.dateLocal}, ${formatClockTime(slot.startMin)}` });
            act.setRescheduleRow(null);
            data.load();
          }}
        />
      ) : null}
    </div>
  );
}

const EMPTY = {
  chair: null,
  rows: [],
  waiting: 0,
  notArrived: 0,
  done: 0,
  total: 0,
  lateMinutes: 0,
  lunch: null,
  lunchAt: null,
  lastOrderChange: null,
  currentBreak: null,
};
