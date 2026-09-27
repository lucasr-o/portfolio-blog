import path from "node:path";
import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../keystatic.config";

// Instantiate at request time: production secrets must never be needed at build time.
function handlers() {
  return makeRouteHandler({
    config,
    localBaseDirectory: process.env.NODE_ENV === "development"
      ? path.resolve(process.env.CMS_LOCAL_CONTENT_ROOT || path.join(process.cwd(), "../.."))
      : undefined,
  });
}

export function GET(request) { return handlers().GET(request); }
export function POST(request) { return handlers().POST(request); }
