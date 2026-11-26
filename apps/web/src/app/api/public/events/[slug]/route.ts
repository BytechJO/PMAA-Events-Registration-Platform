import { getPublicEvent } from "@/server/public-events";

export async function GET(_request: Request, { params }: RouteContext<"/api/public/events/[slug]">) {
  const { slug } = await params;
  const event = getPublicEvent(slug);
  const headers = { "Cache-Control": "no-store" };

  return event
    ? Response.json(event, { headers })
    : Response.json({ error: "not_found" }, { status: 404, headers });
}
