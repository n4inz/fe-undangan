import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const customer = { id: 7, name: 'Customer', email: 'customer@example.com', isAdmin: 0, role: 'user' };
const submit = { preventDefault() {} };
const change = value => ({ target: { value } });

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

async function loadComponent(path, props = {}, putResponse, { getResponse } = {}) {
  const source = await readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'component.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const objectUrls = { created: [], revoked: [] };
  class MockFormData {
    values = [];
    append(key, value) { this.values.push([key, value]); }
    entries() { return this.values[Symbol.iterator](); }
  }
  const context = vm.createContext({
    process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } },
    AbortController,
    FormData: MockFormData,
    URL: class extends URL {
      static createObjectURL(file) {
        objectUrls.created.push(file);
        return `blob:brand-logo-${objectUrls.created.length}`;
      }
      static revokeObjectURL(url) { objectUrls.revoked.push(url); }
    },
  });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const helper = new vm.SourceTextModule(await readFile(new URL('../src/lib/adminResellerBrand.js', import.meta.url), 'utf8'), { context });
  const resellerHelper = new vm.SourceTextModule(await readFile(new URL('../src/lib/resellerBrand.js', import.meta.url), 'utf8'), { context });
  const state = [];
  const refs = [];
  const callbacks = [];
  const effects = [];
  let cursor = 0;
  let refCursor = 0;
  let callbackCursor = 0;
  let effectCursor = 0;
  const requests = [];
  const notifications = [];
  const pendingGets = new Set();
  const sameDependencies = (previous, next) => previous && next && previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
  const axios = {
    isCancel: () => false,
    get: (...args) => {
      requests.push(['get', ...args]);
      const pending = Promise.resolve().then(() => getResponse ? getResponse(...args) : { data: { data: [], total: 0 } });
      pendingGets.add(pending);
      pending.then(() => pendingGets.delete(pending), () => pendingGets.delete(pending));
      return pending;
    },
    put: async (...args) => {
      requests.push(['put', ...args]);
      const payload = args[1] instanceof MockFormData ? Object.fromEntries(args[1].entries()) : args[1];
      return putResponse ? putResponse(...args) : { data: { message: 'Berhasil', customer: { ...customer, ...payload } } };
    },
  };
  const uiNames = ['Button', 'Badge', 'Input', 'Label', 'Card', 'CardContent', 'CardHeader', 'CardDescription', 'CardTitle', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'AlertDialog', 'AlertDialogCancel', 'AlertDialogContent', 'AlertDialogDescription', 'AlertDialogFooter', 'AlertDialogHeader', 'AlertDialogTitle'];
  const component = new vm.SourceTextModule(outputText, { context });
  await component.link(specifier => {
    if (specifier === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx, Fragment: 'Fragment' });
    }
    if (specifier === 'react') return mock({
      useState: initial => {
        const index = cursor++;
        if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
        return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useRef: initial => {
        const index = refCursor++;
        if (!(index in refs)) refs[index] = { current: initial };
        return refs[index];
      },
      useCallback: (callback, dependencies) => {
        const index = callbackCursor++;
        if (!sameDependencies(callbacks[index]?.dependencies, dependencies)) callbacks[index] = { callback, dependencies };
        return callbacks[index].callback;
      },
      useEffect: (callback, dependencies) => {
        const index = effectCursor++;
        effects[index] = { ...effects[index], callback, nextDependencies: dependencies };
      },
    });
    if (specifier === 'axios') return mock({ default: axios });
    if (specifier === 'next/image') return mock({ default: 'Image' });
    if (specifier === 'lucide-react') return mock({ ExternalLink: 'ExternalLink' });
    if (specifier === 'next/link') return mock({ default: 'Link' });
    if (specifier === 'react-data-table-component') return mock({ default: 'DataTable' });
    if (specifier === 'react-debounce-input') return mock({ DebounceInput: 'DebounceInput' });
    if (specifier === '@/components/ui/use-toast') return mock({ toast: value => notifications.push(value) });
    if (specifier === '@/lib/adminResellerBrand') return helper;
    if (specifier === '@/lib/resellerBrand') return resellerHelper;
    return mock(Object.fromEntries(uiNames.map(name => [name, name])));
  });
  await component.evaluate();
  const render = () => {
    cursor = 0;
    refCursor = 0;
    callbackCursor = 0;
    effectCursor = 0;
    return component.namespace.default(props);
  };
  const flushEffects = async ({ waitForRequests = true } = {}) => {
    await new Promise(resolve => setImmediate(resolve));
    for (let iteration = 0; iteration < 20; iteration++) {
      const tree = render();
      const pendingEffects = effects.filter(effect => !sameDependencies(effect.dependencies, effect.nextDependencies));
      if (!pendingEffects.length && (!pendingGets.size || !waitForRequests)) return tree;
      for (const effect of pendingEffects) {
        effect.cleanup?.();
        effect.dependencies = effect.nextDependencies?.slice();
        effect.cleanup = effect.callback();
      }
      if (waitForRequests) {
        while (pendingGets.size) await Promise.allSettled([...pendingGets]);
      }
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.fail('Component effects did not settle');
  };
  const find = predicate => nodes(render()).find(predicate);
  const byId = id => find(node => node.props?.id === id);
  const openRoleDialog = row => {
    const table = find(node => node.type === 'DataTable');
    const actionColumn = table.props.columns.find(column => column.name === 'Aksi');
    nodes(actionColumn.cell(row)).find(node => node.type === 'Button' && node.props.onClick).props.onClick();
  };
  return { render, find, byId, openRoleDialog, flushEffects, requests, notifications, objectUrls, helper: helper.namespace };
}

