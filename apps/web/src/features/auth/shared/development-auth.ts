/* eslint-disable turbo/no-undeclared-env-vars -- Next.js defines NODE_ENV for every runtime. */
export const developmentAuthBypassEnabled =
  process.env.NODE_ENV === 'development';
/* eslint-enable turbo/no-undeclared-env-vars */

export const developmentUser = {
  sub: 'developer',
  email: 'developer@localhost',
  user_metadata: {
    full_name: 'Developer',
  },
};
