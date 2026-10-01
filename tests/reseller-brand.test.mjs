import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const helperSource = await readFile(new URL('../src/lib/resellerBrand.js', import.meta.url), 'utf8');
const hookSource = await readFile(new URL('../src/components/reseller/useResellerBrand.js', import.meta.url), 'utf8');

async function harness({ query = '', pathname = '/forms/new', swr = {}, session = {}, status = 'unauthenticated' } = {}) {
  const calls = [];
  const redirects = [];
  const context = vm.createContext({ URL, URLSearchParams, process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } } });
  const helpers = new vm.SourceTextModule(helperSource, { context });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const dependencies = {
    react: mock({ useEffect: effect => effect() }),
    axios: mock({ default: { get: async (...args) => { calls.push({ request: args }); return { data: { ok: true } }; } } }),
    swr: mock({ default: (key, fetcher) => {
      calls.push({ key, fetcher });
      return { isLoading: Boolean(key), mutate: () => {}, ...swr };
    } }),
    'next/navigation': mock({
      useSearchParams: () => new URLSearchParams(query),
      usePathname: () => pathname,
      useRouter: () => ({ replace: (url, options) => redirects.push({ url, options }) }),
    }),
    'next-auth/react': mock({ useSession: () => ({ data: session, status }) }),
    '@/lib/resellerBrand': helpers,
  };
  const hooks = new vm.SourceTextModule(hookSource, { context });
  await hooks.link(name => dependencies[name]);
  await hooks.evaluate();
  return { helpers: helpers.namespace, hooks: hooks.namespace, calls, redirects };
}

test('normal forms have no brand lookup; malformed brand links redirect automatically', async () => {
  const normal = await harness();
  assert.equal(normal.hooks.useResellerBrand().isReseller, false);
  assert.equal(normal.calls[0].key, null);
  assert.equal(normal.redirects.length, 0);
  for (const query of ['brand=', 'brand=a', 'brand=one&brand=two', 'brand=bad/slug']) {
    const app = await harness({ query });
    const state = app.hooks.useResellerBrand();
    assert.equal(state.error, null);
    assert.equal(state.loading, true);
    assert.equal(state.isReseller, false);
    assert.equal(app.calls[0].key, null);
    assert.equal(app.redirects[0].url, '/forms/new');
  }
});

test('branding requires a successful matching lookup and handles stale/failed responses', async () => {
  const brand = { brandSlug: 'weddingku', brandName: 'WeddingKu' };
  const app = await harness({ query: 'brand=WeddingKu', swr: { data: { brand }, isLoading: false } });
  assert.equal(app.hooks.useResellerBrand().brand, brand);
  assert.equal(app.calls[0].key[0], '/brands/weddingku');
  assert.equal(app.redirects.length, 0);
  const stale = await harness({ query: 'brand=another', swr: { data: { brand }, isLoading: false } });
  assert.ok(stale.hooks.useResellerBrand().error);
  const failed = await harness({ query: 'brand=weddingku', swr: { error: { response: { status: 404 } }, isLoading: false } });
  assert.equal(failed.hooks.useResellerBrand().error, null);
  assert.equal(failed.redirects[0].url, '/forms/new');
  for (const data of [null, undefined, '', false, 0, {}]) {
    const empty = await harness({ query: 'brand=weddingku', swr: { data, isLoading: false } });
    assert.ok(empty.hooks.useResellerBrand().error);
  }
});

test('missing brands redirect both forms without removing theme, referral, or date parameters', async () => {
  for (const pathname of ['/forms/new', '/forms/aqiqah-khitan/new']) {
    const app = await harness({ pathname, query: 'brand=missing&theme=rose&ref=partner&date=2026-10-01', swr: { error: { response: { status: 404 } }, isLoading: false } });
    const state = app.hooks.useResellerBrand();
    assert.equal(state.loading, true);
    assert.equal(state.error, null);
    assert.equal(app.redirects[0].url, `${pathname}?theme=rose&ref=partner&date=2026-10-01`);
    assert.equal(app.redirects[0].options.scroll, false);
    const bareTheme = await harness({ pathname, query: '=rose&brand=', swr: { isLoading: false } });
    bareTheme.hooks.useResellerBrand();
    assert.equal(bareTheme.redirects[0].url, `${pathname}?=rose`);
  }
});

test('temporary lookup failures never discard an unverified reseller brand', async () => {
  for (const error of [new Error('offline'), { response: { status: 500 } }]) {
    const app = await harness({ query: 'brand=weddingku', swr: { error, isLoading: false } });
    assert.ok(app.hooks.useResellerBrand().error);
    assert.equal(app.redirects.length, 0);
  }
});

