import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const helperSource = await readFile(new URL('../src/lib/resellerBrand.js', import.meta.url), 'utf8');
const hookSource = await readFile(new URL('../src/components/reseller/useResellerBrand.js', import.meta.url), 'utf8');
const context = vm.createContext({ URL, URLSearchParams, process: { env: {} } });
const helpers = new vm.SourceTextModule(helperSource, { context });
const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
  for (const [name, value] of Object.entries(values)) this.setExport(name, value);
}, { context });
let scenario = {};
let calls = [];
let resolvedRef = { current: null };
const hooks = new vm.SourceTextModule(hookSource, { context });
await hooks.link(name => ({
  react: mock({ useEffect() {}, useRef: () => resolvedRef }),
  axios: mock({ default: {} }),
  swr: mock({ default: (key, fetcher, options) => {
    calls.push({ key, options });
    if (!key) return { mutate() {} };
    const order = key[0].startsWith('/form-brand/');
    return {
      data: order ? scenario.order || { orderId: 321, isReseller: false, brand: null } : { brand: scenario.brand },
      error: order ? scenario.orderError : scenario.error,
      isLoading: order ? false : scenario.loading,
      isValidating: scenario.validating,
      mutate() {},
    };
  } }),
  'next/navigation': mock({
    useSearchParams: () => new URLSearchParams(scenario.query || ''),
    usePathname: () => '/forms/new', useRouter: () => ({}),
  }),
  'next-auth/react': mock({ useSession: () => scenario.session || ({ status: 'unauthenticated' }) }),
  '@/lib/resellerBrand': helpers,
})[name]);
await hooks.evaluate();

function resolve(options, type = 'wedding', preserveRender = false) {
  if (!preserveRender) resolvedRef = { current: null };
  scenario = options;
  calls = [];
  return hooks.namespace.usePaymentDestination({ type, formId: options.formId || 'secret-uuid' });
}

test('default payment receives session credentials only for authenticated numeric order links', () => {
  const session = { status: 'authenticated', data: { user: { sessionToken: 'customer-session' } } };
  for (const type of ['wedding', 'aqiqah-khitan']) {
    for (const formId of ['12', 'secret-uuid']) {
      const result = resolve({ query: 'brand=missing&phone=invalid', formId, session, error: { response: { status: 404 } } }, type);
      assert.equal(result.phone, null);
      assert.equal(result.paymentToken, formId === '12' ? 'customer-session' : '');
      assert.equal(result.paymentCredentials, formId === '12');
      assert.equal(result.paymentQuery, 'brand=missing&phone=invalid');
      assert.equal(result.error, null);
    }
  }
});

test('both form types follow the complete URL phone / brand / default matrix', () => {
  const brand = { brandSlug: 'brand-one', contact: '0812-3456-7890' };
  const urlPhone = '6289876543210';
  const cases = [
    [{ query: 'phone=089876543210' }, urlPhone],
    [{ query: 'brand=brand-one', brand }, '6281234567890'],
    [{ query: 'brand=brand-one&phone=089876543210', brand }, '6281234567890'],
    [{ query: 'brand=brand-one&phone=089876543210', brand: { ...brand, contact: null } }, urlPhone],
    [{ query: 'brand=missing&phone=089876543210', error: { response: { status: 404 } } }, urlPhone],
    [{ query: 'brand=brand-one', brand: { ...brand, contact: null } }, null],
    [{}, null],
    [{ query: 'brand=brand-one&phone=089876543210', brand: { ...brand, contact: 'invalid123' } }, urlPhone],
    [{ query: 'phone=abc' }, null],
  ];
  for (const type of ['wedding', 'aqiqah-khitan']) {
    for (const [options, phone] of cases) {
      const result = resolve(options, type);
      assert.equal(result.phone, phone, `${type}: ${options.query || 'no query'}`);
      assert.equal(result.orderId, 321);
      assert.equal(result.error, null);
      assert.equal(result.loading, false);
    }
  }
});

test('only the requested brand can supply its database phone', () => {
  const otherBrand = { brandSlug: 'brand-other', contact: '081234567890' };
  const order = { orderId: 321, isReseller: true, brand: otherBrand };
  for (const brand of [undefined, otherBrand, { brandSlug: 'brand-one', contact: '' }]) {
    const state = resolve({ query: 'brand=brand-one&phone=089876543210', brand, order });
    assert.equal(state.phone, '6289876543210');
  }
  assert.equal(resolve({ query: 'phone=089876543210', order }).phone, '6289876543210');
  assert.equal(resolve({ order }).phone, '6281234567890', 'old saved-order links remain compatible');
});

