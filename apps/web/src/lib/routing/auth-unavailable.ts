/**
 * Where the proxy sends a protected request (as a rewrite) when the Auth
 * service cannot be reached. It is under `/auth/`, which is never a protected
 * path, so the page itself is never refused.
 */
export const AUTH_UNAVAILABLE_PATH = '/auth/unavailable';

/**
 * Set by the proxy, on the request it rewrites to the unavailable page, to say
 * the Auth service did not answer a moment ago. The rest of that render takes
 * it as the answer instead of waiting out the same deadline again. The proxy
 * removes any value a client sends, so only the proxy sets it.
 */
export const AUTH_UNAVAILABLE_HEADER = 'x-synapcity-auth-unavailable';
