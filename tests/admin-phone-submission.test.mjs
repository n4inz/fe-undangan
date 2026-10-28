import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

const retainedFixtures = [];
const customerPhone = '081122223333';

async function submissionHarness(type) {
  const wedding = type === 'wedding';
  const filename = wedding ? '../src/app/(form)/forms/new/page.js' : '../src/app/(form)/forms/aqiqah-khitan/new/page.js';
  const source = await readFile(new URL(filename, import.meta.url), 'utf8');
  const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let submit;
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === 'handleSubmit') submit = node.initializer.getText(parsed);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  assert.ok(submit, 'Exercise the actual create handler from the page');
  const importPaths = new Set(['zod', '@/lib/validation', '@/lib/resellerBrand', '@/lib/formNavigation']);
  const imports = parsed.statements.filter(node => ts.isImportDeclaration(node) && importPaths.has(node.moduleSpecifier.text)).map(node => node.getText(parsed));
  // AK validation and payload normalization are top-level pure helpers. Retain
  // those actual helpers while isolating submit from the page's visual controls.
  const prelude = wedding ? '' : parsed.statements.filter(node => ts.isVariableStatement(node)
    && !node.declarationList.declarations.some(declaration => declaration.name.getText(parsed) === 'FormAqiqahKhitanPage'))
    .map(node => node.getText(parsed)).join('\n');
  const requests = [];
  const redirects = [];
  const storageWrites = [];
  const removedStorageKeys = [];
  class MockFormData {
    values = [];
    append(key, value) { this.values.push([key, value]); }
    get(key) { return this.values.find(([name]) => name === key)?.[1] ?? null; }
  }
  const context = vm.createContext({
    URL, URLSearchParams, FormData: MockFormData,
    process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } },
    console, session: { user: { name: 'Account', email: 'customer@example.test', image: 'avatar.png', sessionToken: 'customer-session' } },
    isSubmitting: false, brandLoading: false, brandError: null,
    isLocalStorageAccessibleState: true, storageReady: true,
    ...(wedding ? { FORM_DATA_KEY: 'formData' } : {}),
    fields: [
      { name: 'name', label: 'Nama', type: 'String', required: true },
      { name: 'nomorWhatsapp', label: 'WhatsApp', type: 'String', required: true },
      { name: 'namaAnak', label: 'Nama Anak', type: 'String', required: true },
      { name: 'idTema', label: 'Tema', type: 'Int', required: true },
    ],
    rekeningList: [{ namaRekening: 'Customer', nomorRekening: '1234567890', icon: 'bank' }],
    weddingEvents: [{ nama: 'Acara', tanggal: '2026-11-01', waktu: '10:00', tempat: 'Rumah', alamat: 'Alamat' }],
    setIsLoading() {}, setErrors(errors) { assert.deepEqual(Object.keys(errors), []); },
    setIsSubmitting() {}, setSubmitError(value) { assert.equal(value, ''); },
    scrollToFirstError() { assert.fail('The valid customer payload must submit'); },
    sendNotification: async () => {},
    alert(message) { assert.fail(message); },
    router: { push: url => redirects.push(url) },
    window: { localStorage: {
      setItem: (...args) => storageWrites.push(args),
      removeItem: key => removedStorageKeys.push(key),
    } },
    axios: {
      get: async (url, options) => {
        requests.push({ method: 'GET', url, options });
        return { data: { token: 'form-token' } };
      },
      post: async (url, payload, options) => {
        requests.push({ method: 'POST', url, payload, options });
        return { data: { uuid: 'created-uuid', formId: 'created-uuid', nomorWa: customerPhone } };
      },
    },
  });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const module = new vm.SourceTextModule(`${imports.join('\n')}\n${prelude}\nexport const handleSubmit = ${submit};`, { context });
  const helper = new vm.SourceTextModule(await readFile(new URL('../src/lib/resellerBrand.js', import.meta.url), 'utf8'), { context });
  const navigation = new vm.SourceTextModule(await readFile(new URL('../src/lib/formNavigation.js', import.meta.url), 'utf8'), { context });
  const validation = new vm.SourceTextModule(await readFile(new URL('../src/lib/validation.js', import.meta.url), 'utf8'), { context });
  await module.link(name => {
    if (name === '@/lib/resellerBrand') return helper;
    if (name === '@/lib/formNavigation') return navigation;
    if (name === '@/lib/validation') return validation;
    if (name === 'zod') return mock({ z });
    assert.fail(`Unexpected submission dependency: ${name}`);
  });
  await module.evaluate();
  const fixture = {
    module, context, requests, redirects, storageWrites, removedStorageKeys,
    async submit(query) {
      requests.length = redirects.length = removedStorageKeys.length = 0;
      context.searchParams = new URLSearchParams(query);
      context.isReseller = context.searchParams.has('brand');
      context.brand = context.isReseller ? { brandSlug: context.searchParams.get('brand') } : null;
      context.formData = wedding ? {
        name: 'Customer', nomorWa: '0811 2222 3333', namaLengkapPria: 'Raka', namaPanggilanPria: 'Raka', namaOrtuPria: 'Ortu Raka',
        namaLengkapWanita: 'Rini', namaPanggilanWanita: 'Rini', namaOrtuWanita: 'Ortu Rini', alamatAkad: 'Alamat',
        datetimeAkad: '2026-11-01', timeAkad: '10:00', pilihanTema: 'Tema', idTema: 4,
      } : { name: 'Customer', nomorWhatsapp: customerPhone, namaAnak: 'Alya', idTema: 4 };
      const original = JSON.stringify(context.formData);
      await module.namespace.handleSubmit({ preventDefault() {} });
      assert.equal(JSON.stringify(context.formData), original, 'Routing metadata must not change the customer draft');
      assert.equal(storageWrites.length, 0, 'Admin phone must not be saved in customer localStorage');
      return requests.find(request => request.method === 'POST');
    },
  };
  retainedFixtures.push(fixture);
  return fixture;
}

