import { site } from './site';

export const openGraphSize = { width: 1200, height: 630 } as const;

const LOGO_WIDTH = 800;
const LOGO_HEIGHT = 150;

/*
 * Monochrome logo as an SVG string: an export of `SynapcityLogo`
 * (packages/frontend/ui/src/components/logo-mark/logo-mark.tsx, the source of truth) and
 * identical to apps/web/public/brand-assets/logo-monochrome.svg. When the
 * geometry changes, re-export both.
 *
 * It is a string, not the component, because the image renderer cannot run
 * components that use hooks and Next rejects `react-dom/server` in a route.
 */
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5868 1100" role="img" aria-label="synapcity"><g transform="scale(34.375)" fill="none"><g stroke="#000" stroke-width="2.25"><rect x="3" y="3" width="18" height="18" rx="3.5"/><rect x="11" y="11" width="18" height="18" rx="3.5"/></g><rect fill="#000" x="13.75" y="13.75" width="4.5" height="4.5" rx="0.75"/></g><path fill="#000" d="M1520 647 1630 642Q1637 688 1668.5 713Q1700 738 1759 738Q1810 738 1838.5 721.5Q1867 705 1867 671Q1867 651 1857 638Q1847 625 1820 615.5Q1793 606 1740 597Q1662 583 1616.5 562.5Q1571 542 1552 511.5Q1533 481 1533 436Q1533 362 1589 316.5Q1645 271 1746 271Q1844 271 1900.5 319.5Q1957 368 1969 446L1860 452Q1852 409 1822.5 384.5Q1793 360 1745 360Q1695 360 1669 379.5Q1643 399 1643 432Q1643 456 1654.5 471Q1666 486 1691.5 495.5Q1717 505 1762 512Q1845 526 1891 546Q1937 566 1957 595.5Q1977 625 1977 670Q1977 744 1916.5 785.5Q1856 827 1759 827Q1686 827 1633.5 804.5Q1581 782 1552.5 741.5Q1524 701 1520 647ZM2081 878H2145Q2171 878 2184.5 870Q2198 862 2205 843L2222 799H2189L1997 283H2109L2255 701L2395 283H2507L2295 877Q2279 923 2247.5 944Q2216 965 2161 965H2081ZM2584 283H2681L2685 425L2672 418Q2685 344 2731.5 307.5Q2778 271 2845 271Q2931 271 2978 326.5Q3025 382 3025 473V815H2919V505Q2919 433 2895 396.5Q2871 360 2816 360Q2758 360 2724 398Q2690 436 2690 505V815H2584ZM3113 682Q3113 614 3154 575Q3195 536 3283 519L3466 484Q3466 422 3437.5 391.5Q3409 361 3352 361Q3302 361 3272 383.5Q3242 406 3232 450L3122 443Q3137 362 3197.5 316.5Q3258 271 3352 271Q3459 271 3515.5 328Q3572 385 3572 490V697Q3572 716 3579 723.5Q3586 731 3601 731H3620V815Q3613 816 3602.5 817Q3592 818 3581 818Q3526 818 3499.5 791.5Q3473 765 3473 702L3484 707Q3473 759 3420 793Q3367 827 3295 827Q3212 827 3162.5 788.5Q3113 750 3113 682ZM3466 598V564L3311 594Q3264 603 3243.5 622Q3223 641 3223 672Q3223 706 3246.5 724.5Q3270 743 3313 743Q3360 743 3394.5 724.5Q3429 706 3447.5 673Q3466 640 3466 598ZM3704 283H3804L3807 397L3795 391Q3814 333 3860 302Q3906 271 3967 271Q4042 271 4093.5 308Q4145 345 4170 408.5Q4195 472 4195 549Q4195 626 4170 689.5Q4145 753 4093.5 790Q4042 827 3967 827Q3927 827 3892 813Q3857 799 3832.5 773Q3808 747 3798 713L3810 701V965H3704ZM4085 549Q4085 461 4048.5 412Q4012 363 3948 363Q3906 363 3874.5 384Q3843 405 3826.5 446.5Q3810 488 3810 549Q3810 610 3826.5 651.5Q3843 693 3874 714Q3905 735 3948 735Q4012 735 4048.5 686Q4085 637 4085 549ZM4258 549Q4258 466 4289.5 402.5Q4321 339 4378 305Q4435 271 4511 271Q4575 271 4625.5 293.5Q4676 316 4708 359.5Q4740 403 4748 464L4638 470Q4630 419 4596 391Q4562 363 4511 363Q4444 363 4406 412Q4368 461 4368 549Q4368 637 4406 686Q4444 735 4511 735Q4562 735 4596 706Q4630 677 4638 620L4748 626Q4740 687 4708.5 732Q4677 777 4626 802Q4575 827 4511 827Q4435 827 4378 793Q4321 759 4289.5 695.5Q4258 632 4258 549ZM4819 283H4925V815H4819ZM4817 100H4928V206H4817ZM5075 671V158H5181V663Q5181 699 5196.5 713.5Q5212 728 5246 728H5322V815H5223Q5147 815 5111 780Q5075 745 5075 671ZM4994 283H5322V370H4994ZM5442 878H5506Q5532 878 5545.5 870Q5559 862 5566 843L5583 799H5550L5358 283H5470L5616 701L5756 283H5868L5656 877Q5640 923 5608.5 944Q5577 965 5522 965H5442Z"/></svg>';

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
