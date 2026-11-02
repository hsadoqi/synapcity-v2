import {
  appearanceBootScript,
  fontBootScript,
  modeBootScript,
  themeShapeBootScript,
} from '@synapcity/frontend-preferences';

export const RootHead = () => {
  return (
    <head>
      {/* Applies the mode chosen on any host before first paint, ahead of next-themes. */}
      <script dangerouslySetInnerHTML={{ __html: modeBootScript }} />
      {/* Applies saved contrast and motion before first paint. */}
      <script dangerouslySetInnerHTML={{ __html: appearanceBootScript }} />
      {/* Applies saved font choices, and fetches only those, before first paint. */}
      <script dangerouslySetInnerHTML={{ __html: fontBootScript }} />
      {/* Applies the saved text size, corner radius and density before first paint. */}
      <script dangerouslySetInnerHTML={{ __html: themeShapeBootScript }} />
    </head>
  );
};