test('saved admin contacts work without reseller ownership or URL metadata on both form types', () => {
  const order = { orderId: 321, isReseller: false, brand: null, adminPhone: '6289876543210' };
  for (const type of ['wedding', 'aqiqah-khitan']) {
    const state = resolve({ order }, type);
    assert.equal(state.phone, order.adminPhone);
    assert.equal(state.adminPhone, order.adminPhone);
    assert.equal(state.brand, null);
    assert.equal(state.phoneSource, 'saved');
    assert.equal(state.contactLabel, 'Hubungi Admin');
    assert.equal(state.paymentQuery, '');
    assert.equal(state.loading, false);
    assert.equal(state.error, null);
    const withQuery = resolve({ order, query: 'phone=089876543210' }, type);
    assert.equal(withQuery.phoneSource, 'url');
    assert.equal(withQuery.contactLabel, 'Hubungi Admin');
  }
});

test('brand and URL contact priorities precede saved fallback without borrowing another reseller', () => {
  const ownBrand = { brandSlug: 'brand-owner', contact: '081234567890' };
  const requestedBrand = { brandSlug: 'brand-one', contact: '087712345678' };
  const order = { orderId: 321, isReseller: true, brand: ownBrand, adminPhone: '6289876543210' };
  for (const type of ['wedding', 'aqiqah-khitan']) {
    assert.equal(resolve({ order }, type).phone, '6281234567890');
    assert.equal(resolve({ order: { ...order, brand: { ...ownBrand, contact: null } } }, type).phone, order.adminPhone);
    assert.equal(resolve({ order, query: 'brand=brand-one&phone=088812345678', brand: requestedBrand }, type).phone, '6287712345678');
    assert.equal(resolve({ order, query: 'brand=brand-one&phone=088812345678', brand: { ...requestedBrand, contact: null } }, type).phone, '6288812345678');
    const unavailable = resolve({ order, query: 'brand=missing', error: { response: { status: 404 } } }, type);
    assert.equal(unavailable.phone, order.adminPhone);
    assert.equal(unavailable.phoneSource, 'saved');
    const invalid = resolve({ order, query: 'brand=bad/slug&phone=invalid' }, type);
    assert.equal(invalid.phone, order.adminPhone);
    assert.equal(invalid.phoneSource, 'saved');
    assert.equal(resolve({ order: { ...order, adminPhone: null }, query: 'brand=bad/slug&phone=invalid' }, type).phone, null);
  }
});

test('saved metadata is validated independently and old metadata remains compatible', () => {
  for (const adminPhone of [undefined, null, '', '081234567890', '+6281234567890', 'invalid123', '1'.repeat(16), 6281234567890]) {
    const state = resolve({ order: { orderId: 321, isReseller: false, brand: null, adminPhone } });
    assert.equal(state.adminPhone, null);
    assert.equal(state.phone, null);
    assert.equal(state.error, null);
  }
  const state = resolve({ order: { orderId: 321, isReseller: false, brand: null, adminPhone: '819012345678' } });
  assert.equal(state.phone, '819012345678');
});

test('empty or invalid brand never starts a public brand search', () => {
  for (const query of ['phone=081234567890', 'brand=&phone=081234567890', 'brand=bad/slug&phone=081234567890']) {
    assert.equal(resolve({ query }).phone, '6281234567890');
    assert.equal(calls[1].key, null);
  }
  assert.equal(resolve({ query: 'phone=081234567890&phone=089876543210' }).phone, null);
});

test('fresh brand lookup waits for revalidation and reflects changed or cleared contacts', () => {
  const brand = { brandSlug: 'brand-one', contact: '081234567890' };
  assert.equal(resolve({ query: 'brand=brand-one', brand, validating: true }).loading, true);
  assert.equal(calls[0].options.revalidateOnMount, true);
  assert.equal(calls[1].options.keepPreviousData, false);
  assert.equal(resolve({ query: 'brand=brand-one', brand: { ...brand, contact: '089876543210' } }).phone, '6289876543210');
  assert.equal(resolve({ query: 'brand=brand-one', brand: { ...brand, contact: null } }).phone, null);
  assert.ok(resolve({ query: 'phone=081234567890', orderError: new Error('offline') }).error);
});

test('background revalidation preserves mounted default payment drafts and route changes still wait', () => {
  assert.equal(resolve({ query: 'brand=brand-one', brand: { brandSlug: 'brand-one', contact: null } }).loading, false);
  assert.equal(resolve({ query: 'brand=brand-one', brand: { brandSlug: 'brand-one', contact: null }, validating: true }, 'wedding', true).loading, false);
  assert.equal(resolve({ query: 'brand=brand-two', validating: true }, 'wedding', true).loading, true);
});

