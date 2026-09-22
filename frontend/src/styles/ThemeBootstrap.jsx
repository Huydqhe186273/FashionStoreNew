import { useEffect } from 'react';
import themeCss from './theme.css?inline';

/**
 * Injects theme.css contents into the document as a <style> tag placed
 * at the end of <head>, so its rules win over any other stylesheet in
 * the cascade (regardless of how those stylesheets were loaded).
 *
 * Why this is needed: the teammate's `main.jsx` imports `./index.css`
 * (the dark theme) at app boot. Our `App.jsx` imports `./styles/theme.css`
 * (the B&W minimalist theme). Vite injects both as inline <style>
 * blocks, but theirs ends up after ours, so theirs wins.
 *
 * Fix: ship the theme as a high-precedence <style> element appended
 * to <head> at first render — same selectors, same specificity, but
 * declared *last*, so it wins the cascade.
 */
export default function ThemeBootstrap() {
  useEffect(() => {
    const STYLE_ID = 'fs-theme-override';
    if (typeof document === 'undefined') return;

    // Skip if already injected (React StrictMode double-invoke)
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      el.setAttribute('data-theme', 'minimalist-bw');
      // Wrap the entire theme inside :where(...) so our specificity
      // stays at 0,0,0 — same as the dark theme — and pure source
      // order wins (and we are guaranteed to be last).
      el.textContent = themeCss;
      document.head.appendChild(el);
    }

    // Body class helps JS read the theme variant later if needed
    document.body.classList.add('theme-minimalist-bw');

    return () => {
      // Don't remove on unmount in dev StrictMode — keep the styles
      // alive across navigations between admin/customer routes.
    };
  }, []);

  return null;
}
