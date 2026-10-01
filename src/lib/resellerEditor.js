const ORDER_TYPES = new Set(['wedding', 'aqiqah-khitan']);

export function isResellerEditorOrder(type, id) {
  return ORDER_TYPES.has(type) && /^[1-9]\d*$/.test(String(id || '')) && Number.isSafeInteger(Number(id));
}

export function createResellerEditorApi(request, type, id) {
  if (!isResellerEditorOrder(type, id)) return null;
  const path = `/forms/${type}/${id}`;
  return {
    load: () => request(`${path}/edit`),
    save: data => request(`${path}/edit`, { method: 'PUT', data }),
    removeRekening: rekeningId => {
      if (type !== 'wedding' || !/^[1-9]\d*$/.test(String(rekeningId || ''))) {
        return Promise.reject(new Error('Rekening tidak valid.'));
      }
      return request(`${path}/rekening/${rekeningId}`, { method: 'DELETE' });
    },
  };
}

// The edit endpoint specifies content fields; response metadata is never echoed.
export function selectEditableFormFields(form, editableFields) {
  const allowed = new Set(Array.isArray(editableFields) ? editableFields : []);
  return Object.fromEntries(Object.entries(form).filter(([key]) => allowed.has(key)));
}
