import { Hono } from "hono";
import type { AppEnv } from "../types";

// Every webhook must verify its signature before reading the body.
export const hooks = new Hono<AppEnv>();