test('persisted attribution ignores query brand and keeps reseller mode without a current brand owner', async () => {
  const app = await harness({ query: 'brand=someone-else', swr: { data: { orderId: 123, isReseller: true, brand: null }, isLoading: false } });
  const state = app.hooks.useOrderBrand({ type: 'wedding', formId: 'opaque-uuid' });
  assert.equal(state.isReseller, true);
  assert.equal(state.brand, null);
  assert.equal(state.orderId, 123);
  assert.equal(state.error, null);
  assert.equal(app.calls[0].key[0], '/form-brand/wedding/opaque-uuid');
  await app.calls[0].fetcher(app.calls[0].key);
  assert.equal(app.calls[1].request[1].withCredentials, false);
  assert.equal(app.calls[1].request[1].headers.Authorization, undefined);
});

test('numeric legacy order links wait for auth and carry session credentials', async () => {
  const pending = await harness({ status: 'loading' });
  assert.equal(pending.hooks.useOrderBrand({ type: 'wedding', formId: '12' }).loading, true);
  assert.equal(pending.calls[0].key, null);
  const app = await harness({ status: 'authenticated', session: { user: { sessionToken: 'customer-session' } } });
  app.hooks.useOrderBrand({ type: 'aqiqah-khitan', formId: '12' });
  await app.calls[0].fetcher(app.calls[0].key);
  assert.equal(app.calls[1].request[1].withCredentials, true);
  assert.equal(app.calls[1].request[1].headers.Authorization, 'Bearer customer-session');
});

test('failed or malformed order metadata never silently enables payment', async () => {
  for (const swr of [{ error: new Error('offline'), isLoading: false }, ...[{}, null, undefined, '', false, 0].map(data => ({ data, isLoading: false }))]) {
    const app = await harness({ swr });
    assert.ok(app.hooks.useOrderBrand({ type: 'wedding', formId: 'uuid' }).error);
  }
  const normal = await harness({ swr: { data: { orderId: 124, isReseller: false, brand: null }, isLoading: false } });
  assert.equal(normal.hooks.useOrderBrand({ type: 'aqiqah-khitan', formId: 'uuid' }).error, null);
});

test('order identifiers come from saved numeric metadata and never fall back to URL UUIDs', async () => {
  for (const orderId of [undefined, 'opaque-uuid', -1, 0, {}, 1.5]) {
    const app = await harness({ swr: { data: { orderId, isReseller: true, brand: null }, isLoading: false } });
    const state = app.hooks.useOrderBrand({ type: 'wedding', formId: 'opaque-uuid' });
    assert.ok(state.error);
    assert.equal(state.orderId, null);
  }
});

test('reseller editor can skip legacy public brand lookup entirely', async () => {
  const app = await harness({ status: 'loading' });
  const state = app.hooks.useOrderBrand({ type: 'wedding', formId: '123', enabled: false });
  assert.equal(app.calls[0].key, null);
  assert.equal(state.loading, false);
  assert.equal(state.error, null);
});

test('reseller contact supports WhatsApp/email and rejects executable or invalid URLs', async () => {
  const { helpers } = await harness();
  const whatsapp = new URL(helpers.resellerContactUrl('0812-3456-7890'));
  assert.equal(whatsapp.pathname, '/6281234567890');
  assert.match(whatsapp.searchParams.get('text'), /mengaktifkan undangan/);
  assert.match(helpers.resellerContactUrl('sales@example.test'), /^mailto:/);
  assert.match(helpers.resellerContactUrl('wa.me/6281234567890'), /^https:\/\/wa.me\//);
  for (const contact of ['javascript:alert(1)', 'data:text/html,test', 'https://name:secret@example.test', '123', '', null]) {
    assert.equal(helpers.resellerContactUrl(contact), null);
  }
  assert.equal(helpers.brandLogoUrl('javascript:alert(1)'), '');
  assert.equal(helpers.brandLogoUrl('//untrusted.test/logo.png'), '');
  assert.equal(helpers.brandLogoUrl('/images/logo.webp'), 'https://api.example.test/images/logo.webp');
});

test('WhatsApp and email activation messages include only the numeric order identifier', async () => {
  const { helpers } = await harness();
  const whatsapp = new URL(helpers.resellerContactUrl('081234567890', undefined, 123));
  assert.match(whatsapp.searchParams.get('text'), /ID pesanan: 123\./);
  const email = new URL(helpers.resellerContactUrl('sales@example.test', undefined, '123'));
  assert.match(email.searchParams.get('body'), /ID pesanan: 123\./);
  for (const invalid of ['opaque-uuid', '1e3', -1, 0, null, undefined, {}, ['123']]) {
    const url = new URL(helpers.resellerContactUrl('081234567890', undefined, invalid));
    assert.doesNotMatch(url.searchParams.get('text'), /ID pesanan:|uuid/);
  }
});
