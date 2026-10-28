import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const customer = { id: 7, name: 'Customer', email: 'customer@example.test', isAdmin: 0, role: 'user' };
const unpaid = { id: 41, namaPanggilanPria: 'Raka', namaPanggilanWanita: 'Rini', commentCount: 2, isPaid: 0, paymentAmount: 0 };
const paid = { id: 42, namaPanggilanPria: 'Budi', namaPanggilanWanita: 'Dina', commentCount: 0, isPaid: 1, paymentAmount: 150000 };
const change = value => ({ target: { value } });

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

function textContent(tree) {
  if (tree == null || typeof tree === 'boolean') return '';
  if (Array.isArray(tree)) return tree.map(textContent).join(' ');
  if (typeof tree !== 'object') return String(tree);
  return textContent(tree.props?.children);
}

async function loadCustomerDetail({ isAdmin = 1, getResponse } = {}) {
  const context = vm.createContext({ process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } }, AbortController });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const compile = async path => {
    const source = await readFile(new URL(`../src/${path}`, import.meta.url), 'utf8');
    return new vm.SourceTextModule(ts.transpileModule(source, {
      fileName: 'component.jsx',
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText, { context });
  };
  const page = await compile('app/(admin)/admin/customer/[dataId]/page.js');
  const account = await compile('components/admin/CustomerAccountForm.js');
  const helper = new vm.SourceTextModule(await readFile(new URL('../src/lib/adminResellerBrand.js', import.meta.url), 'utf8'), { context });
  const resellerHelper = new vm.SourceTextModule(await readFile(new URL('../src/lib/resellerBrand.js', import.meta.url), 'utf8'), { context });
  const createFrame = () => ({ state: [], refs: [], callbacks: [], effects: [] });
  const pageFrame = createFrame();
  let accountFrame;
  let accountKey;
  let accountTree;
  let activeFrame;
  let props = { params: { dataId: '7' } };
  const sameDependencies = (previous, next) => previous && next && previous.length === next.length && previous.every((value, index) => Object.is(value, next[index]));
  const requests = [];
  const notifications = [];
  const pendingGets = new Set();
  const react = mock({
    useState: initial => {
      const frame = activeFrame;
      const index = frame.stateCursor++;
      if (!(index in frame.state)) frame.state[index] = typeof initial === 'function' ? initial() : initial;
      return [frame.state[index], value => { frame.state[index] = typeof value === 'function' ? value(frame.state[index]) : value; }];
    },
    useRef: initial => {
      const frame = activeFrame;
      const index = frame.refCursor++;
      if (!(index in frame.refs)) frame.refs[index] = { current: initial };
      return frame.refs[index];
    },
    useCallback: (callback, dependencies) => {
      const frame = activeFrame;
      const index = frame.callbackCursor++;
      if (!sameDependencies(frame.callbacks[index]?.dependencies, dependencies)) frame.callbacks[index] = { callback, dependencies };
      return frame.callbacks[index].callback;
    },
    useEffect: (callback, dependencies) => {
      const frame = activeFrame;
      const index = frame.effectCursor++;
      frame.effects[index] = { ...frame.effects[index], callback, nextDependencies: dependencies };
    },
  });
  const axios = {
    isCancel: () => false,
    get: (...args) => {
      requests.push(['get', ...args]);
      const pending = Promise.resolve().then(() => getResponse
        ? getResponse(...args)
        : { data: { user: customer, form: [unpaid, paid], isAdmin } });
      pendingGets.add(pending);
      pending.then(() => pendingGets.delete(pending), () => pendingGets.delete(pending));
      return pending;
    },
  };
  const uiNames = ['Button', 'Badge', 'Input', 'Label', 'Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue'];
  const modules = new Map([
    ['react', react],
    ['axios', mock({ default: axios })],
    ['@/components/admin/CustomerAccountForm', account],
    ['@/lib/adminResellerBrand', helper],
    ['@/lib/resellerBrand', resellerHelper],
    ['next/image', mock({ default: 'Image' })],
    ['lucide-react', mock({ ExternalLink: 'ExternalLink' })],
    ['next/link', mock({ default: 'Link' })],
    ['react-data-table-component', mock({ default: 'DataTable' })],
    ['react-debounce-input', mock({ DebounceInput: 'DebounceInput' })],
    ['@/components/StatusSelect', mock({ default: 'StatusSelect' })],
    ['@/components/admin/DialogModalPayment', mock({ DialogModalPayment: 'DialogModalPayment' })],
    ['@/components/admin/DialogCancelPayment', mock({ DialogCancelPayment: 'DialogCancelPayment' })],
    ['@/components/ui/use-toast', mock({ toast: value => notifications.push(value) })],
    ['react/jsx-runtime', mock({ jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }), Fragment: 'Fragment' })],
  ]);
  const resolveModule = specifier => {
    if (!modules.has(specifier)) modules.set(specifier, mock(Object.fromEntries(uiNames.map(name => [name, name]))));
    return modules.get(specifier);
  };
  await page.link(resolveModule);
  await page.evaluate();

  const renderInFrame = (frame, component, componentProps) => {
    activeFrame = frame;
    frame.stateCursor = frame.refCursor = frame.callbackCursor = frame.effectCursor = 0;
    return component(componentProps);
  };
  const render = () => {
    const tree = renderInFrame(pageFrame, page.namespace.default, props);
    const accountNode = nodes(tree).find(node => node.type === account.namespace.default);
    if (accountNode) {
      if (!accountFrame || accountKey !== accountNode.key) {
        accountFrame = createFrame();
        accountKey = accountNode.key;
      }
      accountTree = renderInFrame(accountFrame, account.namespace.default, accountNode.props);
    } else {
      accountFrame = accountTree = undefined;
    }
    return tree;
  };
  const find = predicate => {
    const tree = render();
    return [...nodes(tree), ...nodes(accountTree)].find(predicate);
  };
  const flushEffects = async ({ waitForRequests = true } = {}) => {
    await new Promise(resolve => setImmediate(resolve));
    for (let iteration = 0; iteration < 20; iteration++) {
      const tree = render();
      const pendingEffects = [pageFrame, accountFrame].filter(Boolean).flatMap(frame => frame.effects.filter(effect => !sameDependencies(effect.dependencies, effect.nextDependencies)));
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
    assert.fail('Customer detail effects did not settle');
  };
  return {
    find, flushEffects, requests, notifications,
    table: () => find(node => node.type === 'DataTable'),
    account: () => find(node => node.type === account.namespace.default),
    navigate: dataId => { props = { params: { dataId } }; },
  };
}

