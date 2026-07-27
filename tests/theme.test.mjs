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

test('lite override lowers rendering cost without replacing the theme', () => {
  assert.match(lite, /--abyss-backdrop-blur:/);
  assert.match(lite, /--abyss-glass-blur:/);
  assert.match(lite, /animation:\s*none/);
  assert.ok(lite.length < 3000, 'lite mode should remain a small override');
});