async function loadPromotionEditor(screen, row = customer) {
  const modal = screen === 'modal';
  const fixture = await loadComponent(
    modal ? 'app/(admin)/admin/customer/page.js' : 'components/admin/CustomerAccountForm.js',
    modal ? {} : { customer: row, onSaved() {} }
  );
  if (modal) fixture.openRoleDialog(row);
  else fixture.find(node => node.type === 'Select').props.onValueChange('reseller');
  return {
    ...fixture,
    nameInput: () => fixture.byId(modal ? 'reseller-brand-name' : 'customer-brand-name'),
    slugInput: () => fixture.byId(modal ? 'reseller-brand-slug' : 'customer-brand-slug'),
    saveButton: () => fixture.find(node => node.type === 'Button' && node.props.type === 'submit'),
  };
}

test('admin brand slug generation and validation follow the URL and length rules', async () => {
  const { helper } = await loadComponent('components/admin/CustomerAccountForm.js', { customer });
  assert.equal(helper.createBrandSlug('  Toko Bunga  '), 'toko-bunga');
  assert.equal(helper.createBrandSlug('Bungá & Kebun!'), 'bunga-kebun');
  assert.equal(helper.createBrandSlug('a'.repeat(62) + ' b'), 'a'.repeat(62));
  for (const brand of [
    { brandName: 'a'.repeat(101), brandSlug: 'valid' },
    { brandName: 123, brandSlug: 'valid' },
    ...['', 'ab', '-brand', 'brand-', 'brand--name', 'bad/slug', 'a'.repeat(64)].map(brandSlug => ({ brandName: 'Brand', brandSlug })),
  ]) assert.notEqual(helper.validateAdminResellerBrand(brand), '');
  for (const brandName of ['', '   ', null, undefined]) {
    assert.equal(helper.validateAdminResellerBrand({ brandName, brandSlug: 'valid' }), '');
  }
  assert.equal(helper.validateAdminResellerBrand({ brandName: 'Toko Bunga', brandSlug: 'toko-bunga' }), '');
});

test('admin promotion requires a slug, auto-generates it until manual editing, and saves before closing', async () => {
  let finish;
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, () => new Promise(resolve => { finish = resolve; }));
  fixture.openRoleDialog(customer);
  assert.equal(fixture.requests.length, 0);
  assert.equal(fixture.find(node => node.type === 'AlertDialog').props.open, true);
  assert.equal(fixture.find(node => node.type === 'Button' && node.props.type === 'submit').props.disabled, true);
  assert.equal(Boolean(fixture.byId('reseller-brand-name').props.required), false);
  assert.equal(fixture.byId('reseller-brand-slug').props.required, true);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.requests.length, 0);
  fixture.byId('reseller-brand-name').props.onChange(change('Toko Bunga'));
  assert.equal(fixture.byId('reseller-brand-slug').props.value, 'toko-bunga');
  fixture.byId('reseller-brand-name').props.onChange(change('Toko Bunga Indah'));
  assert.equal(fixture.byId('reseller-brand-slug').props.value, 'toko-bunga-indah');
  fixture.byId('reseller-brand-slug').props.onChange(change('Bungaku'));
  fixture.byId('reseller-brand-name').props.onChange(change('  Bunga Cantik  '));
  assert.equal(fixture.byId('reseller-brand-slug').props.value, 'bungaku');
  const pending = fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.find(node => node.type === 'Button' && node.props.type === 'submit').props.disabled, true);
  assert.equal(fixture.find(node => node.type === 'AlertDialog').props.open, true);
  assert.equal(JSON.stringify(fixture.requests[0].slice(0, 3)), JSON.stringify(['put', 'https://api.example.test/customer/7/role', { role: 'reseller', brandName: 'Bunga Cantik', brandSlug: 'bungaku' }]));
  finish({ data: { message: 'Customer berhasil dijadikan reseller.' } });
  await pending;
  assert.equal(fixture.find(node => node.type === 'AlertDialog').props.open, false);
  assert.equal(fixture.requests[1][0], 'get');
  assert.equal(fixture.notifications[0].title, 'Customer berhasil dijadikan reseller.');
});

