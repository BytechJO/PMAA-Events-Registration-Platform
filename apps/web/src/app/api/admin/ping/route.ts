import { adminRoute } from "@/server/route";

/** Example admin route: copy this shape for every admin API. Answers 401 until sign-in (T011) lands. */
export const GET = adminRoute(["super_admin", "event_admin", "attendance_manager", "read_only"], async (_req, { session, correlationId }) => {
  return Response.json({ ok: true, userId: session.userId, correlationId });
});
