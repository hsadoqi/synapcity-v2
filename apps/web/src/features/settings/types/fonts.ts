/**
 * Ids are persisted in the browser and in exported files, and the schema rejects
 * an id it does not know. Never remove or rename one; to retire a font, keep its
 * id and map it to a replacement.
 *
 * The fonts a user can pick for each typography role (ADR-0003). `default` means
 * "no override": the role keeps the font the app ships with. Every other id names
 * a Google Fonts family that is fetched only once somebody chooses it.
 *
 * Weights were checked against the Google Fonts CSS API. A family that serves a
 * weight range (400..700) is listed as a range; the others as a list of weights.
 */
export type GoogleFont = {
  label: string;
  family: string;
  generic: 'sans-serif' | 'serif' | 'monospace';
  weights: string;
};

export const googleFonts = {
  inter: {
    label: 'Inter',
    family: 'Inter',
    generic: 'sans-serif',
    weights: '400..700',
  },
  'playfair-display': {
    label: 'Playfair Display',
    family: 'Playfair Display',
    generic: 'serif',
    weights: '400..700',
  },
  merriweather: {
    label: 'Merriweather',
    family: 'Merriweather',
    generic: 'serif',
    weights: '400..700',
  },
  lora: {
    label: 'Lora',
    family: 'Lora',
    generic: 'serif',
    weights: '400..700',
  },
  literata: {
    label: 'Literata',
    family: 'Literata',
    generic: 'serif',
    weights: '400..700',
  },
  fraunces: {
    label: 'Fraunces',
    family: 'Fraunces',
    generic: 'serif',
    weights: '400..700',
  },
  'space-grotesk': {
    label: 'Space Grotesk',
    family: 'Space Grotesk',
    generic: 'sans-serif',
    weights: '400..700',
  },
  'dm-sans': {
    label: 'DM Sans',
    family: 'DM Sans',
    generic: 'sans-serif',
    weights: '400..700',
  },
  poppins: {
    label: 'Poppins',
    family: 'Poppins',
    generic: 'sans-serif',
    weights: '400;500;600;700',
  },
  montserrat: {
    label: 'Montserrat',
    family: 'Montserrat',
    generic: 'sans-serif',
    weights: '400..700',
  },
  roboto: {
    label: 'Roboto',
    family: 'Roboto',
    generic: 'sans-serif',
    weights: '400..700',
  },
  'open-sans': {
    label: 'Open Sans',
    family: 'Open Sans',
    generic: 'sans-serif',
    weights: '400..700',
  },
  'source-sans-3': {
    label: 'Source Sans 3',
    family: 'Source Sans 3',
    generic: 'sans-serif',
    weights: '400..700',
  },
  'nunito-sans': {
    label: 'Nunito Sans',
    family: 'Nunito Sans',
    generic: 'sans-serif',
    weights: '400..700',
  },
  'jetbrains-mono': {
    label: 'JetBrains Mono',
    family: 'JetBrains Mono',
    generic: 'monospace',
    weights: '400..700',
  },
  'fira-code': {
    label: 'Fira Code',
    family: 'Fira Code',
    generic: 'monospace',
    weights: '400..700',
  },
  'source-code-pro': {
    label: 'Source Code Pro',
    family: 'Source Code Pro',
    generic: 'monospace',
    weights: '400..700',
  },
  'ibm-plex-mono': {
    label: 'IBM Plex Mono',
    family: 'IBM Plex Mono',
    generic: 'monospace',
    weights: '400;500;600;700',
  },
  'roboto-mono': {
    label: 'Roboto Mono',
    family: 'Roboto Mono',
    generic: 'monospace',
    weights: '400..700',
  },
} as const satisfies Record<string, GoogleFont>;

export type GoogleFontId = keyof typeof googleFonts;
export type FontChoice = 'default' | GoogleFontId;
export type FontRole = 'heading' | 'body' | 'code';

export const headingFonts = [
  'default',
  'inter',
  'playfair-display',
  'merriweather',
  'lora',
  'fraunces',
  'space-grotesk',
  'dm-sans',
  'poppins',
  'montserrat',
] as const satisfies readonly FontChoice[];

export const bodyFonts = [
  'default',
  'roboto',
  'open-sans',
  'source-sans-3',
  'nunito-sans',
  'dm-sans',
  'merriweather',
  'lora',
  'literata',
] as const satisfies readonly FontChoice[];

export const codeFonts = [
  'default',
  'jetbrains-mono',
  'fira-code',
  'source-code-pro',
  'ibm-plex-mono',
  'roboto-mono',
] as const satisfies readonly FontChoice[];

/** What each role uses when no override is set. Keep in step with layout.tsx (ADR-0003). */
const defaultFontLabels: Record<FontRole, string> = {
  heading: 'Geist',
  body: 'Inter',
  code: 'Geist Mono',
};

export const fontPreferenceVariables: Record<FontRole, string> = {
  heading: '--font-preference-heading',
  body: '--font-preference-body',
  code: '--font-preference-code',
};

export function fontLabel(role: FontRole, id: FontChoice): string {
  return id === 'default'
    ? `Default (${defaultFontLabels[role]})`
    : googleFonts[id].label;
}

/** The Google Fonts stylesheet that defines the family. */
export function fontStylesheetUrl(id: GoogleFontId): string {
  const { family, weights } = googleFonts[id];
  const query = family.split(' ').join('+');
  return `https://fonts.googleapis.com/css2?family=${query}:wght@${weights}&display=swap`;
}

/** The value written to `--font-preference-*`: the family, then a generic fallback. */
export function fontStack(id: GoogleFontId): string {
  const { family, generic } = googleFonts[id];
  return `'${family}', ${generic}`;
}