test('conflicting slug errors preserve the promotion modal and entered data for correction', async () => {
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, async () => {
    throw { response: { status: 409, data: { message: 'Slug brand sudah digunakan akun lain.' } } };
  });
  fixture.openRoleDialog(customer);
  fixture.byId('reseller-brand-name').props.onChange(change('Toko Bunga'));
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.find(node => node.type === 'AlertDialog').props.open, true);
  assert.equal(fixture.byId('reseller-brand-name').props.value, 'Toko Bunga');
  assert.equal(fixture.byId('reseller-brand-slug').props.value, 'toko-bunga');
  assert.equal(fixture.find(node => node.props?.role === 'alert').props.children, 'Slug brand sudah digunakan akun lain.');
  assert.equal(fixture.requests.length, 1);
  assert.equal(fixture.notifications.length, 0);
  fixture.byId('reseller-brand-slug').props.onChange(change('bungaku'));
  assert.equal(fixture.find(node => node.props?.role === 'alert'), undefined);
});

test('demoting a reseller preserves the role confirmation without brand fields', async () => {
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js');
  fixture.openRoleDialog({ ...customer, role: 'reseller', brandName: 'Brand', brandSlug: 'brand' });
  assert.equal(fixture.byId('reseller-brand-name'), undefined);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(JSON.stringify(fixture.requests[0][2]), JSON.stringify({ role: 'user' }));
});

test('admin account editing also requires a valid slug when granting reseller access', async () => {
  let saved;
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer, onSaved: value => { saved = value; } });
  fixture.find(node => node.type === 'Select').props.onValueChange('reseller');
  assert.equal(fixture.find(node => node.type === 'Button' && node.props.type === 'submit').props.disabled, true);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.requests.length, 0);
  fixture.byId('customer-brand-name').props.onChange(change('Toko Bunga'));
  assert.equal(fixture.byId('customer-brand-slug').props.value, 'toko-bunga');
  fixture.byId('customer-brand-slug').props.onChange(change('bungaku'));
  fixture.byId('customer-brand-name').props.onChange(change('Toko Baru'));
  assert.equal(fixture.byId('customer-brand-slug').props.value, 'bungaku');
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(saved.role, 'reseller');
  assert.equal(saved.brandName, 'Toko Baru');
  assert.equal(saved.brandSlug, 'bungaku');
});

test('admin changing an existing reseller name preserves its assigned slug', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', {
    customer: { ...customer, role: 'reseller', brandName: 'Toko Bunga', brandSlug: 'bungaku' }, onSaved() {},
  });
  fixture.byId('customer-brand-name').props.onChange(change('Toko Baru'));
  assert.equal(fixture.byId('customer-brand-slug').props.value, 'bungaku');
});

test('restoring reseller access preserves its saved slug and opening another customer resets auto-generation', async () => {
  const returning = { ...customer, brandName: 'Toko Bunga', brandSlug: 'bungaku' };
  const modal = await loadComponent('app/(admin)/admin/customer/page.js');
  modal.openRoleDialog(returning);
  modal.byId('reseller-brand-name').props.onChange(change('Toko Baru'));
  assert.equal(modal.byId('reseller-brand-slug').props.value, 'bungaku');
  modal.openRoleDialog({ ...customer, id: 8 });
  modal.byId('reseller-brand-name').props.onChange(change('Brand Lain'));
  assert.equal(modal.byId('reseller-brand-slug').props.value, 'brand-lain');

  const account = await loadComponent('components/admin/CustomerAccountForm.js', { customer: returning, onSaved() {} });
  account.find(node => node.type === 'Select').props.onValueChange('reseller');
  account.byId('customer-brand-name').props.onChange(change('Toko Baru'));
  assert.equal(account.byId('customer-brand-slug').props.value, 'bungaku');
});

test('manual slug sanitization removes spaces, punctuation, Unicode, and URL characters', async () => {
  const { helper } = await loadPromotionEditor('modal');
  for (const [input, expected] of [
    ['Toko Bunga', 'tokobunga'],
    ['BUNGA_CANTIK!', 'bungacantik'],
    ['Brandé東京😀', 'brand'],
    ['https://Brand.test/path?x=1#logo', 'httpsbrandtestpathx1logo'],
    ['---Brand---Cantik', 'brand-cantik'],
    ['Brand-', 'brand-'],
    ['A'.repeat(70), 'a'.repeat(63)],
  ]) assert.equal(helper.sanitizeBrandSlugInput(input), expected, input);
});

