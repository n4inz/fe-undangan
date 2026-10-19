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

async function loadComponent(path, props = {}, putResponse) {
  const source = await readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'component.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const context = vm.createContext({ process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } }, AbortController });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const helper = new vm.SourceTextModule(await readFile(new URL('../src/lib/adminResellerBrand.js', import.meta.url), 'utf8'), { context });
  const state = [];
  let cursor = 0;
  const requests = [];
  const notifications = [];
  const axios = {
    isCancel: () => false,
    get: async (...args) => { requests.push(['get', ...args]); return { data: { data: [], total: 0 } }; },
    put: async (...args) => {
      requests.push(['put', ...args]);
      return putResponse ? putResponse(...args) : { data: { message: 'Berhasil', customer: { ...customer, ...args[1] } } };
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
      useCallback: callback => callback,
      useEffect: () => {},
    });
    if (specifier === 'axios') return mock({ default: axios });
    if (specifier === 'next/link') return mock({ default: 'Link' });
    if (specifier === 'react-data-table-component') return mock({ default: 'DataTable' });
    if (specifier === 'react-debounce-input') return mock({ DebounceInput: 'DebounceInput' });
    if (specifier === '@/components/ui/use-toast') return mock({ toast: value => notifications.push(value) });
    if (specifier === '@/lib/adminResellerBrand') return helper;
    return mock(Object.fromEntries(uiNames.map(name => [name, name])));
  });
  await component.evaluate();
  const render = () => { cursor = 0; return component.namespace.default(props); };
  const find = predicate => nodes(render()).find(predicate);
  const byId = id => find(node => node.props?.id === id);
  const openRoleDialog = row => {
    const table = find(node => node.type === 'DataTable');
    const actionColumn = table.props.columns.find(column => column.name === 'Aksi');
    nodes(actionColumn.cell(row)).find(node => node.type === 'Button' && node.props.onClick).props.onClick();
  };
  return { render, find, byId, openRoleDialog, requests, notifications, helper: helper.namespace };
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
    { brandName: '', brandSlug: 'valid' },
    { brandName: 'a'.repeat(101), brandSlug: 'valid' },
    ...['', 'ab', '-brand', 'brand-', 'brand--name', 'bad/slug', 'a'.repeat(64)].map(brandSlug => ({ brandName: 'Brand', brandSlug })),
  ]) assert.notEqual(helper.validateAdminResellerBrand(brand), '');
  assert.equal(helper.validateAdminResellerBrand({ brandName: 'Toko Bunga', brandSlug: 'toko-bunga' }), '');
});

test('admin opens a required brand modal, auto-generates slug until manual editing, and saves before closing', async () => {
  let finish;
  const fixture = await loadComponent('app/(admin)/admin/customer/page.js', {}, () => new Promise(resolve => { finish = resolve; }));
  fixture.openRoleDialog(customer);
  assert.equal(fixture.requests.length, 0);
  assert.equal(fixture.find(node => node.type === 'AlertDialog').props.open, true);
  assert.equal(fixture.find(node => node.type === 'Button' && node.props.type === 'submit').props.disabled, true);
  assert.equal(fixture.byId('reseller-brand-name').props.required, true);
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

test('admin account editing also requires brand data when granting reseller access', async () => {
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