function paymentButton(fixture, row) {
  return nodes(fixture.table().props.columns.find(column => column.name === 'Aksi').cell(row))
    .find(node => node.type === 'Button' && typeof node.props.onClick === 'function');
}

function paymentCell(fixture, row) {
  return fixture.table().props.columns.find(column => column.name === 'Pembayaran').cell(row);
}

test('customer invitations show payment status and admins open the matching payment dialog for each order', async () => {
  const fixture = await loadCustomerDetail();
  await fixture.flushEffects();
  assert.match(textContent(paymentCell(fixture, unpaid)), /Belum Lunas/);
  assert.match(textContent(paymentCell(fixture, paid)), /Lunas/);
  assert.match(textContent(paymentCell(fixture, paid)), /Rp\s*150\.000/);
  const actions = fixture.table().props.columns.find(column => column.name === 'Aksi');
  assert.equal(nodes(actions.cell(unpaid)).find(node => node.type === 'Link').props.href, '/admin/detail/41');
  assert.equal(textContent(paymentButton(fixture, unpaid)), 'Lunas');
  assert.equal(textContent(paymentButton(fixture, paid)), 'Batalkan Lunas');

  paymentButton(fixture, unpaid).props.onClick();
  let payment = fixture.find(node => node.type === 'DialogModalPayment');
  assert.equal(payment.props.open, true);
  assert.equal(payment.props.row, unpaid);
  assert.equal(fixture.find(node => node.type === 'DialogCancelPayment').props.open, false);
  payment.props.onOpenChange(false);

  paymentButton(fixture, paid).props.onClick();
  const cancellation = fixture.find(node => node.type === 'DialogCancelPayment');
  assert.equal(cancellation.props.open, true);
  assert.equal(cancellation.props.row, paid);
  assert.equal(fixture.find(node => node.type === 'DialogModalPayment').props.open, false);
  cancellation.props.onOpenChange(false);
  assert.equal(fixture.find(node => node.type === 'DialogCancelPayment').props.open, false);
  assert.equal(fixture.requests.length, 1, 'Selecting or closing a dialog does not mutate an invitation');
});

