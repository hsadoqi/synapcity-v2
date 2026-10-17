export * from './current-user-avatar';
export * from './login';
export * from './register';
export * from './oauth-buttons';
export * from './resend';
export * from './password';
export * from './sign-out';
export * from './email';
export * from './connected-accounts';

// `auth-status` is deliberately not exported here. It is a Server Component that
// reads the session, so a client component importing this barrel would pull the
// server's cookie and Supabase code into the browser bundle. Import it from
// './auth-status' directly, from server code only.
export * from './delete-account';
