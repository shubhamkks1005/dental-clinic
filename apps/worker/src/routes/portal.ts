import { Hono } from "hono";
import type { AppEnv } from "../types";

// Read-only: GET routes only, returning only the logged-in patient's own rows (Phase 8).
export const portal = new Hono<AppEnv>();
