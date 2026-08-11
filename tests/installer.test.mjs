import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const shell = await readFile(new URL('../setup.sh', import.meta.url), 'utf8');
const powershell = await readFile(new URL('../setup.ps1', import.meta.url), 'utf8');
const docker = await readFile(new URL('../scripts/docker/abyss-spotlight.sh', import.meta.url), 'utf8');
const loader = await readFile(new URL('../scripts/spotlight/spotlight-loader.js', import.meta.url), 'utf8');
const batchInstall = await readFile(new URL('../scripts/spotlight/spotlight-install.bat', import.meta.url), 'utf8');
const batchUninstall = await readFile(new URL('../scripts/spotlight/spotlight-uninstall.bat', import.meta.url), 'utf8');

test('spotlight loader parses and owns the injection seam', () => {
  assert.doesNotThrow(() => new vm.Script(loader));
  assert.match(loader, /featurediframe/);
  assert.match(loader, /abyss-spotlight/);
  assert.match(loader, /postMessage/);
  assert.match(loader, /frameUrl\.search = loaderUrl\.search/);
});

test('installers use the loader instead of replacing webpack chunks', () => {
  for (const source of [shell, powershell, docker, batchInstall, batchUninstall]) {
    assert.match(source, /spotlight-loader\.js/);
    assert.match(source, /data-abyss-spotlight/);
  }
  assert.doesNotMatch(shell, /cp -f "\$chunk_src" "\$chunk_file"/);
  assert.doesNotMatch(powershell, /Copy-Item \$chunkSrc \$chunkFile/);
  for (const source of [shell, powershell, docker, batchInstall]) {
    assert.match(source, /spotlight-loader\.js\?v=/);
  }
});

test('installers preserve unrelated custom css', () => {
  assert.match(shell, /ABYSS THEME START/);
  assert.match(powershell, /ABYSS THEME START/);
  assert.doesNotMatch(shell, /d\['CustomCss'\]\s*=\s*''/);
  assert.doesNotMatch(powershell, /\.CustomCss\s*=\s*""/);
});

test('shell css transform is idempotent and uninstall is surgical', { skip: process.platform === 'win32' }, () => {
  const setupPath = fileURLToPath(new URL('../setup.sh', import.meta.url));
  const runTransform = (mode, input) => spawnSync(
    'bash',
    ['-c', 'source "$1"; transform_branding_json "$2"', 'bash', setupPath, mode],
    { input: JSON.stringify({ CustomCss: input }), encoding: 'utf8' }
  );
  const original = '.other-plugin { color: red; }';
  const installed = runTransform('install', original);
  assert.equal(installed.status, 0, installed.stderr);
  const installedCss = JSON.parse(installed.stdout).CustomCss;
  assert.equal(installedCss.match(/ABYSS THEME START/g)?.length, 1);
  assert.match(installedCss, /\.other-plugin/);
  assert.ok(installedCss.indexOf('@import') < installedCss.indexOf('.other-plugin'));

  const reinstalled = runTransform('install', installedCss);
  assert.equal(reinstalled.status, 0, reinstalled.stderr);
  const reinstalledCss = JSON.parse(reinstalled.stdout).CustomCss;
  assert.equal(reinstalledCss.match(/ABYSS THEME START/g)?.length, 1);

  const uninstalled = runTransform('uninstall', reinstalledCss);
  assert.equal(uninstalled.status, 0, uninstalled.stderr);
  assert.equal(JSON.parse(uninstalled.stdout).CustomCss, original);
});

test('windows powershell css transform is surgical', { skip: process.platform !== 'win32' }, () => {
  const setupPath = fileURLToPath(new URL('../setup.ps1', import.meta.url)).replaceAll("'", "''");
  const command = `$env:ABYSS_SETUP_LIB_ONLY='1'; . '${setupPath}'; $original='.other-plugin { color: red; }'; $installed=Add-AbyssCssText $original; $uninstalled=Remove-AbyssCssText $installed; [pscustomobject]@{Installed=$installed;Uninstalled=$uninstalled}|ConvertTo-Json -Compress`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const transformed = JSON.parse(result.stdout);
  assert.ok(transformed.Installed.indexOf('@import') < transformed.Installed.indexOf('.other-plugin'));
  assert.equal(transformed.Uninstalled, '.other-plugin { color: red; }');
});