for (const screen of ['modal', 'account']) {
  test(`${screen}: admin can grant reseller access with an empty brand name and a manual slug`, async () => {
    const editor = await loadPromotionEditor(screen, { ...customer, contact: null, brandLogo: null });
    assert.equal(Boolean(editor.nameInput().props.required), false);
    editor.slugInput().props.onChange(change('brand-link'));
    assert.equal(editor.saveButton().props.disabled, false);
    await editor.find(node => node.type === 'form').props.onSubmit(submit);
    const payload = editor.requests.find(([method]) => method === 'put')[2];
    assert.equal(payload.role, 'reseller');
    assert.equal(payload.brandName, '');
    assert.equal(payload.brandSlug, 'brand-link');
    if (screen === 'account') {
      assert.equal(payload.contact, '');
      assert.equal('brandLogo' in payload, false);
    }
  });

  test(`${screen}: the subdomain icon opens the current valid brand address in a new tab`, async () => {
    const editor = await loadPromotionEditor(screen);
    const link = () => editor.find(node => node.type === 'a' && node.props['aria-label'] === 'Buka subdomain brand');
    assert.equal(link(), undefined);
    editor.nameInput().props.onChange(change('Toko Bunga'));
    assert.equal(link().props.href, 'https://toko-bunga.sewaundangan.com');
    assert.equal(link().props.target, '_blank');
    assert.equal(link().props.rel, 'noopener noreferrer');
    assert.ok(nodes(link()).some(node => node.type === 'ExternalLink'));
    editor.slugInput().props.onChange(change('bungaku'));
    assert.equal(link().props.href, 'https://bungaku.sewaundangan.com');
    editor.slugInput().props.onChange(change('bunga-'));
    assert.equal(link(), undefined);
    editor.slugInput().props.onChange(change('ab'));
    assert.equal(link(), undefined);
  });

  test(`${screen}: typing forbidden characters leaves the automatic slug following the brand name`, async () => {
    const editor = await loadPromotionEditor(screen);
    editor.nameInput().props.onChange(change('Toko Bunga'));
    for (const suffix of [' ', '_!', '/?=#', 'é東京😀']) {
      const automatic = editor.slugInput().props.value;
      editor.slugInput().props.onChange(change(`${automatic}${suffix}`));
      assert.equal(editor.slugInput().props.value, automatic);
      editor.nameInput().props.onChange(change(`${editor.nameInput().props.value} Baru`));
      assert.equal(editor.slugInput().props.value, editor.helper.createBrandSlug(editor.nameInput().props.value));
    }
    assert.equal(editor.requests.length, 0);
  });

  test(`${screen}: pasted custom slug is sanitized immediately and retained after a brand name change`, async () => {
    const editor = await loadPromotionEditor(screen);
    editor.nameInput().props.onChange(change('Toko Bunga'));
    editor.slugInput().props.onChange(change('---BUNGA _Cantik/?é🙂--KU'));
    assert.equal(editor.slugInput().props.value, 'bungacantik-ku');
    editor.nameInput().props.onChange(change('Brand Baru'));
    assert.equal(editor.slugInput().props.value, 'bungacantik-ku');
    assert.equal(editor.saveButton().props.disabled, false);
    await editor.find(node => node.type === 'form').props.onSubmit(submit);
    assert.equal(editor.requests[0][2].brandSlug, 'bungacantik-ku');
    assert.equal(editor.requests[0][2].brandName, 'Brand Baru');
  });

  test(`${screen}: trailing hyphen remains editable but cannot be submitted before a final word`, async () => {
    const editor = await loadPromotionEditor(screen);
    editor.nameInput().props.onChange(change('Toko Bunga'));
    editor.slugInput().props.onChange(change('BUNGA-'));
    assert.equal(editor.slugInput().props.value, 'bunga-');
    assert.equal(editor.saveButton().props.disabled, true);
    await editor.find(node => node.type === 'form').props.onSubmit(submit);
    assert.equal(editor.requests.length, 0);
    editor.slugInput().props.onChange(change('bunga--baru'));
    assert.equal(editor.slugInput().props.value, 'bunga-baru');
    assert.equal(editor.saveButton().props.disabled, false);
  });

  test(`${screen}: clearing a custom slug regenerates it and resumes automatic name tracking`, async () => {
    const editor = await loadPromotionEditor(screen);
    editor.nameInput().props.onChange(change('Toko Bunga'));
    editor.slugInput().props.onChange(change('bungaku'));
    editor.nameInput().props.onChange(change('Toko Baru'));
    assert.equal(editor.slugInput().props.value, 'bungaku');
    editor.slugInput().props.onChange(change(''));
    assert.equal(editor.slugInput().props.value, 'toko-baru');
    editor.nameInput().props.onChange(change('Toko Indah'));
    assert.equal(editor.slugInput().props.value, 'toko-indah');
    assert.equal(editor.saveButton().props.disabled, false);
  });

  test(`${screen}: prefilling a generated slug keeps tracking the brand name while a saved custom slug stays fixed`, async () => {
    for (const [storedSlug, expected] of [['toko-bunga', 'toko-baru'], ['bungaku', 'bungaku']]) {
      const editor = await loadPromotionEditor(screen, { ...customer, brandName: 'Toko Bunga', brandSlug: storedSlug });
      assert.equal(editor.slugInput().props.value, storedSlug);
      editor.nameInput().props.onChange(change('Toko Baru'));
      assert.equal(editor.slugInput().props.value, expected);
    }
  });
}

