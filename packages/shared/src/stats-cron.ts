import { istHour, istMinutes } from "./time";

/** 6.2.3: nightly recompute runs on the first 5-minute cron tick after IST midnight. */
export function shouldRunNightlyStats(now: Date): boolean {
  return istHour(now) === 0 && istMinutes(now) < 5;
}
