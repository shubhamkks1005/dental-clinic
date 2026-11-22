// The "Error ID" staff read out to the developer (1.4.7): the first 8 letters/digits of the
// request id (Cloudflare's cf-ray or a random UUID). Worker logs carry the full id, so a search
// for these 8 characters finds the request.
export const REQUEST_ID_HEADER = "x-request-id";

export function shortRequestId(requestId: string): string {
  return requestId
    .replace(/[^0-9a-z]/gi, "")
    .slice(0, 8)
    .toUpperCase();
}