test('windows installer rotates the spotlight cache token', { skip: process.platform !== 'win32' }, async () => {
  const setupPath = fileURLToPath(new URL('../setup.ps1', import.meta.url)).replaceAll("'", "''");
  const tempRoot = join(process.cwd(), '.tmp');
  await mkdir(tempRoot, { recursive: true });
  const fixture = await mkdtemp(join(tempRoot, 'windows-installer-'));
  const uiPath = join(fixture, 'ui');
  const loaderPath = join(uiPath, 'spotlight-loader.js');
  const spotlightPath = join(uiPath, 'spotlight.html');
  const cssPath = join(uiPath, 'spotlight.css');
  const indexPath = join(fixture, 'index.html');
  const patch = () => {
    const fixturePath = fixture.replaceAll("'", "''");
    const command = `$env:ABYSS_SETUP_LIB_ONLY='1'; . '${setupPath}'; Set-SpotlightLoader '${fixturePath}' $true`;
    return spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], { encoding: 'utf8' });
  };
  try {
    await mkdir(uiPath);
    await writeFile(indexPath, '<!doctype html><html><body></body></html>');
    await writeFile(loaderPath, 'loader version one');
    await writeFile(spotlightPath, 'spotlight version one');
    await writeFile(cssPath, 'styles version one');
    const firstPatch = patch();
    assert.equal(firstPatch.status, 0, firstPatch.stderr || firstPatch.stdout);
    const firstHtml = await readFile(indexPath, 'utf8');
    const firstToken = firstHtml.match(/spotlight-loader\.js\?v=([a-f0-9]{12})/)?.[1];
    assert.ok(firstToken);

    await writeFile(spotlightPath, 'spotlight version two');
    const secondPatch = patch();
    assert.equal(secondPatch.status, 0, secondPatch.stderr || secondPatch.stdout);
    const secondHtml = await readFile(indexPath, 'utf8');
    const secondToken = secondHtml.match(/spotlight-loader\.js\?v=([a-f0-9]{12})/)?.[1];
    assert.ok(secondToken);
    assert.notEqual(secondToken, firstToken);
    assert.equal(secondHtml.match(/data-abyss-spotlight/g)?.length, 1);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('shell installer remains compatible with macos bash', () => {
  assert.doesNotMatch(shell, /\$\{[^}]+\^\^}/);
});

test('shell index patch and legacy migration round trip safely', { skip: process.platform === 'win32' }, async () => {
  const setupPath = fileURLToPath(new URL('../setup.sh', import.meta.url));
  const tempRoot = join(process.cwd(), '.tmp');
  await mkdir(tempRoot, { recursive: true });
  const fixture = await mkdtemp(join(tempRoot, 'installer-'));
  const indexPath = join(fixture, 'index.html');
  const uiPath = join(fixture, 'ui');
  const loaderPath = join(uiPath, 'spotlight-loader.js');
  const spotlightPath = join(uiPath, 'spotlight.html');
  const cssPath = join(uiPath, 'spotlight.css');
  const chunkPath = join(fixture, 'home-html.fixture.chunk.js');
  const originalHtml = '<!doctype html><html><body><main>Jellyfin</main></body></html>\n';
  try {
    await mkdir(uiPath);
    await writeFile(loaderPath, 'loader version one');
    await writeFile(spotlightPath, 'spotlight version one');
    await writeFile(cssPath, 'styles version one');
    await writeFile(indexPath, originalHtml);
    await chmod(indexPath, 0o640);
    const patch = mode => spawnSync('bash', ['-c', 'source "$1"; set_spotlight_index "$2" "$3"', 'bash', setupPath, indexPath, mode], { encoding: 'utf8' });
    assert.equal(patch('install').status, 0);
    assert.equal(patch('install').status, 0);
    const installedHtml = await readFile(indexPath, 'utf8');
    assert.equal(installedHtml.match(/data-abyss-spotlight/g)?.length, 1);
    const firstToken = installedHtml.match(/spotlight-loader\.js\?v=([a-f0-9]{12})/)?.[1];
    assert.ok(firstToken);

    await writeFile(cssPath, 'styles version two');
    assert.equal(patch('install').status, 0);
    const updatedHtml = await readFile(indexPath, 'utf8');
    const secondToken = updatedHtml.match(/spotlight-loader\.js\?v=([a-f0-9]{12})/)?.[1];
    assert.ok(secondToken);
    assert.notEqual(secondToken, firstToken);
    assert.equal(updatedHtml.match(/data-abyss-spotlight/g)?.length, 1);
    assert.equal((await stat(indexPath)).mode & 0o777, 0o640);
    assert.equal(patch('uninstall').status, 0);
    assert.equal(await readFile(indexPath, 'utf8'), originalHtml);

    await writeFile(chunkPath, 'featurediframe');
    await writeFile(`${chunkPath}.bak`, 'original chunk');
    const restore = spawnSync('bash', ['-c', 'source "$1"; restore_legacy_chunk "$2"', 'bash', setupPath, fixture], { encoding: 'utf8' });
    assert.equal(restore.status, 0, restore.stderr);
    assert.equal(await readFile(chunkPath, 'utf8'), 'original chunk');
    await assert.rejects(readFile(`${chunkPath}.bak`));

    await writeFile(chunkPath, 'unrelated chunk');
    await writeFile(`${chunkPath}.bak`, 'unowned backup');
    const preserve = spawnSync('bash', ['-c', 'source "$1"; restore_legacy_chunk "$2"', 'bash', setupPath, fixture], { encoding: 'utf8' });
    assert.equal(preserve.status, 0, preserve.stderr);
    assert.equal(await readFile(chunkPath, 'utf8'), 'unrelated chunk');
    assert.equal(await readFile(`${chunkPath}.bak`, 'utf8'), 'unowned backup');
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
