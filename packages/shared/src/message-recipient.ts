import { patientFirstName } from "./messaging";

export type MessageContact = {
  fullName: string;
  mobile: string | null;
  guardianName: string | null;
  guardianMobile: string | null;
  emergencyName: string | null;
  emergencyMobile: string | null;
};

export type MessageRecipient = {
  /** Number to send to; null when the patient has no usable number. */
  mobile: string | null;
  /** First name the message opens with ("Dear Sunita"). */
  addressName: string;
  /** Patient first name when someone else gets the message ("...for Kiddo's appointment"). */
  onBehalfOf: string | null;
};

/**
 * Q1.5: who receives a patient's messages. Own mobile first; with none, the guardian (a child), then
 * the emergency contact. The one place for this rule; screens and the cron both use it.
 */
export function messageRecipient(c: MessageContact): MessageRecipient {
  const self = patientFirstName(c.fullName);
  if (c.mobile) return { mobile: c.mobile, addressName: self, onBehalfOf: null };
  if (c.guardianMobile) {
    return {
      mobile: c.guardianMobile,
      addressName: c.guardianName ? patientFirstName(c.guardianName) : "Sir or Madam",
      onBehalfOf: self,
    };
  }
  if (c.emergencyMobile) {
    return {
      mobile: c.emergencyMobile,
      addressName: c.emergencyName ? patientFirstName(c.emergencyName) : "Sir or Madam",
      onBehalfOf: self,
    };
  }
  return { mobile: null, addressName: self, onBehalfOf: null };
}

/** "Dear Sunita, a reminder of your appointment" becomes "...of Kiddo's appointment" for a guardian. */
export function speakForPatient(body: string, onBehalfOf: string | null): string {
  if (!onBehalfOf) return body;
  return body
    .replace(/\byour (next visit|appointment)\b/g, `${onBehalfOf}'s $1`)
    .replace(/\byour\b/g, `${onBehalfOf}'s`);
}
