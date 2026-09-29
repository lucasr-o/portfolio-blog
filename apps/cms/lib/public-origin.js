const CMS_HOSTNAME = /^[a-f0-9]{12,64}\.lucas-reis\.com$/;

export function withPublicCmsOrigin(request, hostname = process.env.CMS_HOSTNAME) {
  // The standalone Next server binds to 0.0.0.0; Keystatic derives its OAuth
  // callback from request.url rather than the proxy's forwarding headers.
  if (!hostname) return request;
  if (!CMS_HOSTNAME.test(hostname)) throw new Error("Invalid public CMS hostname");

  const incoming = new URL(request.url);
  const publicUrl = new URL(`${incoming.pathname}${incoming.search}`, `https://${hostname}`);
  return new Request(publicUrl, {
    method: request.method,
    headers: request.headers,
    signal: request.signal,
    ...(request.body ? { body: request.body, duplex: "half" } : {}),
  });
}
