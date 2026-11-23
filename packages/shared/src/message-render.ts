import {
  MESSAGE_TEMPLATE_VARS,
  type MessageTemplateKey,
  type MessageTemplates,
  type MessageTemplateVar,
} from "./messaging";

export type TemplateParams = Partial<Record<MessageTemplateVar, string>>;

const VAR_RE = /\{([a-z_]+)\}/g;

export function templateVariablesUsed(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(VAR_RE)) {
    if (m[1]) found.add(m[1]);
  }
  return [...found];
}

export function assertAllowedTemplateVars(body: string): void {
  for (const v of templateVariablesUsed(body)) {
    if (!(MESSAGE_TEMPLATE_VARS as readonly string[]).includes(v)) {
      throw new Error(`Unknown template variable {${v}}.`);
    }
  }
}

/** Render template; missing required vars throw (never silent empty). OTP body must not be persisted. */
export function renderMessageTemplate(
  templates: MessageTemplates,
  key: MessageTemplateKey,
  params: TemplateParams,
): string {
  const body = templates.templates[key];
  assertAllowedTemplateVars(body);
  return body.replace(VAR_RE, (_, name: string) => {
    const v = params[name as MessageTemplateVar];
    if (v === undefined || v === "") {
      throw new Error(`Missing template value for {${name}}.`);
    }
    return v;
  });
}

/** GSM-7-ish: ASCII printable without high Unicode. Unicode → 70 / part. */
export function isGsm7Text(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c > 0x7f) return false;
  }
  return true;
}

export function smsSegmentCount(text: string): number {
  if (text.length === 0) return 0;
  if (isGsm7Text(text)) {
    if (text.length <= 160) return 1;
    return Math.ceil(text.length / 153);
  }
  if (text.length <= 70) return 1;
  return Math.ceil(text.length / 67);
}

const LINT_CLINICAL =
  /\b(rct|extraction|filling|implant|root\s*canal|scaling|crown|bridge|orthodont|x-?ray|diagnosis|prescription|medicine|tablet|antibiotic)\b/i;
const LINT_MONEY =
  /[₹]|(\brs\.?\b)|(\binr\b)|(\bpaise\b)|(\bbalance\b)|(\bdue\s*amount\b)|(\brupees?\b)/i;
const LINT_OFFER = /\b(discount|offer|free|% off|best|cheapest|promo)\b/i;
const LINT_URL = /https?:\/\/|www\./i;

export type MessageLintWarning = { code: string; message: string };

/** Warnings only — never blocks send (7.2.3). */
export function lintMessageBody(text: string): MessageLintWarning[] {
  const out: MessageLintWarning[] = [];
  if (LINT_CLINICAL.test(text)) {
    out.push({ code: "clinical_word", message: "Avoid treatment or medicine words in messages." });
  }
  if (LINT_MONEY.test(text) && !/\bpayment is pending\b/i.test(text)) {
    out.push({
      code: "money_word",
      message: "Avoid amounts or money words; plain “payment pending” is OK for dues.",
    });
  }
  if (LINT_OFFER.test(text)) {
    out.push({ code: "offer_word", message: "Avoid offers or discounts in messages." });
  }
  if (LINT_URL.test(text)) {
    out.push({ code: "url", message: "Avoid links in SMS or WhatsApp templates." });
  }
  return out;
}
