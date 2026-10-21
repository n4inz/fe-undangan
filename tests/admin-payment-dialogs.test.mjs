import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Reuse a context because repeated linked VM collection is unstable on Windows.
const context = vm.createContext({ process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.test' } } });
const loadedModules = new Map();
let active;
const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
  for (const [name, value] of Object.entries(values)) this.setExport(name, value);
}, { context });

async function loadDialog(name) {
  if (loadedModules.has(name)) return loadedModules.get(name).namespace[name];
  const source = await readFile(new URL(`../src/components/admin/${name}.js`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: `${name}.jsx`,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const module = new vm.SourceTextModule(outputText, { context });
  await module.link(specifier => {
    if (specifier === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx });
    }
    if (specifier === 'react') return mock({
      useState: initial => active.useState(initial),
      useRef: initial => active.useRef(initial),
      useEffect: (callback, dependencies) => active.useEffect(callback, dependencies),
    });
    if (specifier === 'axios') return mock({ default: { post: (...args) => active.post(...args) } });
    return mock(Object.fromEntries([
      'Button', 'Input', 'Label', 'Loader2', 'AlertDialog', 'AlertDialogCancel',
      'AlertDialogContent', 'AlertDialogDescription', 'AlertDialogFooter',
      'AlertDialogHeader', 'AlertDialogTitle',
    ].map(key => [key, key])));
  });
  await module.evaluate();
  loadedModules.set(name, module);
  return module.namespace[name];
}

async function createDialog(name = 'DialogModalPayment', row = { id: 42, isPaid: 0 }) {
  const Component = await loadDialog(name);
  const hooks = [];
  let position = 0;
  let effects = [];
  const fixture = {
    requests: [], closes: [], updates: [],
    response: async () => ({ data: { message: 'Berhasil diperbarui' } }),
    props: {
      open: true, row,
      onOpenChange: value => fixture.closes.push(value),
      onDataUpdate: message => fixture.updates.push(message),
    },
    useState(initial) {
      const index = position++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], value => {
        hooks[index] = typeof value === 'function' ? value(hooks[index]) : value;
      }];
    },
    useRef(initial) {
      const index = position++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useEffect(callback, dependencies) {
      const index = position++;
      if (!hooks[index] || dependencies.some((dependency, offset) => !Object.is(dependency, hooks[index][offset]))) {
        hooks[index] = dependencies;
        effects.push(callback);
      }
    },
    post(...args) {
      fixture.requests.push(args);
      return fixture.response(...args);
    },
    render(props = {}) {
      Object.assign(fixture.props, props);
      active = fixture;
      position = 0;
      effects = [];
      fixture.tree = Component(fixture.props);
      for (const effect of effects) effect();
      // Read the state after effects without running the same effects again.
      position = 0;
      fixture.tree = Component(fixture.props);
      return fixture.tree;
    },
    find(predicate) {
      const visit = node => {
        if (!node || typeof node !== 'object') return undefined;
        if (Array.isArray(node)) return node.map(visit).find(Boolean);
        if (predicate(node)) return node;
        return visit(node.props?.children);
      };
      return visit(fixture.tree);
    },
    element(type) { return fixture.find(node => node.type === type); },
    setAmount(value) {
      fixture.element('Input').props.onChange({ target: { value } });
      fixture.render();
    },
    submit() {
      active = fixture;
      return fixture.element('form').props.onSubmit({ preventDefault() {} });
    },
    cancelPayment() {
      active = fixture;
      return fixture.element('Button').props.onClick();
    },
  };
  fixture.render();
  return fixture;
}

const plain = value => JSON.parse(JSON.stringify(value));

test('mark paid sends a numeric amount with credentials and reports success exactly once', async () => {
  const dialog = await createDialog();
  dialog.setAmount('150000');
  assert.equal(dialog.element('Label').props.htmlFor, dialog.element('Input').props.id);
  assert.equal(dialog.element('Input').props.required, true);

  await dialog.submit();

  assert.deepEqual(plain(dialog.requests), [[
    'https://api.example.test/update-payment/42',
    { isPaid: 0, paymentAmount: 150000 },
    { withCredentials: true },
  ]]);
  assert.deepEqual(dialog.closes, [false]);
  assert.deepEqual(dialog.updates, ['Berhasil diperbarui']);
});

test('payment validation accepts complimentary payments and the largest supported integer', async () => {
  for (const amount of ['0', '2147483647']) {
    const dialog = await createDialog();
    dialog.setAmount(amount);
    await dialog.submit();
    assert.equal(dialog.requests[0][1].paymentAmount, Number(amount));
    assert.deepEqual(dialog.closes, [false]);
  }
});

test('blank, negative, fractional and overflowing payment amounts never reach the API', async () => {
  for (const amount of ['', ' ', '-1', '1.5', '2147483648', 'NaN', 'Infinity']) {
    const dialog = await createDialog();
    dialog.setAmount(amount);
    await dialog.submit();
    dialog.render();
    assert.deepEqual(dialog.requests, [], amount);
    assert.equal(dialog.find(node => node.props?.role === 'alert').props.children,
      'Masukkan nominal bulat antara Rp 0 dan Rp 2.147.483.647.');
    assert.deepEqual(dialog.closes, []);
  }
});

