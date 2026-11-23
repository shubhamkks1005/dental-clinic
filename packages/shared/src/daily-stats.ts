/** 6.2.2 metric names stored in daily_stats / monthly_stats. */
export const DAILY_STAT_METRICS = [
  "arrived_patients",
  "new_patients",
  "returning_patients",
  "appt_status",
  "billed_paise",
  "collected_paise",
  "procedure_count",
  "referral_count",
] as const;

export type DailyStatMetric = (typeof DAILY_STAT_METRICS)[number];

/** Empty dim for undimensioned metrics. */
export const STAT_DIM_NONE = "";
