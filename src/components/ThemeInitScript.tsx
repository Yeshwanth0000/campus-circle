const THEME_INIT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function ThemeInitScript() {
  // A plain server-rendered <script> (no next/script) so it's part of the
  // initial HTML and runs before paint — avoids a flash of the wrong theme
  // without React treating it as a client re-render no-op.
  // eslint-disable-next-line @next/next/no-sync-scripts
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}
