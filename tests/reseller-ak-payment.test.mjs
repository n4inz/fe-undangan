import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

// Keep one VM alive across scenarios; repeatedly disposing linked contexts can
// crash Node's experimental VM implementation on Windows during collection.
let paymentFixture;
let currentOrderBrand;
async function loadPaymentModal(orderBrand) {
  currentOrderBrand = orderBrand;
  if (paymentFixture) {
    paymentFixture.requests.length = 0;
    paymentFixture.lookups.length = 0;
    return paymentFixture;
  }
  const source = await readFile(new URL('../src/app/(form)/forms/aqiqah-khitan/[formId]/atur-foto/success/PaymentModalAk.js', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'PaymentModalAk.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const context = vm.createContext({});
  const requests = [];
  const lookups = [];
  const hookNames = ['useCallback', 'useEffect', 'useMemo', 'useRef', 'useState'];
  const uiNames = [
    'Button', 'Checkbox', 'Input', 'Label', 'RadioGroup', 'RadioGroupItem', 'toast',
    'Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle', 'DialogTrigger',
    'CheckCircle2', 'Copy', 'CreditCard', 'ImageUp', 'Loader2', 'Pencil', 'RefreshCw', 'Save',
    'getBankAccounts', 'getCompanyProfile',
  ];
  const resellerModal = function ResellerPaymentModal() {};
  const createModule = (values) => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [key, value] of Object.entries(values)) this.setExport(key, value);
  }, { context });
  const module = new vm.SourceTextModule(outputText, { context });
  await module.link((specifier) => {
    if (specifier === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return createModule({ jsx, jsxs: jsx, Fragment: 'Fragment' });
    }
    if (specifier === 'react') {
      return createModule(Object.fromEntries(hookNames.map(name => [name, () => {
        throw new Error('The normal payment component must not mount before persisted attribution is resolved');
      }])));
    }
    if (specifier === 'axios') return createModule({ default: { get: url => requests.push(url), post: url => requests.push(url) } });
    if (specifier === '@/components/reseller/useResellerBrand') return createModule({ useOrderBrand: options => {
      lookups.push(options);
      return currentOrderBrand;
    } });
    if (specifier === '@/components/reseller/ResellerPaymentModal') return createModule({ default: resellerModal });
    return createModule(Object.fromEntries(uiNames.map(name => [name, name])));
  });
  await module.evaluate();
  paymentFixture = { render: module.namespace.default, resellerModal, requests, lookups, module, context };
  return paymentFixture;
}

test('AK reseller payment uses persisted brand even when the URL brand is removed or replaced', async () => {
  const brand = { brandName: 'WeddingKu', brandSlug: 'weddingku', contact: '081234567890' };
  const app = await loadPaymentModal({ brand, orderId: 124, isReseller: true, loading: false, error: '' });
  const result = app.render({ formId: 'opaque-order-uuid', brandSlug: 'another-brand', isPaid: 0 });

  assert.equal(result.type, app.resellerModal);
  assert.equal(result.props.brand, brand);
  assert.equal(result.props.orderId, 124);
  assert.equal(result.props.formId, undefined);
  assert.equal(app.lookups[0].type, 'aqiqah-khitan');
  assert.equal(app.lookups[0].formId, 'opaque-order-uuid');
  assert.deepEqual(app.requests, []);
});

test('AK normal order retains the existing payment component after metadata lookup', async () => {
  const app = await loadPaymentModal({ brand: null, isReseller: false, loading: false, error: '' });
  const props = { formId: 'normal-uuid', isPaid: 0, buttonClassName: 'wide' };
  const result = app.render(props);

  assert.equal(result.type.name, 'StandardPaymentModalAk');
  assert.equal(result.props.formId, props.formId);
  assert.equal(result.props.buttonClassName, props.buttonClassName);
});

test('AK waits for persisted attribution before showing either payment flow', async () => {
  const app = await loadPaymentModal({ brand: null, isReseller: false, loading: true, error: '' });
  const result = app.render({ formId: 'pending-uuid' });

  assert.equal(result.type, 'Button');
  assert.equal(result.props.disabled, true);
  assert.deepEqual(app.requests, []);
});

test('AK attribution lookup failure offers retry without falling back to normal payment', async () => {
  let retries = 0;
  const app = await loadPaymentModal({ brand: null, isReseller: false, loading: false, error: 'Gagal memuat pesanan.', reload: () => retries++ });
  const result = app.render({ formId: 'unknown-uuid' });

  assert.equal(result.type, 'div');
  const [notice, retry] = result.props.children;
  assert.equal(notice.props.role, 'alert');
  assert.equal(notice.props.children, 'Gagal memuat pesanan.');
  retry.props.onClick();
  assert.equal(retries, 1);
  assert.deepEqual(app.requests, []);
});