test('background failures retain the last resolved contact and keep default drafts mounted', () => {
  const brand = { brandSlug: 'brand-one', contact: null };
  resolve({ query: 'brand=brand-one', brand });
  const state = resolve({ query: 'brand=brand-one', brand, error: new Error('offline'), orderError: new Error('offline') }, 'wedding', true);
  assert.equal(state.error, null);
  assert.equal(state.loading, false);
  assert.equal(state.phone, null);
  const withContact = { ...brand, contact: '081234567890' };
  resolve({ query: 'brand=brand-one', brand: withContact });
  assert.equal(resolve({ query: 'brand=brand-one', brand: withContact, error: new Error('offline') }, 'wedding', true).phone, '6281234567890');
});

test('unavailable brand falls back but transient lookup errors offer retry before choosing a destination', () => {
  for (const error of [new Error('offline'), { response: { status: 500 } }]) {
    assert.ok(resolve({ query: 'brand=brand-one&phone=081234567890', error }).error);
  }
  assert.equal(resolve({ query: 'brand=brand-one&phone=081234567890', error: { response: { status: 404 } } }).error, null);
});

test('phone normalization accepts formatted numbers and rejects empty, malformed or unsafe destinations', () => {
  for (const input of ['081234567890', '+62 812-3456-7890', '81234567890', '(0812) 3456.7890']) {
    assert.equal(helpers.namespace.normalizeWhatsAppPhone(input), '6281234567890');
  }
  for (const input of ['+819012345678', ' +821012345678 ', '+8801712345678']) {
    assert.equal(helpers.namespace.normalizeWhatsAppPhone(input), input.replace(/\D/g, ''));
  }
  for (const input of [null, undefined, '', ' ', 81234567890, '123', '00000000', 'abc081234567890', '081234567890/999', '1'.repeat(16), 'https://wa.me/6281234567890']) {
    assert.equal(helpers.namespace.normalizeWhatsAppPhone(input), null, String(input));
  }
});

test('phone query validation accepts exactly one valid value and shared fallback uses canonical saved numbers', () => {
  const { readPhoneQuery, paymentDestinationPhone, storedWhatsAppPhone } = helpers.namespace;
  assert.equal(readPhoneQuery(new URLSearchParams('phone=081234567890')), '6281234567890');
  assert.equal(readPhoneQuery(new URLSearchParams('phone=%2B819012345678')), '819012345678');
  for (const query of ['', 'phone=', 'phone=invalid123', 'phone=081234567890&phone=089876543210']) {
    assert.equal(readPhoneQuery(new URLSearchParams(query)), null);
  }
  assert.equal(paymentDestinationPhone({ contact: '081234567890' }, '089876543210', '819012345678'), '6281234567890');
  assert.equal(paymentDestinationPhone({ contact: null }, '089876543210', '819012345678'), '6289876543210');
  assert.equal(paymentDestinationPhone(null, 'invalid', '819012345678'), '819012345678');
  assert.equal(storedWhatsAppPhone('819012345678'), '819012345678');
});

test('direct payment links keep the existing activation message and numeric order information', async () => {
  const source = await readFile(new URL('../src/components/reseller/ResellerPaymentModal.js', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'modal.jsx', compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
  });
  const component = new vm.SourceTextModule(outputText, { context });
  await component.link(name => {
    if (name === '@/lib/resellerBrand') return helpers;
    if (name === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx });
    }
    const names = ['MessageCircle', 'Button', 'Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle', 'DialogTrigger'];
    return mock(Object.fromEntries(names.map(name => [name, name])));
  });
  await component.evaluate();
  for (const title of ['Ayu & Budi', 'Aqiqah Alya']) {
    const button = component.namespace.default({ contactPhone: '6281234567890', orderId: 321, title, direct: true });
    const link = button.props.children;
    const url = new URL(link.props.href);
    assert.equal(url.origin, 'https://wa.me');
    assert.equal(url.pathname, '/6281234567890');
    assert.equal(link.props.target, '_blank');
    assert.match(url.searchParams.get('text'), /Halo, saya ingin mengaktifkan undangan yang baru saya buat\./);
    assert.match(url.searchParams.get('text'), /ID pesanan: 321\./);
    assert.ok(url.searchParams.get('text').includes(`Judul undangan: ${title}.`));
  }
  const international = component.namespace.default({ contactPhone: '819012345678', orderId: 321, direct: true, buttonLabel: 'Hubungi Admin' });
  assert.equal(new URL(international.props.children.props.href).pathname, '/819012345678');
  assert.equal(international.props.children.props.children[1], 'Hubungi Admin');
  const invalid = component.namespace.default({ contactPhone: 'invalid123', direct: true });
  assert.equal(invalid.type, 'Dialog');
  assert.doesNotMatch(JSON.stringify(invalid), /https:\/\/wa\.me\//);
  const paid = component.namespace.default({ contactPhone: '6281234567890', direct: true, isPaid: 1 });
  assert.equal(paid.props.role, 'status');
});