for (const type of ['wedding', 'aqiqah-khitan']) {
  test(`${type}: create persists only a single valid phone query, independently of customer phone and reseller brand`, async () => {
    const app = await submissionHarness(type);
    for (const [query, expected] of [
      ['', null],
      ['phone=0812-3456-7890', '0812-3456-7890'],
      ['phone=%2B62+812-3456-7890', '+62 812-3456-7890'],
      ['phone=%2B819012345678', '+819012345678'],
      ['phone=invalid', null],
      ['phone=', null],
      ['phone=081234567890&phone=089876543210', null],
      ['brand=brand-one', null],
      ['brand=brand-one&phone=089876543210', '089876543210'],
    ]) {
      const request = await app.submit(query);
      assert.ok(request, query || 'No routing parameters');
      const wedding = type === 'wedding';
      const customer = wedding ? JSON.parse(request.payload.get('data')) : request.payload;
      assert.equal(wedding ? request.payload.get('adminPhone') : customer.adminPhone, expected, query);
      assert.equal(customer[wedding ? 'nomorWa' : 'nomorWhatsapp'], customerPhone);
      if (wedding) {
        assert.equal('adminPhone' in customer, false, 'Admin destination belongs in the outer multipart field');
        assert.equal(JSON.parse(request.payload.get('rekeningList'))[0].nomorRekening, '1234567890');
        assert.equal(JSON.parse(request.payload.get('weddingEvents'))[0].nama, 'Acara');
        assert.equal(JSON.parse(request.payload.get('session')).email, 'customer@example.test');
      } else {
        assert.equal(customer.customerSessionToken, 'customer-session');
        assert.equal(customer.namaAnak, 'Alya');
      }
      assert.equal(wedding ? request.payload.get('brandSlug') : customer.brandSlug ?? null, query.includes('brand=') ? 'brand-one' : null);
      assert.equal(request.options.withCredentials, true);
      assert.equal(request.options.headers.Authorization, 'Bearer form-token');
      assert.equal(app.requests[0].options.withCredentials, true);
      assert.equal(app.removedStorageKeys[0], wedding ? 'formData' : 'formAqiqahKhitanData');
      const redirect = new URL(app.redirects[0], 'https://forms.example.test');
      assert.equal(redirect.pathname, wedding ? `/forms/created-uuid/${customerPhone}/atur-foto` : '/forms/aqiqah-khitan/created-uuid/atur-foto');
      assert.deepEqual([...redirect.searchParams], [...new URLSearchParams(query)]);
    }
  });
}
