import { StorageUsagePanel } from "../files";

/** 6.5.1: storage use + backup status note (nightly Action is outside the Worker). */
export function SystemStatusSettings() {
  return (
    <section className="card settings-panel">
      <h2>Backup and storage</h2>
      <p className="muted">
        Nightly database backup runs in GitHub Actions. Success is checked on Healthchecks (owner
        account). This screen shows file storage only.
      </p>
      <StorageUsagePanel />
    </section>
  );
}
