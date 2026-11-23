import { api } from "../../api/client";

export type MessageRow = {
  id: string;
  patientId: string;
  appointmentId: string | null;
  kind: string;
  channel: string;
  templateKey: string;
  body: string;
  status: string;
  sendAfter: string;
  expireAt: string;
  skipReason: string | null;
  createdAt: string;
  attempts: number;
  lastErrorCode: string | null;
};

export type MessagesBoard = {
  outgoing: MessageRow[];
  sentToday: MessageRow[];
  attention: MessageRow[];
  whatsapp: MessageRow[];
};

export function fetchMessagesBoard() {
  return api<MessagesBoard>("/api/staff/messages/board");
}

export function fetchMessagingStatus() {
  return api<{
    mode: string;
    enabled: boolean;
    whatsappEnabled: boolean;
    smsEnabled: boolean;
    draftBanner: string;
  }>("/api/staff/messages/status");
}

export function openWhatsApp(id: string) {
  return api<{ message: MessageRow; waUrl: string }>(`/api/staff/messages/${id}/open-whatsapp`, {
    method: "POST",
    body: {},
  });
}

export function markDoneManual(id: string) {
  return api<{ message: MessageRow }>(`/api/staff/messages/${id}/done-manual`, {
    method: "POST",
    body: {},
  });
}

export function cancelMessage(id: string) {
  return api<{ message: MessageRow }>(`/api/staff/messages/${id}/cancel`, {
    method: "POST",
    body: {},
  });
}

export function dumpToWhatsApp() {
  return api<{ converted: number }>("/api/staff/messages/dump-to-whatsapp", {
    method: "POST",
    body: {},
  });
}

export function fetchPatientMessages(patientId: string) {
  return api<{ messages: MessageRow[] }>(`/api/staff/patients/${patientId}/messages`);
}

export function sendPatientTemplate(patientId: string, templateKey: string) {
  return api<{ message: MessageRow; waUrl: string | null }>(
    `/api/staff/patients/${patientId}/messages`,
    { method: "POST", body: { templateKey } },
  );
}

export function sendAppointmentNow(
  appointmentId: string,
  kind: "confirm" | "remind" | "cancel" | "reschedule",
) {
  return api<{ message: MessageRow; waUrl: string | null }>(
    `/api/staff/appointments/${appointmentId}/messages/send-now`,
    { method: "POST", body: { kind } },
  );
}
