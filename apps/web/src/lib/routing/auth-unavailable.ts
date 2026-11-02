/**
 * Where the proxy sends a protected request (as a rewrite) when the Auth
 * service cannot be reached. It is under `/auth/`, which is never a protected
 * path, so the page itself is never refused.
 */
export const AUTH_UNAVAILABLE_PATH = '/auth/unavailable';
