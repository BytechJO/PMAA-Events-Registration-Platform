import type { RegistrationConfirmation } from "./confirmation";

/*
 * Sample registrations for the "You're registered" page until the registration API lands (T022).
 * Served only when PUBLIC_SAMPLE_DATA is on, which works on localhost only. Made-up teacher, made-up
 * address; the event matches the doc 08 mockups (Amman is UTC+3 all year).
 */

const event = { slug: "creating-engaging-digital-content", title: "Creating Engaging Digital Content on the GROW LMS" };
const session = {
  startsAt: new Date("2027-03-14T12:00:00Z"), // 3:00 PM in Amman
  endsAt: new Date("2027-03-14T13:00:00Z"),
  timeZone: "Asia/Amman",
};

const base = {
  email: "lina.haddad@school.example",
  event,
  session,
  reminderOffsetsMinutes: [24 * 60, 60],
  recordingPromised: true,
  certificateOffered: true,
};

export const sampleConfirmations: Record<string, RegistrationConfirmation> = {
  "sample-confirmed": { ...base, registrationId: "reg_sample_confirmed", status: "confirmed" },
  "sample-waitlisted": { ...base, registrationId: "reg_sample_waitlisted", status: "waitlisted" },
  "sample-cancelled": { ...base, registrationId: "reg_sample_cancelled", status: "cancelled" },
};
