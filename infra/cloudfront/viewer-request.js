// CloudFront Functions JavaScript 2.0; paste this file into viewer-request.
// Origin Path /site is configured on the distribution, not added here.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var bad = { statusCode: 400, statusDescription: "Bad Request",
    headers: { "cache-control": { value: "no-store" },
      "content-type": { value: "text/plain; charset=utf-8" } }, body: "Invalid path" };

  if (typeof uri !== "string" || uri.length === 0 || uri.length > 2048 ||
      uri.charAt(0) !== "/" || uri.indexOf("//") !== -1 ||
      /[%\\?#\x00-\x1f\x7f]/.test(uri)) return bad;

  var segments = uri.split("/");
  for (var i = 1; i < segments.length; i++) {
    var segment = segments[i];
    if (segment === "." || segment === ".." ||
        (segment !== "" && !/^[A-Za-z0-9._~!$&'()+,;=:@-]+$/.test(segment))) return bad;
  }

  // These never belong to the public prefix, even if accidentally uploaded.
  if (/^\/(?:state|releases|keystatic|api|preview|content|apps)(?:\/|$)/.test(uri)) return bad;

  var last = segments[segments.length - 1];
  if (uri === "/") request.uri = "/index.html";
  else if (uri.charAt(uri.length - 1) === "/") request.uri = uri + "index.html";
  else if (last.indexOf(".") === -1) request.uri = uri + "/index.html";
  // Filename requests, including Next RSC .txt payloads, remain unchanged.
  // querystring, headers and cookies are intentionally left untouched.
  return request;
}
