import { INK_ON_LIGHT, logoSvg } from '@synapcity/frontend-brand/svg';
import { site } from './site';

export const openGraphSize = { width: 1200, height: 630 } as const;

const LOGO_WIDTH = 800;
const LOGO_HEIGHT = 150;

/*
 * The monochrome logo as an SVG string from the brand package: the same
 * geometry the React components draw, as a server-safe string. It is a string,
 * not `SynapcityLogo`, because the image renderer cannot run components that
 * use hooks and Next rejects `react-dom/server` in a route.
 */
const LOGO_SVG = logoSvg(INK_ON_LIGHT);

const LOGO_SRC = `data:image/svg+xml;base64,${btoa(LOGO_SVG)}`;

/*
 * Social card shared by the apps. The image renderer cannot read CSS
 * variables or follow the user's theme, so the card uses fixed light colours;
 * it is the one place colour values live outside the tokens.
 *
 * Each app passes the result to `ImageResponse` from `next/og` itself, since
 * frontend packages do not import Next runtime APIs (workspace-conventions).
 */
// TODO: Write comprehensive tests for this component, including the image renderer. The tests should verify that the image renders correctly with the logo and that the logo is centered in the card. Additionally, tests should check that the card's dimensions match the expected Open Graph size and that the background color is set to #fafafa.
// TODO: Consider extending the OpenGraphCard component to accept props for customizing the logo, background color, and other visual elements. This would allow for more flexibility in generating social cards for different contexts or branding requirements.
// TODO: Explore the possibility of adding accessibility features to the OpenGraphCard component, such as providing alternative text for the logo and ensuring that the card is navigable via keyboard for users with disabilities.
// TODO: Investigate performance optimizations for the OpenGraphCard component, such as lazy loading the logo image or using a more efficient image format to reduce load times and improve user experience on social media platforms.
// TODO: Research and implement responsive design techniques for the OpenGraphCard component to ensure that it displays correctly on various devices and screen sizes, including mobile phones, tablets, and desktops.
// TODO: Consider implementing type for the OpenGraphCard component's props to enhance code readability and maintainability, making it easier for developers to understand the expected input types and structure when using the component in different parts of the application.
export function OpenGraphCard() {
  return (
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
      {/* An <img> on purpose: ImageResponse renders this tree, not the DOM. */}
      <img
        src={LOGO_SRC}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        alt={site.name}
      />
    </div>
  );
}