const resellerCustomer = {
  ...customer, role: 'reseller', brandName: 'Toko Bunga', brandSlug: 'bungaku', brandLogo: '/uploads/old-logo.png',
};

function logoInput(fixture) {
  return fixture.byId('customer-brand-logo');
}

function logoImage(fixture) {
  return fixture.find(node => node.type === 'Image' && node.props.alt === 'Logo brand');
}

function selectLogo(fixture, file) {
  const target = { files: file ? [file] : [], value: file ? `C:\\fakepath\\${file.name}` : '' };
  logoInput(fixture).props.onChange({ target });
  return target;
}

function removeLogo(fixture) {
  fixture.find(node => node.type === 'Button' && node.props.children === 'Hapus Logo').props.onClick();
}

test('admin persists deleting a saved logo and clearing reseller contact and brand name together', async () => {
  let saved;
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', {
    customer: { ...resellerCustomer, contact: '081234567890' }, onSaved: value => { saved = value; },
  }, async (_url, payload) => ({ data: {
    customer: { ...resellerCustomer, ...payload, contact: null, brandName: null, brandLogo: null },
  } }));
  fixture.byId('customer-contact').props.onChange(change('   '));
  fixture.byId('customer-brand-name').props.onChange(change(''));
  assert.equal(fixture.byId('customer-brand-slug').props.value, 'bungaku');
  removeLogo(fixture);
  await fixture.flushEffects();
  assert.equal(logoImage(fixture), undefined);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  const payload = fixture.requests[0][2];
  assert.equal(payload.removeBrandLogo, true);
  assert.equal(payload.brandName, '');
  assert.equal(payload.contact, '');
  assert.equal(payload.brandSlug, 'bungaku');
  assert.equal('brandLogo' in payload, false);
  assert.equal(saved.brandLogo, null);
  assert.equal(saved.brandName, null);
  assert.equal(saved.contact, null);
  await fixture.flushEffects();
  assert.equal(logoImage(fixture), undefined);
  assert.equal(fixture.byId('customer-brand-name').props.value, '');
  assert.equal(fixture.byId('customer-contact').props.value, '');
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal('removeBrandLogo' in fixture.requests[1][2], false);
});

test('canceling logo deletion restores the saved logo without requesting its removal', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} });
  removeLogo(fixture);
  assert.equal(logoImage(fixture), undefined);
  fixture.find(node => node.type === 'Button' && node.props.children === 'Batal Perubahan').props.onClick();
  await fixture.flushEffects();
  assert.equal(logoImage(fixture).props.src, 'https://api.example.test/uploads/old-logo.png');
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal('removeBrandLogo' in fixture.requests[0][2], false);
});

test('a failed logo deletion keeps the removal draft available for retry', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} }, async () => {
    throw { response: { data: { message: 'Gagal menyimpan data customer.' } } };
  });
  removeLogo(fixture);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  await fixture.flushEffects();
  assert.equal(logoImage(fixture), undefined);
  assert.equal(fixture.find(node => node.props?.role === 'alert').props.children, 'Gagal menyimpan data customer.');
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.requests[1][2].removeBrandLogo, true);
});

test('selecting a replacement after deletion uploads the new logo without the delete marker', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} });
  removeLogo(fixture);
  const file = { name: 'replacement.webp', type: 'image/webp', size: 1024 };
  selectLogo(fixture, file);
  await fixture.flushEffects();
  assert.equal(logoImage(fixture).props.src, 'blob:brand-logo-1');
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  const payload = Object.fromEntries(fixture.requests[0][2].entries());
  assert.equal(payload.brandLogo, file);
  assert.equal('removeBrandLogo' in payload, false);
});

test('demoting a reseller discards its pending logo deletion and preserves brand data', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} });
  removeLogo(fixture);
  fixture.find(node => node.type === 'Select').props.onValueChange('user');
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.requests[0][2].role, 'user');
  assert.equal('removeBrandLogo' in fixture.requests[0][2], false);
});

