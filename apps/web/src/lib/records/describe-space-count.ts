/** How many spaces a record is in, in a few words: "In 2 spaces", or "Not in a space". */
export function describeSpaceCount(spaces: number) {
  if (spaces === 0) return 'Not in a space';
  return `In ${spaces} ${spaces === 1 ? 'space' : 'spaces'}`;
}
