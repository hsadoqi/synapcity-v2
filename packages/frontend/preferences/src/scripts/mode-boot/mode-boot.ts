import { lookCookieExpression } from '../look-source/look-source';

/** The key `next-themes` keeps its choice under (its default). */
export const MODE_STORAGE_KEY = 'theme';

/**
 * Runs before first paint, ahead of `next-themes`' own script. When the shared
 * look cookie holds a valid mode, it seeds `next-themes`' entry with it (so the
 * provider starts from the mode chosen on another host) and puts the matching
 * class and color-scheme on <html>. With no valid cookie it does nothing and
 * `next-themes` behaves as before. It never throws.
 */
export const modeBootScript = `(function(){try{var c=${lookCookieExpression};if(!c)return;var v=c.theme.mode;try{localStorage.setItem(${JSON.stringify(MODE_STORAGE_KEY)},v)}catch(x){}var r=v==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):v;var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(r);e.style.colorScheme=r}catch(x){}})();`;