test('admin can preview and upload a brand logo with the edited account fields', async () => {
  let saved;
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', {
    customer: resellerCustomer, onSaved: value => { saved = value; },
  }, async (_url, payload) => ({ data: {
    message: 'Berhasil', customer: { ...resellerCustomer, ...Object.fromEntries(payload.entries()), brandLogo: '/uploads/new-logo.webp' },
  } }));
  await fixture.flushEffects();
  assert.equal(logoInput(fixture).props.name, 'brandLogo');
  assert.equal(logoInput(fixture).props.type, 'file');
  assert.equal(logoInput(fixture).props.accept, 'image/jpeg,image/png,image/webp');
  assert.equal(logoImage(fixture).props.src, 'https://api.example.test/uploads/old-logo.png');
  const file = { name: 'new-logo.webp', type: 'image/webp', size: 1024 };
  const inputElement = { value: 'C:\\fakepath\\new-logo.webp' };
  logoInput(fixture).props.ref.current = inputElement;
  selectLogo(fixture, file);
  fixture.byId('customer-name').props.onChange(change('  Customer Baru  '));
  fixture.byId('customer-email').props.onChange(change('  CUSTOMER@EXAMPLE.COM  '));
  fixture.byId('customer-contact').props.onChange(change('  081234567890  '));
  fixture.byId('customer-brand-name').props.onChange(change('  Toko Baru  '));
  await fixture.flushEffects();
  assert.equal(fixture.requests.length, 0);
  assert.equal(logoImage(fixture).props.src, 'blob:brand-logo-1');
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.requests.length, 1);
  const [method, url, body, options] = fixture.requests[0];
  assert.equal(method, 'put');
  assert.equal(url, 'https://api.example.test/customer/7');
  assert.deepEqual(Object.fromEntries(body.entries()), {
    name: 'Customer Baru', email: 'customer@example.com', contact: '081234567890', role: 'reseller',
    brandName: 'Toko Baru', brandSlug: 'bungaku', brandLogo: file,
  });
  assert.equal(options.withCredentials, true);
  assert.equal(saved.brandLogo, '/uploads/new-logo.webp');
  assert.equal(inputElement.value, '');
  await fixture.flushEffects();
  assert.equal(logoImage(fixture).props.src, 'https://api.example.test/uploads/new-logo.webp');
  assert.deepEqual(fixture.objectUrls.revoked, ['blob:brand-logo-1']);
});

test('admin rejects unsupported and oversized brand logos before a file can be uploaded', async () => {
  for (const file of [
    { name: 'logo.svg', type: 'image/svg+xml', size: 1024 },
    { name: 'logo.png', type: 'image/png', size: 5 * 1024 * 1024 + 1 },
  ]) {
    const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} });
    const input = selectLogo(fixture, file);
    await fixture.flushEffects();
    assert.equal(input.value, '');
    assert.equal(fixture.requests.length, 0);
    assert.equal(fixture.notifications[0].variant, 'destructive');
    assert.equal(fixture.notifications[0].title, 'Logo tidak valid');
    assert.equal(logoImage(fixture).props.src, 'https://api.example.test/uploads/old-logo.png');
    await fixture.find(node => node.type === 'form').props.onSubmit(submit);
    assert.equal(typeof fixture.requests[0][2].entries, 'undefined');
    assert.equal('brandLogo' in fixture.requests[0][2], false);
  }
});

test('admin accepts JPG, PNG, and WebP logos up to the 5 MB limit', async () => {
  for (const [type, extension] of [['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]) {
    const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} });
    const file = { name: `logo.${extension}`, type, size: 5 * 1024 * 1024 };
    selectLogo(fixture, file);
    await fixture.find(node => node.type === 'form').props.onSubmit(submit);
    assert.equal(Object.fromEntries(fixture.requests[0][2].entries()).brandLogo, file);
    assert.equal(fixture.notifications.some(notice => notice.variant === 'destructive'), false);
  }
});

test('canceling admin changes restores the saved logo and clears its pending upload', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} });
  const file = { name: 'new-logo.png', type: 'image/png', size: 1024 };
  const inputElement = { value: 'C:\\fakepath\\new-logo.png' };
  logoInput(fixture).props.ref.current = inputElement;
  selectLogo(fixture, file);
  fixture.byId('customer-brand-name').props.onChange(change('Brand Belum Disimpan'));
  await fixture.flushEffects();
  assert.equal(logoImage(fixture).props.src, 'blob:brand-logo-1');
  fixture.find(node => node.type === 'Button' && node.props.children === 'Batal Perubahan').props.onClick();
  await fixture.flushEffects();
  assert.equal(inputElement.value, '');
  assert.equal(fixture.byId('customer-brand-name').props.value, 'Toko Bunga');
  assert.equal(logoImage(fixture).props.src, 'https://api.example.test/uploads/old-logo.png');
  assert.deepEqual(fixture.objectUrls.revoked, ['blob:brand-logo-1']);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(typeof fixture.requests[0][2].entries, 'undefined');
});

test('a failed admin save preserves the draft logo and account changes for retry', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} }, async () => {
    throw { response: { data: { message: 'Gagal mengunggah logo brand.' } } };
  });
  const file = { name: 'new-logo.png', type: 'image/png', size: 1024 };
  const inputElement = { value: 'C:\\fakepath\\new-logo.png' };
  logoInput(fixture).props.ref.current = inputElement;
  selectLogo(fixture, file);
  fixture.byId('customer-brand-name').props.onChange(change('Brand Baru'));
  await fixture.flushEffects();
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  await fixture.flushEffects();
  assert.equal(fixture.find(node => node.props?.role === 'alert').props.children, 'Gagal mengunggah logo brand.');
  assert.equal(fixture.byId('customer-brand-name').props.value, 'Brand Baru');
  assert.equal(logoImage(fixture).props.src, 'blob:brand-logo-1');
  assert.equal(inputElement.value, 'C:\\fakepath\\new-logo.png');
  assert.deepEqual(fixture.objectUrls.revoked, []);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(Object.fromEntries(fixture.requests[1][2].entries()).brandLogo, file);
});

