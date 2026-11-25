import { errorBody, newCorrelationId, requireRole, type AdminSession, type Role } from "@pmaa/core";
import { getAdminSession } from "./session";

type Handler<C> = (req: Request, ctx: C & { session: AdminSession; correlationId: string }) => Promise<Response>;
type SessionLoader = (req: Request) => Promise<AdminSession | null>;

/**
 * The route handler pattern for every admin API (spec §13): role check first, on the server,
 * then the work; any error becomes a safe JSON body with a correlation id (no stack, no personal data).
 *
 *   export const POST = adminRoute(["event_admin"], async (req, { session, correlationId }) => { ... });
 *
 * Pass `eventId` from the route params when the role is event-scoped.
 */
export function adminRoute<C extends { params?: Promise<Record<string, string>> }>(
  allowed: readonly Role[],
  handler: Handler<C>,
  loadSession: SessionLoader = getAdminSession,
) {
  return async (req: Request, ctx: C): Promise<Response> => {
    const correlationId = req.headers.get("x-correlation-id") ?? newCorrelationId();
    try {
      const params = (await ctx.params) ?? {};
      const session = requireRole(await loadSession(req), allowed, params.eventId);
      return await handler(req, { ...ctx, session, correlationId });
    } catch (error) {
      const { status, body } = errorBody(error, correlationId);
      return Response.json(body, { status, headers: { "x-correlation-id": correlationId } });
    }
  };
}
