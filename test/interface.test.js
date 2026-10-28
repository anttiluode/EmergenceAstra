import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('viewer exposes limits and does not attribute every convention to learning', async () => {
  const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(!html.includes('Every convention has to be learned'));
  assert.match(html, /id="world-limits"/);
  assert.match(html, /current code/);
});
