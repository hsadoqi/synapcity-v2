import {
  bodyFonts,
  codeFonts,
  contrastModes,
  densities,
  headingFonts,
  LOOK_COOKIE_MAX_LENGTH,
  LOOK_COOKIE_NAME,
  LOOK_VERSION,
  lookModes,
  radii,
  textSizeRange,
} from '@synapcity/domain-preferences';

const lookOptions = {
  mode: lookModes,
  headingFont: headingFonts,
  bodyFont: bodyFonts,
  codeFont: codeFonts,
  radius: radii,
  density: densities,
  contrastMode: contrastModes,
};

/**
 * A compact, framework-free expression that returns the complete version-1
 * look cookie or `null`. Its enum lists, range and size cap are generated from
 * the same constants as `lookSchema`, so the first-paint scripts accept or
 * reject the cookie as one unit exactly as the React and server readers do.
 */
export const lookCookieExpression = `(function(){try{var p=${JSON.stringify(
  `${LOOK_COOKIE_NAME}=`,
)},e=document.cookie.split(';').map(function(x){return x.trimStart()}).find(function(x){return x.indexOf(p)===0});if(!e)return null;var r=e.slice(p.length);if(!r||r.length>${LOOK_COOKIE_MAX_LENGTH})return null;var c=JSON.parse(decodeURIComponent(r)),O=${JSON.stringify(
  lookOptions,
)},R=${JSON.stringify(
  textSizeRange,
)};function o(x){return x&&typeof x==='object'&&!Array.isArray(x)}function q(k,v){return typeof v==='string'&&O[k].indexOf(v)>-1}function b(v){return typeof v==='boolean'}if(!o(c)||c.v!==${LOOK_VERSION}||!o(c.theme)||!o(c.appearance))return null;var t=c.theme,a=c.appearance,n=t.textSize;if(!q('mode',t.mode)||!q('headingFont',t.headingFont)||!q('bodyFont',t.bodyFont)||!q('codeFont',t.codeFont)||!q('radius',t.radius)||!q('density',t.density)||typeof n!=='number'||n%1!==0||n<R.min||n>R.max||n%R.step!==0||!b(a.animationsEnabled)||!b(a.reducedMotion)||!q('contrastMode',a.contrastMode)||!b(a.showBorders))return null;return c}catch(x){return null}})()`;

/**
 * A script expression that evaluates to the saved preferences object the boot
 * scripts read: the fully valid shared look cookie, otherwise the document in
 * `localStorage`, otherwise `{}`. It never throws. One bad or missing cookie
 * field rejects the whole cookie and takes the fallback as a unit.
 */
export function lookSourceExpression(storageKey: string): string {
  return `(function(){try{var s=document.documentElement.getAttribute('data-synapcity-look');if(s){var c=JSON.parse(s);if(c&&c.v===${LOOK_VERSION}&&c.theme&&c.appearance)return{theme:c.theme,appearance:c.appearance}}}catch(x){}var c=${lookCookieExpression};if(c)return{theme:c.theme,appearance:c.appearance};try{return JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||'{}')}catch(x){return{}}})()`;
}
