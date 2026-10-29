import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { INK_ON_LIGHT, logoSvg } from '@synapcity/frontend-brand/svg';

import { OpenGraphCard, openGraphSize } from './open-graph';
import { site } from './site';

type CardProps = { style: Record<string, string>; children: ReactElement };
type ImgProps = { src: string; width: number; height: number; alt: string };

const card = OpenGraphCard() as ReactElement<CardProps>;
const img = card.props.children as ReactElement<ImgProps>;

describe('OpenGraphCard', () => {
  it('keeps the social card size', () => {
    expect(openGraphSize).toEqual({ width: 1200, height: 630 });
  });

  it('centres the logo on the light card background', () => {
    expect(card.props.style).toMatchObject({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // The card's fixed light colour; the image renderer cannot read tokens.
      background: '#fafafa',
    });
  });

  it('places the logo at its fixed size with the site name as alt text', () => {
    expect(img.props).toMatchObject({
      width: 800,
      height: 150,
      alt: site.name,
    });
  });

  it('embeds the brand package monochrome logo, not its own copy', () => {
    const encoded = img.props.src.replace('data:image/svg+xml;base64,', '');

    expect(atob(encoded)).toBe(logoSvg(INK_ON_LIGHT));
  });
});
