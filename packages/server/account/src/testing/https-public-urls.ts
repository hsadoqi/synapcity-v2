import type { SupabaseServerClient } from '@synapcity/server-supabase';

/*
 * For database tests only. The local stack serves Storage over plain http, and
 * `profiles.avatar_url` accepts only https URLs, so a real avatar URL from the
 * stack can never be recorded. This wraps a client so `getPublicUrl` returns
 * the same URL with https; every request (PostgREST filters, Storage, the
 * column check) still goes to the stack unchanged.
 */
export function httpsPublicUrls(
  client: SupabaseServerClient,
): SupabaseServerClient {
  const storage = new Proxy(client.storage, {
    get(target, property, receiver) {
      if (property !== 'from') return Reflect.get(target, property, receiver);
      return (bucketId: string) => {
        const bucket = target.from(bucketId);
        return new Proxy(bucket, {
          get(inner, name, innerReceiver) {
            if (name !== 'getPublicUrl') {
              const value = Reflect.get(inner, name, innerReceiver);
              return typeof value === 'function' ? value.bind(inner) : value;
            }
            return (path: string) => {
              const { data } = inner.getPublicUrl(path);
              return {
                data: { publicUrl: data.publicUrl.replace(/^http:/, 'https:') },
              };
            };
          },
        });
      };
    },
  });
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'storage') return storage;
      return Reflect.get(target, property, receiver);
    },
  });
}
