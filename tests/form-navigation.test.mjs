import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const helperSource = await readFile(new URL('../src/lib/formNavigation.js', import.meta.url), 'utf8');
const helper = new vm.SourceTextModule(helperSource, { context: vm.createContext({ URLSearchParams }) });
await helper.link(() => assert.fail('Navigation helper should have no dependencies'));
await helper.evaluate();
const { appendFormQuery } = helper.namespace;

test('reseller and legacy metadata survive the complete form route sequence without renaming', () => {
  const query = new URLSearchParams('brand=weddingku&phone=%2B62+812-3456-7890&=classic&ref=partner&date=2026-10-01');
  for (const base of ['/forms/order-uuid/081111111111/atur-foto', '/forms/aqiqah-khitan/order-uuid/atur-foto']) {
    let current = query;
    for (const path of [base, `${base}/success`, `${base}/success/result`, `${base}/success/result/edit`, `${base}/success/result`, `${base}/success`]) {
      const address = new URL(appendFormQuery(path, current), 'https://forms.example.test');
      assert.equal(address.pathname, path);
      assert.deepEqual([...address.searchParams], [...query]);
      current = address.searchParams;
    }
  }
});

test('navigation retains duplicate query values and respects explicit destination parameters and anchors', () => {
  const query = new URLSearchParams('brand=old-brand&phone=081234567890&phone=089876543210&theme=rose');
  const address = new URL(appendFormQuery('result/edit?brand=new-brand#details', query), 'https://forms.example.test/forms/');
  assert.equal(address.pathname, '/forms/result/edit');
  assert.equal(address.hash, '#details');
  assert.deepEqual(address.searchParams.getAll('brand'), ['new-brand']);
  assert.deepEqual(address.searchParams.getAll('phone'), ['081234567890', '089876543210']);
  assert.equal(address.searchParams.get('theme'), 'rose');
});

test('normal routes and external links keep their original addresses', () => {
  for (const query of [undefined, null, new URLSearchParams()]) {
    assert.equal(appendFormQuery('/forms/order/0812/atur-foto/success', query), '/forms/order/0812/atur-foto/success');
  }
  const query = new URLSearchParams('phone=081234567890&brand=weddingku');
  for (const address of ['https://invitation.example.test/slug', '//invitation.example.test/slug', 'mailto:admin@example.test']) {
    assert.equal(appendFormQuery(address, query), address);
  }
});

async function photoFormHarness(type) {
  const isAk = type === 'aqiqah-khitan';
  const filename = isAk ? '../src/components/atur-foto/aqiqah-khitan/MultiStepForm.js' : '../src/components/atur-foto/MultiStepForm.js';
  const source = await readFile(new URL(filename, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'MultiStepForm.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  let query = '';
  const pathname = isAk ? '/forms/aqiqah-khitan/order-uuid/atur-foto' : '/forms/order-uuid/081111111111/atur-foto';
  const redirects = [];
  const effects = [];
  let stateIndex = 0;
  const initialState = [isAk ? 7 : 12, false, false];
  const context = vm.createContext({ URLSearchParams, process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } }, console });
  const helpers = new vm.SourceTextModule(helperSource, { context });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const component = new vm.SourceTextModule(outputText, { context });
  await component.link(specifier => {
    if (specifier === 'react/jsx-runtime') return mock({ jsx: () => null, jsxs: () => null });
    if (specifier === 'react') return mock({
      useState: initial => [stateIndex < initialState.length ? initialState[stateIndex++] : initial, () => {}],
      useRef: initial => ({ current: initial }),
      useCallback: callback => callback,
      useEffect: callback => effects.push(callback),
    });
    if (specifier === 'next/navigation') return mock({
      useRouter: () => ({ push: value => redirects.push(value) }),
      useParams: () => ({ formId: 'order-uuid', phoneNumber: '081111111111' }),
      usePathname: () => pathname,
      useSearchParams: () => new URLSearchParams(query),
    });
    if (specifier === 'axios') return mock({ default: { post: async () => ({ status: 200 }) } });
    if (specifier === '@/lib/formNavigation') return helpers;
    return mock({ default: 'Step', Toaster: 'Toaster', Button: 'Button', max: () => {} });
  });
  await component.evaluate();
  return {
    async complete(search) {
      query = search;
      stateIndex = 0;
      effects.length = 0;
      redirects.length = 0;
      component.namespace.default({ onFormChange() {} });
      effects.forEach(callback => callback());
      await new Promise(resolve => setImmediate(resolve));
      return redirects[0];
    },
    pathname,
  };
}

test('both photo flows retain phone-only, brand-only, combined, and absent query parameters after thumbnail generation', async () => {
  for (const type of ['wedding', 'aqiqah-khitan']) {
    const app = await photoFormHarness(type);
    for (const query of ['', 'phone=081234567890', 'brand=weddingku', 'brand=weddingku&phone=081234567890', 'brand=&phone=']) {
      const result = await app.complete(query);
      const address = new URL(result, 'https://forms.example.test');
      assert.equal(address.pathname, `${app.pathname}/success`);
      assert.deepEqual([...address.searchParams], [...new URLSearchParams(query)]);
    }
  }
});
