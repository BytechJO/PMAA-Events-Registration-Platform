import { calendarIcsResponse } from "@/server/public-registrations/calendar-handler";

/** Add to calendar: the .ics file for one confirmed registration, by its secure token (T023). */
export async function GET(req: Request, ctx: RouteContext<"/api/public/registrations/[token]/calendar.ics">) {
  const { token } = await ctx.params;
  return calendarIcsResponse(req, token);
}
