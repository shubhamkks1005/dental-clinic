import type { Role } from "@clinic/shared";
import { api } from "../../api/client";

export type Me = { id: string; name: string; role: Role; permissions: string[] };
export type Branding = { clinicName: string | null; logo: string | null };

// Full page navigations (not fetch): Google and, later, Cloudflare Access must see them.
export const SIGN_IN_URL = "/api/staff/auth/start";
export const devSignInUrl = (role: "doctor" | "receptionist") =>
  `/api/staff/auth/dev-login?role=${role}`;

export const getMe = () => api<Me>("/api/staff/me");
export const getBranding = () => api<Branding>("/api/staff/auth/branding");
export const signOut = () => api<{ signedOut: true }>("/api/staff/auth/logout", { method: "POST" });
