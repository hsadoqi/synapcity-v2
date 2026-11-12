const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** The first letter or digit of `word`, as a whole grapheme, or `''` if it has none. */
function firstMark(word: string): string {
  for (const { segment } of graphemes.segment(word)) {
    if (LETTER_OR_DIGIT.test(segment)) return segment.toLocaleUpperCase();
  }
  return '';
}

/**
 * Up to two initials for a name: the first and last word's, or the first two
 * letters of a single word ("Research Lab" → "RL", "Ada" → "AD"). Takes one
 * string or its parts (`[firstName, lastName]`). Words with no letter or digit
 * are skipped; `''` when nothing is left.
 */
export function initialsOf(name: string | readonly string[]): string {
  const words = (typeof name === 'string' ? [name] : name)
    .flatMap((part) => part.split(/\s+/u))
    .filter((word) => firstMark(word) !== '');

  const first = words[0];
  if (first === undefined) return '';

  const last = words.at(-1);
  if (words.length > 1 && last !== undefined)
    return firstMark(first) + firstMark(last);

  const marks = Array.from(
    graphemes.segment(first),
    ({ segment }) => segment,
  ).filter((s) => LETTER_OR_DIGIT.test(s));
  return marks.slice(0, 2).join('').toLocaleUpperCase();
}
