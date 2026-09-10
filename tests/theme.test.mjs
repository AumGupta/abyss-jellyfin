import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const theme = await readFile(new URL('../abyss.css', import.meta.url), 'utf8');
const lite = await readFile(new URL('../styles/abyss-lite.css', import.meta.url), 'utf8');

test('global inherited properties do not match every element', () => {
  assert.doesNotMatch(theme, /\*\s*{\s*scrollbar-color:/);
  assert.doesNotMatch(theme, /\*\s*{\s*accent-color:/);
});

test('drawer motion stays on compositor-friendly properties', () => {
  const drawer = theme.match(/\.mainDrawer\s*{\s*transition:([^}]+)}/)?.[1] || '';
  assert.match(drawer, /transform/);
  assert.doesNotMatch(drawer, /\bleft\b|\bwidth\b/);
});

test('theme exposes rendering-cost controls and reduced motion', () => {
  assert.match(theme, /--abyss-backdrop-blur:/);
  assert.match(theme, /--abyss-glass-blur:/);
  assert.match(theme, /prefers-reduced-motion/);
});

test('Jellyfin 12 modern UI uses stable MUI hooks and theme tokens', () => {
  assert.match(theme, /html\[data-theme=["']dark["']\]/);
  assert.match(theme, /--jf-palette-primary-main:/);
  assert.match(theme, /--jf-palette-primary-mainChannel:/);
  assert.match(theme, /--jf-palette-AppBar-defaultBg:/);
  assert.match(theme, /--jf-card-borderRadius:/);
  for (const className of [
    'MuiAppBar-root',
    'MuiToolbar-root',
    'MuiButton-root',
    'MuiIconButton-root',
    'MuiDrawer-paper',
    'MuiMenu-paper',
    'MuiDialog-paper'
  ]) {
    assert.match(theme, new RegExp(`\\.${className}`));
  }
  assert.doesNotMatch(theme, /\.css-[a-z0-9]+/i);
});

test('Jellyfin 12 app bar overlays an active Spotlight', () => {
  assert.match(theme, /html\.abyss-spotlight-visible\[data-theme=["']dark["']\]\s+\.MuiAppBar-root/);
  assert.match(theme, /\.MuiAppBar-root\s*\+\s*div\[aria-hidden=["']true["']\]/);
  assert.match(theme, /height:\s*0\s*!important/);
  assert.match(theme, /linear-gradient\(to bottom/);
});

test('lite override lowers rendering cost without replacing the theme', () => {
  assert.match(lite, /--abyss-backdrop-blur:/);
  assert.match(lite, /--abyss-glass-blur:/);
  assert.match(lite, /animation:\s*none/);
  assert.ok(lite.length < 3000, 'lite mode should remain a small override');
});
