import test from 'node:test';
import assert from 'node:assert/strict';
import { File } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';

const apiBase = 'https://api.example.test';
const fixtures = [];

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

async function loadDefaultPayment(type, paymentQuery, formId) {
  const wedding = type === 'wedding';
  const paymentCredentials = /^\d+$/.test(formId);
  const paymentToken = paymentCredentials ? 'customer-session-token' : '';
  const path = wedding
    ? '../src/app/(form)/forms/[formId]/[phoneNumber]/atur-foto/success/paymentModal.js'
    : '../src/app/(form)/forms/aqiqah-khitan/[formId]/atur-foto/success/PaymentModalAk.js';
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    fileName: 'payment.jsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  class MockFormData {
    values = [];
    append(key, value) { this.values.push([key, value]); }
    get(key) { return this.values.find(([name]) => name === key)?.[1]; }
  }
  const context = vm.createContext({
    process: { env: { NEXT_PUBLIC_API_URL: apiBase } },
    File,
    FormData: MockFormData,
    URL: class extends URL {
      static createObjectURL() { return 'blob:payment-proof'; }
      static revokeObjectURL() {}
    },
  });
  const mock = values => new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
  const requests = [];
  const notifications = [];
  const pending = new Set();
  let savedPayment = null;
  const track = promise => {
    pending.add(promise);
    promise.then(() => pending.delete(promise), () => pending.delete(promise));
    return promise;
  };
  const axios = {
    get: (url, options) => track(Promise.resolve().then(() => {
      requests.push({ method: 'GET', url, options });
      return { data: url.includes('/tema-price') ? { price: 75000, music: true } : savedPayment };
    })),
    post: (url, body, options) => track(Promise.resolve().then(() => {
      requests.push({ method: 'POST', url, body, options });
      savedPayment = { id: 51, ...JSON.parse(body.get('data')), file: 'proof.png' };
      return { status: 200, data: savedPayment };
    })),
  };
  const state = [];
  const refs = [];
  const memos = [];
  const effects = [];
  let stateCursor = 0;
  let refCursor = 0;
  let memoCursor = 0;
  let effectCursor = 0;
  const sameDependencies = (previous, next) => previous && next && previous.length === next.length
    && previous.every((value, index) => Object.is(value, next[index]));
  const memo = (create, dependencies) => {
    const index = memoCursor++;
    if (!sameDependencies(memos[index]?.dependencies, dependencies)) {
      memos[index] = { value: create(), dependencies };
    }
    return memos[index].value;
  };
  const validation = new vm.SourceTextModule(await readFile(new URL('../src/lib/validation.js', import.meta.url), 'utf8'), { context });
  const uiNames = [
    'Button', 'Checkbox', 'Input', 'Label', 'ScrollArea', 'RadioGroup', 'RadioGroupItem',
    'Dialog', 'DialogContent', 'DialogDescription', 'DialogHeader', 'DialogTitle', 'DialogTrigger',
    'Popover', 'PopoverTrigger', 'PopoverContent', 'BiCheck', 'BiCopy', 'BiMoney', 'BiX',
    'BiChevronDown', 'BiDownload', 'Info', 'Loader2', 'SaveIcon', 'CheckCircle2', 'Copy',
    'CreditCard', 'ImageUp', 'Pencil', 'RefreshCw', 'Save',
  ];
  const component = new vm.SourceTextModule(outputText, { context });
  await component.link(specifier => {
    if (specifier === 'react/jsx-runtime') {
      const jsx = (type, props) => ({ type, props });
      return mock({ jsx, jsxs: jsx, Fragment: 'Fragment' });
    }
    if (specifier === 'react') return mock({
      useState: initial => {
        const index = stateCursor++;
        if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
        return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useRef: initial => {
        const index = refCursor++;
        if (!(index in refs)) refs[index] = { current: initial };
        return refs[index];
      },
      useCallback: (callback, dependencies) => memo(() => callback, dependencies),
      useMemo: memo,
      useEffect: (callback, dependencies) => {
        const index = effectCursor++;
        effects[index] = { ...effects[index], callback, nextDependencies: dependencies };
      },
    });
    if (specifier === 'axios') return mock({ default: axios });
    if (specifier === 'zod') return mock({ z });
    if (specifier === '@/lib/validation') return validation;
    if (specifier === '@/lib/company') return mock({
      getBankAccounts: async () => ({ data: [] }),
      getCompanyProfile: async () => ({ data: { ownerName: 'Company' } }),
    });
    if (specifier === '@/components/ui/use-toast') return mock({ toast: value => notifications.push(value) });
    if (specifier === '@/components/reseller/useResellerBrand') return mock({
      usePaymentDestination: () => ({ brand: null, orderId: 123, phone: null, paymentQuery, paymentToken, paymentCredentials, loading: false, error: null }),
    });
    if (specifier === '@/components/reseller/ResellerPaymentModal') return mock({ default: 'ResellerPaymentModal' });
    if (specifier === 'next/image' || specifier.startsWith('/public/')) return mock({ default: 'Image' });
    return mock(Object.fromEntries(uiNames.map(name => [name, name])));
  });
  await component.evaluate();
  const child = component.namespace.default({ formId, phoneNumber: '081234567890', isPaid: 0 });
  assert.equal(child.type.name, wedding ? 'NormalPaymentModal' : 'StandardPaymentModalAk');
  assert.equal(child.props.paymentQuery, paymentQuery);
  assert.equal(child.props.paymentToken, paymentToken);
  assert.equal(child.props.paymentCredentials, paymentCredentials);
  const render = () => {
    stateCursor = refCursor = memoCursor = effectCursor = 0;
    return child.type(child.props);
  };
  const flushEffects = async () => {
    for (let iteration = 0; iteration < 20; iteration++) {
      render();
      const changed = effects.filter(effect => !sameDependencies(effect.dependencies, effect.nextDependencies));
      for (const effect of changed) {
        effect.cleanup?.();
        effect.dependencies = effect.nextDependencies?.slice();
        effect.cleanup = effect.callback();
      }
      while (pending.size) await Promise.allSettled([...pending]);
      await new Promise(resolve => setImmediate(resolve));
      if (!changed.length) return;
    }
    assert.fail('Payment component effects did not settle');
  };
  const find = predicate => nodes(render()).find(predicate);
  const fixture = { context, component, requests, notifications, find, flushEffects };
  fixtures.push(fixture);
  await flushEffects();
  return fixture;
}

