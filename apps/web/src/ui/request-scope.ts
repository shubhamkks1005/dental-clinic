/**
 * Requests that one screen shares for as long as it is open (S3.3.1).
 * - `shared`: one request for the whole life of the screen (settings and lists only).
 * - `prefetch` + `takeOr`: a one-shot hand-off for patient and money data. The first reader gets
 *   the request that is already in flight; any later read asks the server again, so it is never stale.
 * A failed request is forgotten, so a retry really retries. The scope is dropped with the screen.
 */
export type RequestScope = {
  shared<T>(key: string, load: () => Promise<T>): Promise<T>;
  prefetch<T>(key: string, load: () => Promise<T>): void;
  takeOr<T>(key: string, load: () => Promise<T>): Promise<T>;
};

function start<T>(load: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve) => resolve(load()));
}

function forgetOnFailure(map: Map<string, Promise<unknown>>, key: string, p: Promise<unknown>) {
  p.catch(() => {
    if (map.get(key) === p) map.delete(key);
  });
}

export function createRequestScope(): RequestScope {
  const shared = new Map<string, Promise<unknown>>();
  const handoff = new Map<string, Promise<unknown>>();
  return {
    shared<T>(key: string, load: () => Promise<T>) {
      const known = shared.get(key);
      if (known) return known as Promise<T>;
      const p = start(load);
      shared.set(key, p);
      forgetOnFailure(shared, key, p);
      return p;
    },
    prefetch<T>(key: string, load: () => Promise<T>) {
      if (handoff.has(key)) return;
      const p = start(load);
      handoff.set(key, p);
      forgetOnFailure(handoff, key, p);
    },
    takeOr<T>(key: string, load: () => Promise<T>) {
      const p = handoff.get(key);
      if (!p) return start(load);
      handoff.delete(key);
      return p as Promise<T>;
    },
  };
}

/** Used outside a scope (other screens): every call goes to the server as before. */
export const noRequestScope: RequestScope = {
  shared: (_key, load) => start(load),
  prefetch: () => {},
  takeOr: (_key, load) => start(load),
};

/** One naming rule for keys, so the code that prefetches and the code that reads agree. */
export const scopeKey = {
  list: (listKey: string) => `list:${listKey}`,
  chartView: () => "chart-view",
  chart: (patientId: string, asOfVisitId?: string, highlightVisitId?: string) =>
    `chart:${patientId}:${asOfVisitId ?? ""}:${highlightVisitId ?? ""}`,
  consents: (patientId: string) => `consents:${patientId}`,
  bills: (patientId: string) => `bills:${patientId}`,
  patientAppointments: (patientId: string) => `patient-appointments:${patientId}`,
  medicalHistory: (patientId: string) => `medical-history:${patientId}`,
  dayAppointments: (dateLocal: string) => `day-appointments:${dateLocal}`,
  visitPrescriptions: (visitId: string) => `visit-prescriptions:${visitId}`,
};
