// Carry reseller and other form parameters through the existing internal routes.
export function appendFormQuery(path, searchParams) {
  const current = new URLSearchParams(searchParams?.toString());
  if (!current.size || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;

  const hashIndex = path.indexOf('#');
  const hash = hashIndex < 0 ? '' : path.slice(hashIndex);
  const address = hashIndex < 0 ? path : path.slice(0, hashIndex);
  const queryIndex = address.indexOf('?');
  const pathname = queryIndex < 0 ? address : address.slice(0, queryIndex);
  const target = new URLSearchParams(queryIndex < 0 ? '' : address.slice(queryIndex + 1));
  const targetKeys = new Set(target.keys());

  for (const [key, value] of current) {
    if (!targetKeys.has(key)) target.append(key, value);
  }

  return `${pathname}?${target}${hash}`;
}
