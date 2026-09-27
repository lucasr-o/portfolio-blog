export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ service: "portfolio-blog-cms", status: "ok" }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
