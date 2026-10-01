import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const module = new vm.SourceTextModule(await readFile(new URL('../src/lib/form-theme.js', import.meta.url), 'utf8'));
await module.link(() => { throw new Error('Unexpected dependency'); });
await module.evaluate();
const { getFormTheme } = module.namespace;

test('reseller, referral and date parameters never become a locked wedding theme', () => {
  for (const query of ['', 'brand=weddingku', 'brand=', 'ref=hello&date=2026-10-01&brand=weddingku']) {
    assert.equal(getFormTheme(new URLSearchParams(query)), '');
  }
});

test('existing empty-key and bare theme links still work together with reseller metadata', () => {
  for (const query of ['=classic', 'classic', '=classic&brand=weddingku', 'brand=weddingku&classic&date=2026-10-01']) {
    assert.equal(getFormTheme(new URLSearchParams(query)), 'classic');
  }
  assert.equal(getFormTheme(new URLSearchParams('theme=classic&brand=weddingku')), 'classic');
});
