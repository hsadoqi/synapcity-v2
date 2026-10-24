export * from './form-state';

// Temporary: `register-form` and its test still import this from here. They are
// being edited by the React Hook Form pull request, so M7.1 does not touch them.
// Re-point those two files at `@synapcity/domain-identity` and delete this
// re-export once that pull request has merged (M7.1 plan, call C4).
export { MAX_NAME_LENGTH } from '@synapcity/domain-identity';