test('staff can view payment status without admin payment controls or payment amount', async () => {
  const fixture = await loadCustomerDetail({ isAdmin: 0 });
  await fixture.flushEffects();
  for (const row of [unpaid, paid]) assert.equal(paymentButton(fixture, row), undefined);
  assert.match(textContent(paymentCell(fixture, paid)), /Lunas/);
  assert.doesNotMatch(textContent(paymentCell(fixture, paid)), /150\.000/);
  assert.equal(fixture.find(node => node.type === 'DialogModalPayment'), undefined);
  assert.equal(fixture.find(node => node.type === 'DialogCancelPayment'), undefined);
});

for (const cancel of [false, true]) {
  test(`${cancel ? 'cancelling' : 'marking'} a customer invitation as paid refreshes payment state while preserving search and unsaved account edits`, async () => {
    const initial = { ...unpaid, isPaid: cancel ? 1 : 0, paymentAmount: cancel ? 150000 : 0 };
    const updated = { ...initial, isPaid: cancel ? 0 : 1, paymentAmount: cancel ? 0 : 175000 };
    let refreshed = false;
    const fixture = await loadCustomerDetail({
      getResponse: async () => ({ data: {
        user: refreshed ? { ...customer, name: 'Server response after payment' } : customer,
        form: [refreshed ? updated : initial, paid],
        isAdmin: 1,
      } }),
    });
    await fixture.flushEffects();
    const originalAccount = fixture.account();
    fixture.find(node => node.props?.id === 'customer-name').props.onChange(change('Unsaved customer name'));
    fixture.find(node => node.type === 'DebounceInput').props.onChange(change('Raka'));
    assert.equal(fixture.table().props.data.length, 1);
    const resetPagination = fixture.table().props.paginationResetDefaultPage;
    paymentButton(fixture, initial).props.onClick();
    const dialog = fixture.find(node => node.type === (cancel ? 'DialogCancelPayment' : 'DialogModalPayment'));
    refreshed = true;
    dialog.props.onOpenChange(false);
    await dialog.props.onDataUpdate();
    await fixture.flushEffects();

    assert.equal(fixture.requests.length, 2);
    assert.equal(fixture.requests[1][1], 'https://api.example.test/customer/7');
    assert.equal(fixture.requests[1][2].withCredentials, true);
    assert.equal(fixture.find(node => node.type === 'DebounceInput').props.value, 'Raka');
    assert.equal(fixture.table().props.paginationResetDefaultPage, resetPagination);
    assert.equal(fixture.table().props.data.length, 1);
    assert.equal(fixture.table().props.data[0], updated);
    assert.equal(fixture.account().key, originalAccount.key);
    assert.equal(fixture.account().props.customer, originalAccount.props.customer);
    assert.equal(fixture.find(node => node.props?.id === 'customer-name').props.value, 'Unsaved customer name');
    assert.equal(textContent(paymentButton(fixture, updated)), cancel ? 'Lunas' : 'Batalkan Lunas');
    assert.match(textContent(paymentCell(fixture, updated)), cancel ? /Belum Lunas/ : /Rp\s*175\.000/);
    assert.equal(fixture.find(node => node.type === (cancel ? 'DialogCancelPayment' : 'DialogModalPayment')).props.open, false);
    assert.equal(fixture.notifications.at(-1).title, cancel ? 'Status lunas berhasil dibatalkan.' : 'Undangan berhasil ditandai lunas.');
  });
}

test('navigating to another customer clears the payment selection and ignores the old dialog callback', async () => {
  const fixture = await loadCustomerDetail({
    getResponse: async url => ({ data: {
      user: url.endsWith('/8') ? { ...customer, id: 8, name: 'Other customer' } : customer,
      form: url.endsWith('/8') ? [paid] : [unpaid],
      isAdmin: 1,
    } }),
  });
  await fixture.flushEffects();
  paymentButton(fixture, unpaid).props.onClick();
  const oldDialog = fixture.find(node => node.type === 'DialogModalPayment');
  assert.equal(oldDialog.props.open, true);
  fixture.find(node => node.type === 'DebounceInput').props.onChange(change('Raka'));
  fixture.navigate('8');
  await fixture.flushEffects();
  assert.equal(fixture.account().props.customer.id, 8);
  assert.equal(fixture.find(node => node.type === 'DebounceInput').props.value, '');
  assert.equal(fixture.find(node => node.type === 'DialogModalPayment'), undefined);
  assert.equal(fixture.find(node => node.type === 'DialogCancelPayment'), undefined);
  assert.equal(fixture.table().props.data[0], paid);
  await oldDialog.props.onDataUpdate();
  assert.equal(fixture.requests.length, 2, 'The previous customer callback cannot reload the current customer');
  assert.equal(fixture.notifications.length, 0);
});