for (const type of ['wedding', 'aqiqah-khitan']) {
  for (const formId of ['order-uuid', '123']) {
  for (const paymentQuery of ['brand=missing&phone=invalid', '']) {
    test(`${type}: ${formId} default payment preserves ${paymentQuery ? 'routing fallback parameters' : 'parameter-free URLs'} and request credentials through reads and upload`, async () => {
      const wedding = type === 'wedding';
      const app = await loadDefaultPayment(type, paymentQuery, formId);
      const suffix = paymentQuery ? `?${paymentQuery}` : '';
      const paymentUrl = wedding ? `/payment/${formId}/081234567890` : `/payment-ak/${formId}`;
      const themeUrl = wedding ? `/tema-price/${formId}` : `/tema-price-ak/${formId}`;
      const uploadUrl = wedding ? `/upload-payment/${formId}/081234567890` : `/upload-payment-ak/${formId}`;
      assert.deepEqual(app.requests.map(({ method, url }) => [method, url]).sort(), [
        ['GET', `${apiBase}${paymentUrl}${suffix}`],
        ['GET', `${apiBase}${themeUrl}${suffix}`],
      ].sort());
      const file = new File(['payment proof'], 'proof.png', { type: 'image/png' });
      app.find(node => node.props?.id === (wedding ? 'name' : 'payment-name-ak')).props.onChange({
        target: { name: 'name', type: 'text', value: 'Customer' },
      });
      app.find(node => node.type === 'RadioGroup').props.onValueChange('express');
      if (wedding) {
        app.find(node => node.type === 'Checkbox' && node.props.name === 'isFont').props.onCheckedChange(true);
      } else {
        const controls = nodes(app.find(node => node.type === 'form')).filter(node => node.type === 'Checkbox' && node.props.onCheckedChange);
        controls[1].props.onCheckedChange(true);
      }
      app.find(node => node.props?.id === (wedding ? 'file' : 'payment-file-ak')).props.onChange({
        target: { name: 'file', type: 'file', files: [file] },
      });
      await app.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
      await app.flushEffects();
      const upload = app.requests.find(({ method }) => method === 'POST');
      assert.ok(upload, 'Existing default upload must succeed');
      assert.equal(upload.url, `${apiBase}${uploadUrl}${suffix}`);
      assert.equal(upload.body.get('payment'), file);
      assert.deepEqual(JSON.parse(upload.body.get('data')), {
        name: 'Customer', paket: 'express', isMusic: false, isFont: true,
        totalPayment: 125000, isFloatingBar: false, ...(!wedding ? { themaPrice: 75000 } : {}),
      });
      assert.equal(upload.options.headers['Content-Type'], 'multipart/form-data');
      for (const request of app.requests) {
        assert.equal(request.options.withCredentials, formId === '123', `${request.method} ${request.url}`);
        assert.equal(request.options.headers.Authorization, formId === '123' ? 'Bearer customer-session-token' : undefined);
      }
      assert.equal(app.notifications.some(({ variant }) => variant === 'destructive'), false);
      assert.ok(app.notifications.some(({ title }) => title === (wedding ? 'Payment submitted successfully!' : 'Bukti pembayaran berhasil dikirim')));
      assert.ok(app.find(node => node.type === (wedding ? 'h2' : 'DialogTitle') && node.props.children === 'Pembayaran Anda'));
    });
  }
  }
}
