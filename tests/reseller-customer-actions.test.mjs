import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

async function loadComponent(path, resource) {
  const source = await readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'component.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const context = vm.createContext({ URLSearchParams });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const helpers = new vm.SourceTextModule(await readFile(new URL('../src/lib/resellerBrand.js', import.meta.url), 'utf8'), { context });
  const uiNames = ['default', 'Button', 'ChevronDown', 'Loader2', 'Plus', 'DebounceInput', 'Card', 'CardContent', 'CardHeader', 'CardTitle', 'Label', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel', 'DropdownMenuTrigger', 'Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle'];
  const module = new vm.SourceTextModule(outputText, { context });
  await module.link(specifier => {
    if (specifier === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx, Fragment: 'Fragment' });
    }
    if (specifier === 'react') return mock({ useState: initial => [initial, () => {}] });
    if (specifier === 'next/link') return mock({ default: 'Link' });
    if (specifier === 'react-data-table-component') return mock({ default: 'DataTable' });
    if (specifier === '@/lib/resellerBrand') return helpers;
    if (specifier.endsWith('/api')) return mock({ useResellerResource: () => resource });
    if (specifier.endsWith('/ResellerShared')) return mock({ formatResellerDate: value => value, InvitationLink: 'InvitationLink', resellerStatuses: [], ResellerError: 'ResellerError', ResellerStatus: 'ResellerStatus' });
    return mock(Object.fromEntries(uiNames.map(name => [name, name])));
  });
  await module.evaluate();
  return module.namespace.default;
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

test('add invitation links carry the saved reseller brand for both existing forms', async () => {
  const render = await loadComponent('components/reseller/AddInvitationButton.js', { data: { brandSlug: 'weddingku', brandName: 'WeddingKu' }, loading: false });
  assert.deepEqual(nodes(render()).filter(node => node.type === 'Link').map(node => node.props.href), [
    '/forms/new?brand=weddingku', '/forms/aqiqah-khitan/new?brand=weddingku',
  ]);
});

test('unconfigured brands lead to settings and brand lookup failures cannot create unattributed orders', async () => {
  for (const brand of [null, {}, { brandSlug: 'valid-slug', brandName: '' }, { brandSlug: 'bad/slug', brandName: 'Brand' }]) {
    const render = await loadComponent('components/reseller/AddInvitationButton.js', { data: brand, loading: false });
    assert.deepEqual(nodes(render()).filter(node => node.type === 'Link').map(node => node.props.href), ['/reseller/brand']);
  }
  let retries = 0;
  const failed = await loadComponent('components/reseller/AddInvitationButton.js', { loading: false, error: 'offline', reload: () => retries++ });
  const tree = nodes(failed());
  assert.equal(tree.some(node => node.type === 'Link'), false);
  tree.find(node => node.type === 'Button').props.onClick();
  assert.equal(retries, 1);
  const pending = await loadComponent('components/reseller/AddInvitationButton.js', { loading: true });
  assert.equal(pending().props.disabled, true);
});

test('reseller list identifies and edits orders by numeric ID instead of their UUID', async () => {
  const row = { id: 42, uuid: 'private-opaque-uuid', type: 'wedding', customerName: 'Customer' };
  const render = await loadComponent('app/(reseller)/reseller/customer/page.js', { data: { data: [row], total: 1 }, loading: false });
  const table = nodes(render()).find(node => node.type === 'DataTable');
  assert.equal(table.props.columns[0].name, 'ID Pesanan');
  assert.equal(table.props.columns[0].selector(row), 42);
  const actions = nodes(table.props.columns[1].cell(row));
  assert.equal(actions.find(node => node.type === 'Link').props.href, '/reseller/customer/wedding/42/edit');
  assert.equal(JSON.stringify(actions).includes(row.uuid), false);
  assert.equal(table.props.paginationServer, true);
});

test('reseller detail shows the numeric order ID and edits the matching invitation type', async () => {
  const detail = { id: 42, uuid: 'private-opaque-uuid', type: 'aqiqah-khitan', title: 'Aqiqah' };
  const render = await loadComponent('components/reseller/FormDetailDialog.js', { data: { data: detail }, loading: false });
  const tree = render({ form: detail, onClose: () => {} });
  assert.equal(nodes(tree).find(node => node.type === 'Link').props.href, '/reseller/customer/aqiqah-khitan/42/edit');
  assert.match(JSON.stringify(tree), /ID Pesanan/);
  assert.equal(JSON.stringify(tree).includes(detail.uuid), false);
});
