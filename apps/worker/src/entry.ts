import type { Hono } from "hono";
import { createApp, type AppOptions } from "./app";
import { handleScheduled } from "./cron/run";
import type { AppEnv, Bindings } from "./types";

type ScheduledEvent = { scheduledTime: number; cron: string };
type ExecutionCtx = { waitUntil: (p: Promise<unknown>) => void };

/** Hono app plus scheduled() for the one Worker cron (branched jobs). */
export type ClinicWorker = Hono<AppEnv> & {
  scheduled: (event: ScheduledEvent, env: Bindings, ctx: ExecutionCtx) => void | Promise<void>;
};

export function createWorker(options: AppOptions = {}): ClinicWorker {
  const app = createApp(options) as ClinicWorker;
  app.scheduled = (event, env, ctx) => {
    ctx.waitUntil(handleScheduled(event, env));
  };
  return app;
}
