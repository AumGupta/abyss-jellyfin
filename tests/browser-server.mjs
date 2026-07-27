import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4174);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png'
};

const items = [
  {
    Id: 'movie-1',
    Type: 'Movie',
    Name: 'Ocean Signal',
    Overview: 'A quiet science-fiction mystery beneath a frozen sea.',
    RunTimeTicks: 72000000000,
    OfficialRating: 'PG-13',
    CommunityRating: 8.4,
    UserData: { PlayedPercentage: 42 }
  },
  {
    Id: 'episode-1',
    SeriesId: 'series-1',
    Type: 'Episode',
    Name: 'The Crossing',
    SeriesName: 'Northbound',
    ParentIndexNumber: 1,
    IndexNumber: 3,
    Overview: 'The crew reaches the last open pass.',
    RunTimeTicks: 30000000000,
    CommunityRating: 7.9,
    UserData: {}
  }
];

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/Users/test-user/Items/Resume') {
    response.setHeader('Content-Type', contentTypes['.json']);
    response.end(JSON.stringify({ Items: items }));
    return;
  }
  if (url.pathname === '/Shows/NextUp') {
    response.setHeader('Content-Type', contentTypes['.json']);
    response.end('{"Items":[]}');
    return;
  }
  if (url.pathname.includes('/Images/')) {
    response.writeHead(404).end();
    return;
  }

  const pathname = url.pathname === '/' ? '/tests/spotlight-harness.html' : decodeURIComponent(url.pathname);
  const filePath = resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const metadata = await stat(filePath);
    if (!metadata.isFile()) throw new Error('Not a file');
    response.setHeader('Content-Type', contentTypes[extname(filePath)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Abyss browser fixture: http://127.0.0.1:${port}`);
});
