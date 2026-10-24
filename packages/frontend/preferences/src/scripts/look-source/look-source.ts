import { LOOK_COOKIE_NAME, LOOK_VERSION } from '@synapcity/domain-preferences';

/**
 * A script expression that evaluates to the saved preferences object the boot
 * scripts read: the shared look cookie when it is version 1 with object
 * `theme` and `appearance`, otherwise the document in `localStorage`, otherwise
 * `{}`. It never throws. It checks the cookie's shape only; each boot script
 * still accepts just the values the schema allows, field by field, so a
 * tampered cookie can neither throw nor write an arbitrary attribute. The
 * full schema check lives in `readLookCookie`.
 */
export function lookSourceExpression(storageKey: string): string {
  return `(function(){try{var m=document.cookie.match(/(?:^|; )${LOOK_COOKIE_NAME}=([^;]*)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));if(c&&c.v===${LOOK_VERSION}&&c.theme&&typeof c.theme==='object'&&c.appearance&&typeof c.appearance==='object')return{theme:c.theme,appearance:c.appearance}}}catch(x){}try{return JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||'{}')}catch(x){return{}}})()`;
}
