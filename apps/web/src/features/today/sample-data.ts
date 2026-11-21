import type { StatusTone } from "../../ui/StatusBadge";

// FAKE sample data for the restyle (1.4.11). Made-up people; replaced by real API data later.
export type TodayRow = {
  time: string;
  name: string;
  visit: string;
  tone: StatusTone;
  status: string;
  action: string;
};

export const sampleStats = {
  appointments: 18,
  openSlots: 2,
  arrived: 7,
  waiting: 3,
  longestWaitMin: 12,
  collectionPaise: 1420000,
  bills: 6,
};

export const sampleNextPatient = {
  name: "Rohan Mehta",
  patientNo: "P-000412",
  visit: "Braces fitting, 45 min",
  mobile: "98xxx xx210",
};

export const sampleRows: TodayRow[] = [
  {
    time: "10:00",
    name: "Kavya Nair",
    visit: "Braces adjustment · 20 min",
    tone: "done",
    status: "Done",
    action: "Bill",
  },
  {
    time: "10:30",
    name: "Arjun Rao",
    visit: "Consultation · 20 min",
    tone: "in-room",
    status: "In room",
    action: "Finish",
  },
  {
    time: "11:00",
    name: "Rohan Mehta",
    visit: "Braces fitting · 45 min",
    tone: "waiting",
    status: "Waiting 12 min",
    action: "Send in",
  },
  {
    time: "11:45",
    name: "Isha Patel",
    visit: "Follow-up · 15 min",
    tone: "waiting",
    status: "Arrived",
    action: "Send in",
  },
  {
    time: "12:00",
    name: "Farhan Khan",
    visit: "Retainer check · 15 min",
    tone: "emergency",
    status: "Pain, emergency",
    action: "Move up",
  },
  {
    time: "12:30",
    name: "Meera Joshi",
    visit: "Ortho adjustment · 20 min",
    tone: "upcoming",
    status: "Expected",
    action: "Check in",
  },
];

export type CallItem = { initials: string; name: string; note?: string; balancePaise?: number };

export const sampleCallList: CallItem[] = [
  { initials: "TY", name: "Tarun Yadav", note: "Missed today, needs a new slot" },
  { initials: "SD", name: "Sana Das", balancePaise: 180000 },
];
