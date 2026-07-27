import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../scripts/spotlight/spotlight.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../scripts/spotlight/spotlight.css', import.meta.url), 'utf8');
const wrapper = await readFile(new URL('../scripts/spotlight/home-html.chunk.js', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

test('spotlight inline script parses', () => {
  assert.ok(script, 'inline script should exist');
  assert.doesNotThrow(() => new vm.Script(script));
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
  assert.match(wrapper, /postMessage/);
  assert.match(wrapper, /indexPage/);
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
