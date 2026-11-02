/** A clock time such as "9:30 AM", in the browser's own language and hour cycle. */
export const eventTimeFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});