function nodes(value) {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  return [value, ...nodes(value.props?.children)];
}

function contentText(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return '';
  if (Array.isArray(value)) return value.map(contentText).join(' ');
  return contentText(value.props?.children);
}

async function orderPageHarness(type, page) {
  const isAk = type === 'aqiqah-khitan';
  const directory = isAk ? '../src/app/(form)/forms/aqiqah-khitan/[formId]/atur-foto/success/' : '../src/app/(form)/forms/[formId]/[phoneNumber]/atur-foto/success/';
  const source = await readFile(new URL(`${directory}${page === 'result' ? 'result/' : ''}page.js`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'page.jsx', compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
  });
  let cursor = 0;
  let savedPhone = null;
  const form = { id: 321, isPaid: 0, slug: 'https://invitation.example.test/event', namaAcara: 'Aqiqah', namaPanggilanAnak: 'Alya' };
  const values = page === 'result' ? isAk ? [form, false, false] : [[], form, false, 321] : isAk ? [form, false] : [false, form];
  const paymentMarker = function PaymentModal() {};
  const nav = new vm.SourceTextModule(await readFile(new URL('../src/lib/formNavigation.js', import.meta.url), 'utf8'), { context });
  const component = new vm.SourceTextModule(outputText, { context });
  await component.link(name => {
    if (name === 'react') return mock({ useState: () => [values[cursor++], () => {}], useEffect() {} });
    if (name === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx });
    }
    if (name === 'next/navigation') return mock({
      useRouter: () => ({ replace: () => assert.fail('Loaded order must not redirect') }),
      useSearchParams: () => new URLSearchParams(),
      usePathname: () => '/forms/order-uuid/0812/atur-foto/success',
    });
    if (name === '@/components/reseller/useResellerBrand') return mock({ useOrderBrand: () => ({
      brand: null, isReseller: false, adminPhone: savedPhone, loading: false, error: null,
    }) });
    if (name === '@/lib/formNavigation') return nav;
    if (name.endsWith('/paymentModal') || name.endsWith('/PaymentModalAk')) return mock({ default: paymentMarker });
    if (name === 'next/link') return mock({ default: 'Link' });
    const names = ['default', 'Button', 'Toaster', 'checkForm', 'checkFormAk', 'BiEnvelope', 'BiPhone', 'BiArrowBack', 'BiEdit', 'BiMessageAltDetail', 'BiShare', 'BiUserCheck', 'BiPhotoAlbum', 'ArrowLeft', 'ExternalLink', 'Images', 'FilePenLine', 'Loader2', 'MessageCircle', 'Share2'];
    return mock(Object.fromEntries(names.map(key => [key, key])));
  });
  await component.evaluate();
  return {
    render(adminPhone) {
      savedPhone = adminPhone;
      cursor = 0;
      return component.namespace.default({ params: { formId: 'order-uuid', phoneNumber: '0812' } });
    },
    paymentMarker,
  };
}

test('reopened result pages route saved phone-only orders through payment and hide the default admin number', async () => {
  for (const type of ['wedding', 'aqiqah-khitan']) {
    const app = await orderPageHarness(type, 'result');
    const savedNodes = nodes(app.render('6289876543210'));
    assert.equal(savedNodes.filter(node => node.type === app.paymentMarker).length, 1);
    assert.equal(savedNodes.filter(node => node.type === 'Link' && node.props.href?.startsWith('https://wa.me/')).length, 0);
    const normalNodes = nodes(app.render(null));
    assert.equal(normalNodes.filter(node => node.type === 'Link' && node.props.href?.startsWith('https://wa.me/')).length, 1, 'normal orders retain their existing admin contact');
  }
});

test('reopened success pages explain admin activation for saved phone-only orders without presenting a reseller brand', async () => {
  for (const type of ['wedding', 'aqiqah-khitan']) {
    const app = await orderPageHarness(type, 'success');
    const saved = app.render('6289876543210');
    assert.match(contentText(saved), /[Hh]ubungi admin untuk mengaktifkan undangan/);
    assert.doesNotMatch(contentText(saved), /hubungi reseller|setelah melakukan pembayaran|setelah pembayaran dikirim/);
    assert.equal(nodes(saved).filter(node => node.type === app.paymentMarker).length, 1);
    assert.match(contentText(app.render(null)), /setelah melakukan pembayaran|setelah pembayaran dikirim/);
  }
});
