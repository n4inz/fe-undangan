import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

let paymentFixture;
let currentOrderBrand;
async function loadPaymentModal(orderBrand) {
  currentOrderBrand = orderBrand;
  if (paymentFixture) {
    paymentFixture.requests.length = 0;
    paymentFixture.lookups.length = 0;
    return paymentFixture;
  }
  const source = await readFile(new URL('../src/app/(form)/forms/[formId]/[phoneNumber]/atur-foto/success/paymentModal.js', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'paymentModal.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const context = vm.createContext({});
  const requests = [];
  const lookups = [];
  const resellerModal = function ResellerPaymentModal() {};
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const uiNames = [
    'Button', 'Checkbox', 'Input', 'Label', 'ScrollArea', 'RadioGroup', 'RadioGroupItem', 'toast',
    'Dialog', 'DialogContent', 'DialogTrigger', 'DialogTitle', 'Popover', 'PopoverTrigger', 'PopoverContent',
    'BiCheck', 'BiCopy', 'BiMoney', 'BiX', 'BiChevronDown', 'BiDownload', 'Info', 'Loader2', 'SaveIcon',
    'getBankAccounts', 'getCompanyProfile', 'z', 'paymentSchema', 'default',
  ];
  const module = new vm.SourceTextModule(outputText, { context });
  await module.link(specifier => {
    if (specifier === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx, Fragment: 'Fragment' });
    }
    if (specifier === 'react') return mock(Object.fromEntries(['useState', 'useRef', 'useEffect', 'useCallback'].map(name => [name, () => {
      throw new Error('Normal payment effects must not mount before resolving saved reseller attribution');
    }])));
    if (specifier === 'axios') return mock({ default: { get: url => requests.push(url), post: url => requests.push(url) } });
    if (specifier === '@/components/reseller/useResellerBrand') return mock({ useOrderBrand: options => {
      lookups.push(options);
      return currentOrderBrand;
    } });
    if (specifier === '@/components/reseller/ResellerPaymentModal') return mock({ default: resellerModal });
    return mock(Object.fromEntries(uiNames.map(name => [name, name])));
  });
  await module.evaluate();
  paymentFixture = { render: module.namespace.default, requests, lookups, resellerModal, module, context };
  return paymentFixture;
}

test('Wedding reseller payment uses saved attribution and never starts pricing/payment requests', async () => {
  const brand = { brandName: 'WeddingKu', contact: '081234567890' };
  const app = await loadPaymentModal({ brand, orderId: 123, isReseller: true, loading: false, error: null });
  const result = app.render({ formId: 'opaque-uuid', phoneNumber: '08123', brandSlug: 'another-brand', isPaid: 0 });
  assert.equal(result.type, app.resellerModal);
  assert.equal(result.props.brand, brand);
  assert.equal(result.props.isPaid, 0);
  assert.equal(result.props.orderId, 123);
  assert.equal(result.props.title, undefined);
  assert.equal(result.props.formId, undefined);
  assert.equal(app.lookups[0].type, 'wedding');
  assert.equal(app.lookups[0].formId, 'opaque-uuid');
  assert.deepEqual(app.requests, []);
});

test('Wedding normal payment retains its existing component after metadata lookup', async () => {
  const app = await loadPaymentModal({ brand: null, isReseller: false, loading: false, error: null });
  const result = app.render({ formId: 'normal-uuid', phoneNumber: '08123', buttonClassName: 'wide' });
  assert.equal(result.type.name, 'NormalPaymentModal');
  assert.equal(result.props.formId, 'normal-uuid');
  assert.equal(result.props.phoneNumber, '08123');
  assert.equal(result.props.buttonClassName, 'wide');
});

test('Wedding metadata loading and failure do not expose the normal payment flow', async () => {
  const pending = await loadPaymentModal({ loading: true, isReseller: false });
  const loading = pending.render({ formId: 'opaque-uuid' });
  assert.equal(loading.type, 'Button');
  assert.equal(loading.props.disabled, true);

  let retries = 0;
  const failed = await loadPaymentModal({ loading: false, error: 'Tidak dapat memuat undangan.', reload: () => retries++ });
  const error = failed.render({ formId: 'opaque-uuid' });
  assert.equal(error.props.role, 'alert');
  error.props.children[1].props.onClick();
  assert.equal(retries, 1);
  assert.deepEqual(failed.requests, []);
});
