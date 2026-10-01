import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/lib/resellerEditor.js', import.meta.url), 'utf8');
const module = new vm.SourceTextModule(source);
await module.link(() => { throw new Error('Unexpected dependency'); });
await module.evaluate();
const { createResellerEditorApi, isResellerEditorOrder, selectEditableFormFields } = module.namespace;

test('reseller editors accept numeric order IDs only for supported invitation types', () => {
  for (const type of ['wedding', 'aqiqah-khitan']) {
    assert.equal(isResellerEditorOrder(type, '12'), true);
    for (const id of ['opaque-uuid', '../12', '1/edit', '0', '-1', '1.2', '9007199254740992']) {
      assert.equal(isResellerEditorOrder(type, id), false);
      assert.equal(createResellerEditorApi(() => assert.fail('Invalid editor must not request'), type, id), null);
    }
  }
  assert.equal(isResellerEditorOrder('admin', 12), false);
});

test('load, save, and bank removal remain on the authenticated reseller resource', async () => {
  const requests = [];
  const request = async (path, options) => { requests.push({ path, options }); return { data: { ok: true } }; };
  for (const type of ['wedding', 'aqiqah-khitan']) {
    const editor = createResellerEditorApi(request, type, '12');
    await editor.load();
    const payload = { name: 'Customer baru' };
    await editor.save(payload);
    assert.equal(requests.at(-2).path, `/forms/${type}/12/edit`);
    assert.equal(requests.at(-1).path, `/forms/${type}/12/edit`);
    assert.equal(requests.at(-1).options.method, 'PUT');
    assert.equal(requests.at(-1).options.data, payload);
  }
  const wedding = createResellerEditorApi(request, 'wedding', 12);
  await wedding.removeRekening(34);
  assert.equal(requests.at(-1).path, '/forms/wedding/12/rekening/34');
  assert.equal(requests.at(-1).options.method, 'DELETE');
  const count = requests.length;
  await assert.rejects(wedding.removeRekening('../34'));
  await assert.rejects(createResellerEditorApi(request, 'aqiqah-khitan', 12).removeRekening(34));
  assert.equal(requests.length, count);
});

test('saving content excludes readonly order metadata and unrelated account fields', () => {
  const data = {
    id: 12, uuid: 'private-capability', name: 'Customer baru', nomorWa: '08123456789',
    isPaid: 1, payment: { id: 91 }, resellerId: 3, brandSlug: 'brand', role: 'admin',
    customer: { email: 'private@example.test' }, rekening: [{ id: 8, namaRekening: 'Customer' }],
  };
  const payload = selectEditableFormFields(data, ['name', 'nomorWa', 'rekening']);
  assert.deepEqual(Object.keys(payload), ['name', 'nomorWa', 'rekening']);
  assert.equal(payload.name, 'Customer baru');
  assert.equal(payload.rekening[0].id, 8);
  assert.deepEqual(selectEditableFormFields(data), {});
});