test('a failed payment keeps its amount and modal open, shows the error, and allows retry', async () => {
  const dialog = await createDialog();
  dialog.response = async () => { throw { response: { data: { error: 'Tidak dapat menyimpan pembayaran.' } } }; };
  dialog.setAmount('125000');
  await dialog.submit();
  dialog.render();

  assert.equal(dialog.tree.props.open, true);
  assert.equal(dialog.element('Input').props.value, '125000');
  assert.equal(dialog.find(node => node.props?.role === 'alert').props.children, 'Tidak dapat menyimpan pembayaran.');
  assert.equal(dialog.element('Button').props.disabled, false);
  assert.deepEqual(dialog.closes, []);
  assert.deepEqual(dialog.updates, []);

  dialog.response = async () => ({ data: { message: 'Lunas' } });
  await dialog.submit();
  assert.equal(dialog.requests.length, 2);
  assert.deepEqual(dialog.closes, [false]);
  assert.deepEqual(dialog.updates, ['Lunas']);
});

test('an in-flight payment disables editing and closing and ignores duplicate submits', async () => {
  const dialog = await createDialog();
  let resolve;
  dialog.response = () => new Promise(done => { resolve = done; });
  dialog.setAmount('100000');
  const pending = dialog.submit();
  const duplicate = dialog.submit();
  dialog.render();

  assert.equal(dialog.requests.length, 1);
  assert.equal(dialog.element('Input').props.disabled, true);
  assert.equal(dialog.element('Button').props.disabled, true);
  assert.equal(dialog.element('AlertDialogCancel').props.disabled, true);
  dialog.tree.props.onOpenChange(false);
  assert.deepEqual(dialog.closes, []);

  resolve({ data: { message: 'Lunas' } });
  await Promise.all([pending, duplicate]);
  assert.deepEqual(dialog.closes, [false]);
  assert.deepEqual(dialog.updates, ['Lunas']);
});

test('closing or opening another invitation resets payment input and errors', async () => {
  const dialog = await createDialog();
  dialog.setAmount('-1');
  await dialog.submit();
  dialog.render();
  dialog.tree.props.onOpenChange(false);
  dialog.render({ open: false });
  dialog.render({ open: true });
  assert.equal(dialog.element('Input').props.value, '');
  assert.equal(dialog.find(node => node.props?.role === 'alert'), undefined);

  dialog.setAmount('50000');
  dialog.render({ row: { id: 43, isPaid: 0 } });
  assert.equal(dialog.element('Input').props.value, '');
});

test('missing invitation IDs never send either payment mutation', async () => {
  const payment = await createDialog('DialogModalPayment', null);
  payment.setAmount('10000');
  await payment.submit();
  payment.render();
  assert.deepEqual(payment.requests, []);
  assert.match(payment.find(node => node.props?.role === 'alert').props.children, /Data undangan/);

  const cancel = await createDialog('DialogCancelPayment', {});
  await cancel.cancelPayment();
  cancel.render();
  assert.deepEqual(cancel.requests, []);
  assert.match(cancel.find(node => node.props?.role === 'alert').props.children, /Data undangan/);
});

test('cancel paid always resets payment amount to zero and reports success', async () => {
  const dialog = await createDialog('DialogCancelPayment', { id: 73, isPaid: 1, paymentAmount: 150000 });
  await dialog.cancelPayment();

  assert.deepEqual(plain(dialog.requests), [[
    'https://api.example.test/update-payment/73',
    { isPaid: 1, paymentAmount: 0 },
    { withCredentials: true },
  ]]);
  assert.deepEqual(dialog.closes, [false]);
  assert.deepEqual(dialog.updates, ['Berhasil diperbarui']);
});

test('failed cancellation stays open with an error and resets that error when reopened', async () => {
  const dialog = await createDialog('DialogCancelPayment', { id: 73, isPaid: 1 });
  dialog.response = async () => { throw new Error('Network unavailable'); };
  await dialog.cancelPayment();
  dialog.render();
  assert.equal(dialog.tree.props.open, true);
  assert.match(dialog.find(node => node.props?.role === 'alert').props.children, /Status lunas gagal dibatalkan/);
  assert.deepEqual(dialog.closes, []);
  assert.deepEqual(dialog.updates, []);
  assert.equal(dialog.element('Button').props.disabled, false);

  dialog.tree.props.onOpenChange(false);
  dialog.render({ open: false });
  dialog.render({ open: true });
  assert.equal(dialog.find(node => node.props?.role === 'alert'), undefined);
});

test('in-flight cancellation prevents duplicate requests and modal dismissal', async () => {
  const dialog = await createDialog('DialogCancelPayment', { id: 73, isPaid: 1 });
  let resolve;
  dialog.response = () => new Promise(done => { resolve = done; });
  const pending = dialog.cancelPayment();
  const duplicate = dialog.cancelPayment();
  dialog.render();
  assert.equal(dialog.requests.length, 1);
  assert.equal(dialog.element('Button').props.disabled, true);
  assert.equal(dialog.element('AlertDialogCancel').props.disabled, true);
  dialog.tree.props.onOpenChange(false);
  assert.deepEqual(dialog.closes, []);

  resolve({ data: { message: 'Dibatalkan' } });
  await Promise.all([pending, duplicate]);
  assert.deepEqual(dialog.closes, [false]);
  assert.deepEqual(dialog.updates, ['Dibatalkan']);
});
