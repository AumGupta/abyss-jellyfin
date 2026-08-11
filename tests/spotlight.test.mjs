import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../scripts/spotlight/spotlight.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../scripts/spotlight/spotlight.css', import.meta.url), 'utf8');
const loader = await readFile(new URL('../scripts/spotlight/spotlight-loader.js', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

test('spotlight inline script parses', () => {
  assert.ok(script, 'inline script should exist');
  assert.doesNotThrow(() => new vm.Script(script));
});

test('spotlight stylesheet inherits the installer cache token', () => {
  assert.match(html, /styleUrl\.search = window\.location\.search/);
  assert.doesNotMatch(html, /<link rel="stylesheet" href="spotlight\.css"/);
});

test('carousel renders are cancellable and self-scheduled', () => {
  assert.doesNotMatch(script, /setInterval\s*\(/);
  assert.match(script, /AbortController/);
  assert.match(script, /renderSequence/);
});

test('spotlight lifecycle pauses hidden work', () => {
  assert.match(script, /visibilitychange/);
  assert.match(script, /pagehide/);
  assert.match(script, /action === 'pause'/);
  assert.match(loader, /postMessage/);
  assert.match(loader, /indexPage/);
  assert.match(loader, /homeActive/);
  assert.match(loader, /isConnected/);
});

test('image requests are bounded and cached', () => {
  assert.match(script, /maxWidth=/);
  assert.match(script, /maxHeight=/);
  assert.match(script, /imageCache/);
});

test('spotlight avoids known paint and accessibility regressions', () => {
  assert.doesNotMatch(css, /transition:\s*all/);
  assert.doesNotMatch(css, /--webkit-backdrop-filter/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(html, /id="clickzone"[^>]*aria-label=/);
});
