import assert from 'node:assert/strict';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const docsUrl = new URL('../docs/', import.meta.url);
const html = await readFile(new URL('index.html', docsUrl), 'utf8');
const css = await readFile(new URL('style.css', docsUrl), 'utf8');
const script = await readFile(new URL('script.js', docsUrl), 'utf8');
const manifestUrl = new URL('assets/favicon/site.webmanifest', docsUrl);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));

test('manifest icons resolve beside the manifest', async () => {
  for (const icon of manifest.icons) await access(new URL(icon.src, manifestUrl));
});

test('preview images use modern sources and intrinsic dimensions', () => {
  const preview = html.match(/<section[^>]+id="preview"[\s\S]*?<\/section>/)?.[0] || '';
  assert.equal((preview.match(/<picture>/g) || []).length, 12);
  assert.equal((preview.match(/<source[^>]+type="image\/webp"/g) || []).length, 12);
  assert.equal((preview.match(/<img[^>]+width="\d+"[^>]+height="\d+"/g) || []).length, 12);
});

test('optimized gallery stays within its transfer budget', async () => {
  const assetsUrl = new URL('assets/images/', docsUrl);
  const names = (await readdir(assetsUrl)).filter(name => name.endsWith('.webp') && name !== 'demo-thumbnail.webp');
  const sizes = await Promise.all(names.map(name => stat(new URL(name, assetsUrl))));
  assert.ok(sizes.reduce((total, file) => total + file.size, 0) < 2_000_000);
});

test('hero defers youtube and navigation respects user input', () => {
  assert.doesNotMatch(html, /<iframe[\s\S]+youtube\.com/);
  assert.match(html, /class="video-facade"/);
  assert.match(script, /matchMedia\('\(max-width: 768px\)'\)/);
  assert.match(script, /event\.key === 'Escape'/);
  assert.doesNotMatch(script, /setTimeout\([\s\S]*refined/);
});

test('documentation site supports reduced motion', () => {
  assert.match(css, /prefers-reduced-motion/);
});
