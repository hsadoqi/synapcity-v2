import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'synapcity';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/*
 * Social card built from the static logo in public/brand-assets. The image
 * renderer cannot read CSS variables or follow the user's theme, so this card
 * uses fixed light colours; it is the one place colour values live outside
 * the tokens.
 */
export default async function OpenGraphImage() {
  const logo = await readFile(
    join(process.cwd(), 'public/brand-assets/logo-monochrome.svg'),
  );
  const src = `data:image/svg+xml;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the DOM */}
      <img src={src} width={800} height={150} alt="" />
    </div>,
    size,
  );
}
