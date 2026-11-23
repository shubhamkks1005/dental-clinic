import type { Holiday, Timings } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useMe } from "../auth";
import { SettingHistoryPanel } from "../settings/SettingHistoryPanel";
import { getTimingSettings, type Versioned } from "./api";
import { HolidaysEditor } from "./HolidaysEditor";
import { WeekForm } from "./WeekForm";
import "./timings.css";

type Loaded = { timings: Versioned<Timings>; holidays: Versioned<Holiday[]> };

// Settings > Timings (1.5.3, S12 frame). Everyone with settings.read sees it; only roles with
// settings.write (the doctor) can change it. 6.5.2: history + one-click restore.
export function TimingsSettings() {
  const canEdit = useMe().permissions.includes("settings.write");
  const [data, setData] = useState<Loaded | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(() => {
    getTimingSettings()
      .then((loaded) => {
        setData(loaded);
        setProblem(null);
      })
      .catch((err: unknown) => setProblem(problemText(err)));
  }, []);
  useEffect(load, [load]);

  if (problem || !data) {
    return (
      <section className="card settings-panel">
        {problem ? (
          <p className="notice notice-error" role="alert">
            {problem}
          </p>
        ) : (
          <p className="muted">Loading timings...</p>
        )}
      </section>
    );
  }
  return (
    <div className="settings-stack">
      {/* A new version remounts the editors with the saved values. */}
      <WeekForm
        key={`w${data.timings.version}`}
        initial={data.timings}
        canEdit={canEdit}
        onSaved={load}
      />
      <HolidaysEditor
        key={`h${data.holidays.version}`}
        initial={data.holidays}
        canEdit={canEdit}
        onSaved={load}
      />
      <SettingHistoryPanel settingKey="clinic.timings" title="Timings history" onRestored={load} />
      <SettingHistoryPanel
        settingKey="clinic.holidays"
        title="Holidays history"
        onRestored={load}
      />
    </div>
  );
}