test('switching a reseller back to user discards its unsaved logo selection', async () => {
  const fixture = await loadComponent('components/admin/CustomerAccountForm.js', { customer: resellerCustomer, onSaved() {} });
  const file = { name: 'new-logo.png', type: 'image/png', size: 1024 };
  const inputElement = { value: 'C:\\fakepath\\new-logo.png' };
  logoInput(fixture).props.ref.current = inputElement;
  selectLogo(fixture, file);
  await fixture.flushEffects();
  fixture.find(node => node.type === 'Select').props.onValueChange('user');
  await fixture.flushEffects();
  assert.equal(logoInput(fixture), undefined);
  assert.equal(inputElement.value, '');
  assert.deepEqual(fixture.objectUrls.revoked, ['blob:brand-logo-1']);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  assert.equal(fixture.requests[0][2].role, 'user');
  assert.equal('brandLogo' in fixture.requests[0][2], false);
});

function roleFilter(fixture) {
  return fixture.find(node => node.type === 'Select' && nodes(node.props.children).some(child => child.props?.id === 'customer-role-filter'));
}

function table(fixture) {
  return fixture.find(node => node.type === 'DataTable');
}

function lastCustomerQuery(fixture) {
  return fixture.requests.filter(([method]) => method === 'get').at(-1)[2].params;
}

function assertCustomerQuery(fixture, expected) {
  assert.deepEqual(JSON.parse(JSON.stringify(lastCustomerQuery(fixture))), expected);
}

test('customer role filtering applies to server pagination, page size, and search changes', async () => {
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, undefined, {
    getResponse: async () => ({ data: { data: [customer], total: 80 } }),
  });
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 1, limit: 10, search: '', role: 'all' });

  table(fixture).props.onChangePage(3);
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 3, limit: 10, search: '', role: 'all' });

  roleFilter(fixture).props.onValueChange('reseller');
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 1, limit: 10, search: '', role: 'reseller' });
  assert.equal(table(fixture).props.paginationDefaultPage, 1);

  table(fixture).props.onChangePage(4);
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 4, limit: 10, search: '', role: 'reseller' });

  table(fixture).props.onChangeRowsPerPage(25, 2);
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 2, limit: 25, search: '', role: 'reseller' });

  fixture.find(node => node.type === 'DebounceInput').props.onChange(change('Bunga'));
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 1, limit: 25, search: 'Bunga', role: 'reseller' });

  roleFilter(fixture).props.onValueChange('user');
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 1, limit: 25, search: 'Bunga', role: 'user' });
  roleFilter(fixture).props.onValueChange('all');
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 1, limit: 25, search: 'Bunga', role: 'all' });
});

test('retrying a customer request keeps the selected role, search, and page', async () => {
  let failNext = false;
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, undefined, {
    getResponse: async () => {
      if (failNext) {
        failNext = false;
        throw new Error('Connection interrupted');
      }
      return { data: { data: [customer], total: 30 } };
    },
  });
  await fixture.flushEffects();
  roleFilter(fixture).props.onValueChange('reseller');
  fixture.find(node => node.type === 'DebounceInput').props.onChange(change('Bunga'));
  await fixture.flushEffects();
  failNext = true;
  table(fixture).props.onChangePage(2);
  await fixture.flushEffects();
  assert.ok(fixture.find(node => node.props?.role === 'alert'));
  assertCustomerQuery(fixture, { page: 2, limit: 10, search: 'Bunga', role: 'reseller' });

  const retry = fixture.find(node => node.type === 'Button' && node.props.children === 'Coba Lagi');
  await retry.props.onClick();
  await fixture.flushEffects();
  assertCustomerQuery(fixture, { page: 2, limit: 10, search: 'Bunga', role: 'reseller' });
  assert.equal(fixture.find(node => node.props?.role === 'alert'), undefined);
  assert.equal(table(fixture).props.paginationDefaultPage, 2);
});

