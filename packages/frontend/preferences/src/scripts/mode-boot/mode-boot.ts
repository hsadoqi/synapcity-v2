import { LOOK_COOKIE_NAME, LOOK_VERSION } from '@synapcity/domain-preferences';

/** The key `next-themes` keeps its choice under (its default). */
export const MODE_STORAGE_KEY = 'theme';

/**
 * Runs before first paint, ahead of `next-themes`' own script. When the shared
 * look cookie holds a valid mode, it seeds `next-themes`' entry with it (so the
 * provider starts from the mode chosen on another host) and puts the matching
 * class and color-scheme on <html>. With no valid cookie it does nothing and
 * `next-themes` behaves as before. It never throws.
 */
export const modeBootScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${LOOK_COOKIE_NAME}=([^;]*)/);if(!m)return;var c=JSON.parse(decodeURIComponent(m[1]));if(!c||c.v!==${LOOK_VERSION}||!c.theme)return;var v=c.theme.mode;if(v!=='light'&&v!=='dark'&&v!=='system')return;try{localStorage.setItem(${JSON.stringify(MODE_STORAGE_KEY)},v)}catch(x){}var r=v==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):v;var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(r);e.style.colorScheme=r}catch(x){}})();`;
