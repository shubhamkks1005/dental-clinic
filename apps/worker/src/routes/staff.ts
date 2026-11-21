import { Hono } from "hono";
import type { AppEnv } from "../types";

// Every route added here must sit behind the Cloudflare Access JWT check (task 1.3).
export const staff = new Hono<AppEnv>();