test('changing a reseller role refreshes the current filtered page without clearing the search', async () => {
  const reseller = { ...customer, role: 'reseller', brandName: 'Toko Bunga', brandSlug: 'toko-bunga' };
  let demoted = false;
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, async () => {
    demoted = true;
    return { data: { message: 'Role diperbarui.' } };
  }, {
    getResponse: async () => ({ data: { data: demoted ? [{ ...reseller, id: 8 }] : [reseller], total: demoted ? 11 : 12 } }),
  });
  await fixture.flushEffects();
  roleFilter(fixture).props.onValueChange('reseller');
  fixture.find(node => node.type === 'DebounceInput').props.onChange(change('Bunga'));
  await fixture.flushEffects();
  table(fixture).props.onChangePage(2);
  await fixture.flushEffects();
  fixture.openRoleDialog(reseller);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  await fixture.flushEffects();

  assertCustomerQuery(fixture, { page: 2, limit: 10, search: 'Bunga', role: 'reseller' });
  assert.equal(roleFilter(fixture).props.value, 'reseller');
  assert.equal(table(fixture).props.paginationDefaultPage, 2);
  assert.equal(table(fixture).props.data[0].id, 8);
  assert.equal(fixture.find(node => node.type === 'AlertDialog').props.open, false);
});

test('removing the last reseller from a filtered page returns to the last valid page', async () => {
  const reseller = { ...customer, role: 'reseller', brandName: 'Toko Bunga', brandSlug: 'toko-bunga' };
  let demoted = false;
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, async () => {
    demoted = true;
    return { data: { message: 'Role diperbarui.' } };
  }, {
    getResponse: async (_url, { params }) => ({
      data: { data: demoted && params.page > 1 ? [] : [reseller], total: demoted ? 10 : 11 },
    }),
  });
  await fixture.flushEffects();
  roleFilter(fixture).props.onValueChange('reseller');
  await fixture.flushEffects();
  table(fixture).props.onChangePage(2);
  await fixture.flushEffects();
  fixture.openRoleDialog(reseller);
  await fixture.find(node => node.type === 'form').props.onSubmit(submit);
  await fixture.flushEffects();

  assertCustomerQuery(fixture, { page: 1, limit: 10, search: '', role: 'reseller' });
  assert.equal(roleFilter(fixture).props.value, 'reseller');
  assert.equal(table(fixture).props.paginationDefaultPage, 1);
  assert.equal(table(fixture).props.data.length, 1);
  assert.equal(table(fixture).props.paginationTotalRows, 10);
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
}

test('a delayed retry response cannot replace the results of a newer role filter', async () => {
  const stale = deferred();
  const latest = deferred();
  const reseller = { ...customer, id: 8, role: 'reseller' };
  let calls = 0;
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, undefined, {
    getResponse: async () => {
      calls++;
      if (calls === 1) throw new Error('Initial request failed');
      return calls === 2 ? stale.promise : latest.promise;
    },
  });
  await fixture.flushEffects();
  const retry = fixture.find(node => node.type === 'Button' && node.props.children === 'Coba Lagi').props.onClick();
  roleFilter(fixture).props.onValueChange('reseller');
  await fixture.flushEffects({ waitForRequests: false });
  assert.equal(calls, 3);
  assert.equal(table(fixture).props.progressPending, true);

  latest.resolve({ data: { data: [reseller], total: 23 } });
  await fixture.flushEffects({ waitForRequests: false });
  assert.equal(table(fixture).props.data[0].id, 8);
  assert.equal(table(fixture).props.paginationTotalRows, 23);
  assert.equal(table(fixture).props.progressPending, false);

  stale.resolve({ data: { data: [customer], total: 1 } });
  await retry;
  await fixture.flushEffects();
  assert.equal(roleFilter(fixture).props.value, 'reseller');
  assert.equal(table(fixture).props.data[0].id, 8);
  assert.equal(table(fixture).props.paginationTotalRows, 23);
  assert.equal(table(fixture).props.progressPending, false);
  assert.equal(fixture.find(node => node.props?.role === 'alert'), undefined);
});

test('a failed stale retry leaves the newer filter loading without displaying its error', async () => {
  const stale = deferred();
  const latest = deferred();
  const reseller = { ...customer, id: 8, role: 'reseller' };
  let calls = 0;
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, undefined, {
    getResponse: async () => {
      calls++;
      if (calls === 1) throw new Error('Initial request failed');
      return calls === 2 ? stale.promise : latest.promise;
    },
  });
  await fixture.flushEffects();
  const retry = fixture.find(node => node.type === 'Button' && node.props.children === 'Coba Lagi').props.onClick();
  roleFilter(fixture).props.onValueChange('reseller');
  await fixture.flushEffects({ waitForRequests: false });

  stale.reject(new Error('The older request failed'));
  await retry;
  await fixture.flushEffects({ waitForRequests: false });
  assert.equal(table(fixture).props.progressPending, true);
  assert.equal(fixture.find(node => node.props?.role === 'alert'), undefined);

  latest.resolve({ data: { data: [reseller], total: 23 } });
  await fixture.flushEffects();
  assert.equal(table(fixture).props.data[0].id, 8);
  assert.equal(table(fixture).props.paginationTotalRows, 23);
  assert.equal(table(fixture).props.progressPending, false);
  assert.equal(fixture.find(node => node.props?.role === 'alert'), undefined);
});
