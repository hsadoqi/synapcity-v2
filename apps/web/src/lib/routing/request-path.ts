/**
 * The proxy copies the request's path and query into this request header, so
 * a layout, which cannot read the request path, can still send a signed-out
 * visitor to sign in with a way back. The proxy sets it on every request it
 * handles and replaces any value the client sent; it is still untrusted input
 * and goes through `safeNextPath` where it is used.
 */
export const REQUEST_PATH_HEADER = 'x-synapcity-request-path';
