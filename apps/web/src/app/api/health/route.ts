/** Liveness check for monitoring and deploys (spec §19.2). Database and queue checks come with T073. */
export async function GET() {
  return Response.json({ status: "ok", service: "web" });
}
