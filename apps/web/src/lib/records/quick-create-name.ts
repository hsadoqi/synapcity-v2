import { boundedNameSchema } from '@synapcity/domain-records';

/** What Quick Create says when the name is blank. */
export const NAME_NEEDED = 'Give it a name.';

/**
 * The name Quick Create accepts: the record contract's name rule with this
 * form's wording for a blank one. The dialog checks it before sending and the
 * action checks it again, since the browser's check is only a courtesy.
 */
export const quickCreateNameSchema = boundedNameSchema(NAME_NEEDED);
