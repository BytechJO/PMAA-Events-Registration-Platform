import { errorBody, newCorrelationId, NotFoundError } from "@pmaa/core";
import { calendarEventFor, canAddToCalendar, findConfirmation, getConfirmationSource, publicBaseUrl, type ConfirmationSource } from "./confirmation";
import { sessionDateKey } from "./format";
import { buildIcs } from "./ics";

/**
 * GET /api/public/registrations/{secureToken}/calendar.ics (proposal P1, pending question B6).
 * A confirmed registration gets its calendar file; anything else, including an unknown, waitlisted
 * or cancelled registration, gets the same safe 404, so the answer never says which tokens exist.
 */
export async function calendarIcsResponse(
  req: Request,
  token: string,
  source: ConfirmationSource = getConfirmationSource(),
  now: Date = new Date(),
): Promise<Response> {
  const correlationId = req.headers.get("x-correlation-id") ?? newCorrelationId();
  try {
    const confirmation = await findConfirmation(token, undefined, source);
    if (!confirmation || !canAddToCalendar(confirmation)) throw new NotFoundError();
    const body = buildIcs(calendarEventFor(confirmation, publicBaseUrl()), now);
    const day = sessionDateKey(confirmation.session.startsAt, confirmation.session.timeZone);
    return new Response(body, {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `attachment; filename="webinar-${day}.ics"`,
        "cache-control": "no-store",
        "x-robots-tag": "noindex",
        "x-correlation-id": correlationId,
      },
    });
  } catch (error) {
    const { status, body } = errorBody(error, correlationId);
    return Response.json(body, { status, headers: { "cache-control": "no-store", "x-correlation-id": correlationId } });
  }
}
